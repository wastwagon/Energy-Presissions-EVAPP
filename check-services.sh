#!/bin/bash

echo "=========================================="
echo "Docker Services Status Check"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}1. Checking Docker containers...${NC}"
echo ""

# Check all ev-billing containers
CONTAINERS=$(docker ps -a --format "{{.Names}}" | grep -E "ev-billing|csms")

if [ -z "$CONTAINERS" ]; then
    echo -e "${RED}❌ No EV Billing containers found${NC}"
    echo ""
    echo "Available containers:"
    docker ps -a --format "table {{.Names}}\t{{.Status}}"
    exit 1
fi

# Check running containers
RUNNING=$(docker ps --format "{{.Names}}" | grep -E "ev-billing|csms")

echo "Container Status:"
echo "-----------------"

for container in $CONTAINERS; do
    STATUS=$(docker inspect --format='{{.State.Status}}' $container 2>/dev/null)
    HEALTH=$(docker inspect --format='{{.State.Health.Status}}' $container 2>/dev/null)
    
    if [ "$STATUS" = "running" ]; then
        if [ "$HEALTH" = "healthy" ] || [ "$HEALTH" = "" ]; then
            echo -e "  ${GREEN}✅${NC} $container - Running"
        else
            echo -e "  ${YELLOW}⚠️${NC}  $container - Running (Health: $HEALTH)"
        fi
    else
        echo -e "  ${RED}❌${NC} $container - $STATUS"
    fi
done

echo ""
echo -e "${BLUE}2. Checking service endpoints...${NC}"
echo ""

# Check Backend API
echo -n "Backend API (http://localhost:3000): "
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>&1)
if [ "$BACKEND_STATUS" = "200" ] || [ "$BACKEND_STATUS" = "404" ]; then
    echo -e "${GREEN}✅ Responding (HTTP $BACKEND_STATUS)${NC}"
else
    BACKEND_STATUS2=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health 2>&1)
    if [ "$BACKEND_STATUS2" = "200" ]; then
        echo -e "${GREEN}✅ Responding (HTTP $BACKEND_STATUS2)${NC}"
    else
        echo -e "${RED}❌ Not responding${NC}"
    fi
fi

# Check Frontend
echo -n "Frontend (http://localhost:8080): "
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 2>&1)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Running (HTTP $FRONTEND_STATUS)${NC}"
else
    echo -e "${RED}❌ Not responding (HTTP $FRONTEND_STATUS)${NC}"
fi

# Check OCPP Gateway
echo -n "OCPP Gateway (http://localhost:9000): "
OCPP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9000 2>&1)
if [ "$OCPP_STATUS" = "200" ] || [ "$OCPP_STATUS" = "400" ] || [ "$OCPP_STATUS" = "426" ]; then
    echo -e "${GREEN}✅ Running (HTTP $OCPP_STATUS)${NC}"
else
    echo -e "${YELLOW}⚠️  Not responding (HTTP $OCPP_STATUS) - May be WebSocket only${NC}"
fi

# Check PostgreSQL
echo -n "PostgreSQL (localhost:5432): "
PG_STATUS=$(docker exec ev-billing-postgres pg_isready -U evbilling 2>&1 | grep -q "accepting" && echo "ready" || echo "not ready")
if [ "$PG_STATUS" = "ready" ]; then
    echo -e "${GREEN}✅ Ready${NC}"
else
    echo -e "${RED}❌ Not ready${NC}"
fi

# Check Redis
echo -n "Redis (localhost:6379): "
REDIS_STATUS=$(docker exec ev-billing-redis redis-cli ping 2>&1 | grep -q "PONG" && echo "ready" || echo "not ready")
if [ "$REDIS_STATUS" = "ready" ]; then
    echo -e "${GREEN}✅ Ready${NC}"
else
    echo -e "${RED}❌ Not ready${NC}"
fi

echo ""
echo -e "${BLUE}3. Checking backend logs (last 10 lines)...${NC}"
echo ""

BACKEND_CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "csms-api|backend" | head -1)

if [ -n "$BACKEND_CONTAINER" ]; then
    echo "Container: $BACKEND_CONTAINER"
    docker logs $BACKEND_CONTAINER --tail 10 2>&1 | tail -10
else
    echo -e "${RED}❌ Backend container not found${NC}"
fi

echo ""
echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""

# Count running services
RUNNING_COUNT=$(echo "$RUNNING" | wc -l | tr -d ' ')
TOTAL_COUNT=$(echo "$CONTAINERS" | wc -l | tr -d ' ')

echo "Running: $RUNNING_COUNT / $TOTAL_COUNT services"
echo ""

if [ "$RUNNING_COUNT" -eq "$TOTAL_COUNT" ]; then
    echo -e "${GREEN}✅ All services are running!${NC}"
else
    echo -e "${YELLOW}⚠️  Some services are not running${NC}"
    echo ""
    echo "To start all services, run:"
    echo "  docker-compose up -d"
    echo ""
    echo "To restart a specific service:"
    echo "  docker restart <container-name>"
fi

echo ""


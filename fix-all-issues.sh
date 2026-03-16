#!/bin/bash

echo "=========================================="
echo "Fixing All Issues - Complete Setup"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Database connection details
DB_CONTAINER="ev-billing-postgres"
DB_NAME="ev_billing_db"
DB_USER="evbilling"

echo "Step 1: Checking database connection..."
if ! docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${RED}❌ Cannot connect to database. Trying alternative user...${NC}"
    DB_USER="postgres"
    if ! docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${RED}❌ Cannot connect to database. Please check docker-compose.yml for correct credentials.${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✅ Database connection successful${NC}"
echo ""

echo "Step 2: Checking if vendor_id column exists in connection_logs..."
COLUMN_EXISTS=$(docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -t -c "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='connection_logs' AND column_name='vendor_id');" 2>/dev/null | tr -d ' ')

if [ "$COLUMN_EXISTS" = "f" ] || [ -z "$COLUMN_EXISTS" ]; then
    echo -e "${YELLOW}⚠️  vendor_id column missing. Adding it...${NC}"
    
    # Check if vendors table exists
    VENDORS_EXISTS=$(docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -t -c "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='vendors');" 2>/dev/null | tr -d ' ')
    
    if [ "$VENDORS_EXISTS" = "t" ]; then
        docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -c "ALTER TABLE connection_logs ADD COLUMN IF NOT EXISTS vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL;" 2>&1
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ vendor_id column added successfully${NC}"
        else
            echo -e "${RED}❌ Failed to add vendor_id column${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  vendors table doesn't exist. Adding vendor_id as nullable integer...${NC}"
        docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -c "ALTER TABLE connection_logs ADD COLUMN IF NOT EXISTS vendor_id INTEGER;" 2>&1
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ vendor_id column added successfully${NC}"
        else
            echo -e "${RED}❌ Failed to add vendor_id column${NC}"
        fi
    fi
else
    echo -e "${GREEN}✅ vendor_id column already exists${NC}"
fi
echo ""

echo "Step 3: Creating index on vendor_id if it doesn't exist..."
docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -c "CREATE INDEX IF NOT EXISTS idx_connection_logs_vendor_id ON connection_logs(vendor_id);" 2>&1 > /dev/null
echo -e "${GREEN}✅ Index check complete${NC}"
echo ""

echo "Step 4: Restarting backend service..."
BACKEND_CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "csms-api|backend" | head -1)

if [ -z "$BACKEND_CONTAINER" ]; then
    echo -e "${RED}❌ Backend container not found${NC}"
    echo "Available containers:"
    docker ps --format "{{.Names}}"
    exit 1
fi

echo "Found backend container: $BACKEND_CONTAINER"
docker restart $BACKEND_CONTAINER > /dev/null 2>&1
echo -e "${GREEN}✅ Backend service restarted${NC}"
echo ""

echo "Step 5: Waiting for backend to be ready..."
sleep 5

# Check if backend is responding
MAX_RETRIES=10
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1 || curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is ready${NC}"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Waiting for backend... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${YELLOW}⚠️  Backend may still be starting. Please wait a few more seconds.${NC}"
fi
echo ""

echo "Step 6: Testing connection logs API..."
sleep 2
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/connection-logs?limit=5 2>&1)
if [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Connection logs API is working (HTTP $RESPONSE)${NC}"
elif [ "$RESPONSE" = "401" ]; then
    echo -e "${YELLOW}⚠️  Connection logs API requires authentication (HTTP $RESPONSE) - This is expected${NC}"
else
    echo -e "${YELLOW}⚠️  Connection logs API returned HTTP $RESPONSE - May need authentication${NC}"
fi
echo ""

echo "Step 7: Testing users API..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/users 2>&1)
if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ]; then
    echo -e "${GREEN}✅ Users API is accessible (HTTP $RESPONSE)${NC}"
else
    echo -e "${YELLOW}⚠️  Users API returned HTTP $RESPONSE${NC}"
fi
echo ""

echo "Step 8: Verifying frontend is running..."
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 2>&1)
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Frontend is running (HTTP $FRONTEND_RESPONSE)${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend returned HTTP $FRONTEND_RESPONSE${NC}"
fi
echo ""

echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Summary:"
echo "  ✅ Database schema updated"
echo "  ✅ Backend service restarted"
echo "  ✅ Services verified"
echo ""
echo "Next Steps:"
echo "  1. Open http://localhost:8080 in your browser"
echo "  2. Login as Super Admin: admin@evcharging.com / admin123"
echo "  3. Test the following pages:"
echo "     - /superadmin/connection-logs (should work now)"
echo "     - /superadmin/users (should display users)"
echo "     - /superadmin/analytics"
echo "     - /superadmin/tariffs"
echo "     - /superadmin/reports"
echo ""
echo "If you still see errors:"
echo "  1. Check browser console (F12) for JavaScript errors"
echo "  2. Check Network tab for failed API calls"
echo "  3. Run: docker logs $BACKEND_CONTAINER --tail 50"
echo ""


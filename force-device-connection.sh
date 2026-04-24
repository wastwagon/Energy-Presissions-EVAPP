#!/bin/bash

DEVICE_IP="192.168.8.139"
OCPP_GATEWAY_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

echo "=========================================="
echo "Force Device Connection Setup"
echo "=========================================="
echo ""
echo "Device IP: $DEVICE_IP"
echo "CSMS API IP: $OCPP_GATEWAY_IP"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Step 1: Verify embedded OCPP endpoint is accessible${NC}"
echo "----------------------------------------"
OCPP_CONTAINER=$(docker ps --format "{{.Names}}" | grep csms-api)
if [ -n "$OCPP_CONTAINER" ]; then
    echo -e "${GREEN}✅ CSMS API is running${NC}"
    echo "   Container: $OCPP_CONTAINER"
    echo "   Local URL: ws://localhost:3000/ocpp/{chargePointId}"
    echo "   Network URL: ws://$OCPP_GATEWAY_IP:3000/ocpp/{chargePointId}"
else
    echo -e "${RED}❌ CSMS API is not running${NC}"
    echo "   Starting csms-api..."
    docker-compose up -d csms-api
    sleep 5
fi
echo ""

echo -e "${BLUE}Step 2: Check OCPP logs for connections${NC}"
echo "----------------------------------------"
echo "Recent connection attempts:"
docker logs ev-billing-csms-api --tail 40 2>&1 | grep -iE "ocpp|connection|connect|192.168.8.139" | tail -8 || echo "   No recent connections from device"
echo ""

echo -e "${BLUE}Step 3: Test API accessibility${NC}"
echo "----------------------------------------"
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API is accessible locally${NC}"
else
    echo -e "${YELLOW}⚠️  API health endpoint did not respond${NC}"
fi
echo ""

echo -e "${BLUE}Step 4: Network Configuration Information${NC}"
echo "----------------------------------------"
echo "To connect your device, configure it with:"
echo ""
echo -e "${GREEN}OCPP Central System URL:${NC}"
echo "   ws://$OCPP_GATEWAY_IP:3000/ocpp/{chargePointId}"
echo ""
echo -e "${GREEN}Alternative URLs to try:${NC}"
echo "   ws://192.168.8.137:3000/ocpp/{chargePointId}"
echo "   ws://localhost:3000/ocpp/{chargePointId} (if device supports localhost)"
echo ""
echo -e "${GREEN}Protocol:${NC} OCPP 1.6J"
echo ""
echo -e "${GREEN}Charge Point ID:${NC} (Check device manual or use device serial number)"
echo ""

echo -e "${BLUE}Step 5: Monitor for Device Connection${NC}"
echo "----------------------------------------"
echo "Monitoring API logs for OCPP device connection..."
echo "Press Ctrl+C to stop monitoring"
echo ""
echo "Waiting for device to connect..."
echo ""

# Monitor logs for 60 seconds
timeout 60 docker logs -f ev-billing-csms-api 2>&1 | grep --line-buffered -iE "ocpp|connection|connect|192.168.8.139|charge.*point|bootnotification" || echo "No connection detected in 60 seconds"

echo ""
echo "=========================================="
echo "Next Steps"
echo "=========================================="
echo ""
echo "1. Configure your device with:"
echo "   - OCPP URL: ws://$OCPP_GATEWAY_IP:3000/ocpp/{chargePointId}"
echo "   - Charge Point ID: (from device)"
echo ""
echo "2. Check device connection:"
echo "   docker logs ev-billing-csms-api --tail 80 | grep -i ocpp"
echo ""
echo "3. View registered devices:"
echo "   - Login to http://localhost:8080"
echo "   - Go to Super Admin → Device Inventory"
echo ""
echo "4. If device still doesn't connect:"
echo "   - Check device manual for OCPP configuration"
echo "   - Verify device supports OCPP 1.6J"
echo "   - Check device firewall settings"
echo ""


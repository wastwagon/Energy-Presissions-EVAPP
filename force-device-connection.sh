#!/bin/bash

DEVICE_IP="192.168.8.139"
OCPP_GATEWAY_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

echo "=========================================="
echo "Force Device Connection Setup"
echo "=========================================="
echo ""
echo "Device IP: $DEVICE_IP"
echo "OCPP Gateway IP: $OCPP_GATEWAY_IP"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Step 1: Verify OCPP Gateway is accessible${NC}"
echo "----------------------------------------"
OCPP_CONTAINER=$(docker ps --format "{{.Names}}" | grep ocpp-gateway)
if [ -n "$OCPP_CONTAINER" ]; then
    echo -e "${GREEN}✅ OCPP Gateway is running${NC}"
    echo "   Container: $OCPP_CONTAINER"
    echo "   Local URL: ws://localhost:9000"
    echo "   Network URL: ws://$OCPP_GATEWAY_IP:9000"
else
    echo -e "${RED}❌ OCPP Gateway is not running${NC}"
    echo "   Starting OCPP Gateway..."
    docker-compose up -d ocpp-gateway
    sleep 5
fi
echo ""

echo -e "${BLUE}Step 2: Check OCPP Gateway logs for connections${NC}"
echo "----------------------------------------"
echo "Recent connection attempts:"
docker logs ev-billing-ocpp-gateway --tail 20 2>&1 | grep -iE "connection|connect|192.168.8.139" | tail -5 || echo "   No recent connections from device"
echo ""

echo -e "${BLUE}Step 3: Test OCPP Gateway accessibility${NC}"
echo "----------------------------------------"
if curl -s http://localhost:9000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ OCPP Gateway is accessible locally${NC}"
else
    echo -e "${YELLOW}⚠️  OCPP Gateway may be WebSocket-only (this is normal)${NC}"
fi
echo ""

echo -e "${BLUE}Step 4: Network Configuration Information${NC}"
echo "----------------------------------------"
echo "To connect your device, configure it with:"
echo ""
echo -e "${GREEN}OCPP Central System URL:${NC}"
echo "   ws://$OCPP_GATEWAY_IP:9000"
echo ""
echo -e "${GREEN}Alternative URLs to try:${NC}"
echo "   ws://192.168.8.137:9000"
echo "   ws://localhost:9000 (if device supports localhost)"
echo ""
echo -e "${GREEN}Protocol:${NC} OCPP 1.6J"
echo ""
echo -e "${GREEN}Charge Point ID:${NC} (Check device manual or use device serial number)"
echo ""

echo -e "${BLUE}Step 5: Monitor for Device Connection${NC}"
echo "----------------------------------------"
echo "Monitoring OCPP Gateway for device connection..."
echo "Press Ctrl+C to stop monitoring"
echo ""
echo "Waiting for device to connect..."
echo ""

# Monitor logs for 60 seconds
timeout 60 docker logs -f ev-billing-ocpp-gateway 2>&1 | grep --line-buffered -iE "connection|connect|192.168.8.139|charge.*point" || echo "No connection detected in 60 seconds"

echo ""
echo "=========================================="
echo "Next Steps"
echo "=========================================="
echo ""
echo "1. Configure your device with:"
echo "   - OCPP URL: ws://$OCPP_GATEWAY_IP:9000"
echo "   - Charge Point ID: (from device)"
echo ""
echo "2. Check device connection:"
echo "   docker logs ev-billing-ocpp-gateway --tail 50"
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


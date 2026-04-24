#!/bin/bash

# Device Connection Test Script
# Tests connectivity and embedded OCPP accessibility (via csms-api)

DEVICE_IP="192.168.9.106"
SYSTEM_IP="192.168.9.101"
CHARGE_POINT_ID="0900330710111935"
OCPP_PORT="3000"

echo "=========================================="
echo "Device Connection Diagnostic Test"
echo "=========================================="
echo ""
echo "Device IP: $DEVICE_IP"
echo "System IP: $SYSTEM_IP"
echo "Charge Point ID: $CHARGE_POINT_ID"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test 1: Device Reachability
echo -e "${BLUE}1. Testing Device Reachability${NC}"
echo "--------------------------------"
if ping -c 3 -W 2 $DEVICE_IP > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Device is reachable${NC}"
    ping -c 3 $DEVICE_IP 2>&1 | tail -1
else
    echo -e "${RED}❌ Device is NOT reachable${NC}"
    echo "   Possible reasons:"
    echo "   - Device is rebooting (wait 2-3 minutes)"
    echo "   - Device changed IP address after reboot"
    echo "   - Network connectivity issue"
    echo ""
    echo "   Checking ARP table..."
    arp -n $DEVICE_IP 2>&1 || echo "   Device not in ARP table"
fi
echo ""

# Test 2: API Health (embedded OCPP)
echo -e "${BLUE}2. Testing API Health (embedded OCPP)${NC}"
echo "--------------------------------"
if curl -s http://localhost:$OCPP_PORT/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ CSMS API is running${NC}"
    echo "   Health check: $(curl -s http://localhost:$OCPP_PORT/health)"
else
    echo -e "${RED}❌ CSMS API is not responding${NC}"
fi
echo ""

# Test 3: OCPP Network Binding
echo -e "${BLUE}3. Testing OCPP Network Binding${NC}"
echo "--------------------------------"
if nc -zv -w 2 $SYSTEM_IP $OCPP_PORT > /dev/null 2>&1; then
    echo -e "${GREEN}✅ OCPP port is accessible from network${NC}"
    echo "   Port $OCPP_PORT is open on $SYSTEM_IP"
else
    echo -e "${RED}❌ OCPP port is NOT accessible from network${NC}"
    echo "   Port $OCPP_PORT is not accessible on $SYSTEM_IP"
    echo "   This is a CRITICAL issue - device cannot connect!"
    echo ""
    echo "   Checking Docker port mapping..."
    docker port ev-billing-csms-api 2>&1 | grep $OCPP_PORT || echo "   Port mapping issue"
fi
echo ""

# Test 4: Check Recent Connection Attempts
echo -e "${BLUE}4. Checking Connection Logs${NC}"
echo "--------------------------------"
echo "Recent OCPP logs (last 80 lines):"
echo ""
RECENT_LOGS=$(docker logs ev-billing-csms-api --tail 80 2>&1 | grep -iE "connection|$CHARGE_POINT_ID|$DEVICE_IP|websocket|boot|ocpp" | tail -12)
if [ -n "$RECENT_LOGS" ]; then
    echo -e "${GREEN}Found connection-related logs:${NC}"
    echo "$RECENT_LOGS"
else
    echo -e "${YELLOW}⚠️  No connection attempts found${NC}"
    echo "   Device may not have attempted connection yet"
fi
echo ""

# Test 5: Database Check
echo -e "${BLUE}5. Checking Database Registration${NC}"
echo "--------------------------------"
DB_RESULT=$(docker exec ev-billing-postgres psql -U evbilling -d ev_billing_db -t -c "SELECT COUNT(*) FROM charge_points WHERE charge_point_id = '$CHARGE_POINT_ID';" 2>&1 | tr -d ' ')
if [ "$DB_RESULT" = "1" ]; then
    echo -e "${GREEN}✅ Charge point is registered in database${NC}"
    docker exec ev-billing-postgres psql -U evbilling -d ev_billing_db -c "SELECT charge_point_id, status, last_seen, last_heartbeat FROM charge_points WHERE charge_point_id = '$CHARGE_POINT_ID';" 2>&1 | tail -3
else
    echo -e "${YELLOW}⚠️  Charge point NOT registered in database${NC}"
    echo "   Device needs to connect and send BootNotification"
fi
echo ""

# Test 6: Configuration Verification
echo -e "${BLUE}6. Configuration Verification${NC}"
echo "--------------------------------"
echo "Expected OCPP Server URL:"
echo -e "${GREEN}ws://$SYSTEM_IP:$OCPP_PORT/ocpp/$CHARGE_POINT_ID${NC}"
echo ""
echo "⚠️  IMPORTANT: The device configuration must include:"
echo "   - Full URL: ws://$SYSTEM_IP:$OCPP_PORT/ocpp/$CHARGE_POINT_ID"
echo "   - NOT just: ws://$SYSTEM_IP:$OCPP_PORT/ocpp/"
echo "   - Charge Point ID must be at the end of the URL"
echo ""

# Test 7: Network Route Check
echo -e "${BLUE}7. Network Route Check${NC}"
echo "--------------------------------"
LOCAL_IP=$(ifconfig | grep -E "inet " | grep -v 127.0.0.1 | grep "192.168.9" | head -1 | awk '{print $2}')
if [ -n "$LOCAL_IP" ]; then
    LOCAL_SUBNET=$(echo $LOCAL_IP | cut -d. -f1-3)
    DEVICE_SUBNET=$(echo $DEVICE_IP | cut -d. -f1-3)
    
    if [ "$LOCAL_SUBNET" = "$DEVICE_SUBNET" ]; then
        echo -e "${GREEN}✅ Both devices on same subnet${NC}"
        echo "   System IP: $LOCAL_IP"
        echo "   Device IP: $DEVICE_IP"
        echo "   Subnet: $LOCAL_SUBNET.0/24"
    else
        echo -e "${YELLOW}⚠️  Devices may be on different subnets${NC}"
        echo "   System IP: $LOCAL_IP (subnet: $LOCAL_SUBNET.0/24)"
        echo "   Device IP: $DEVICE_IP (subnet: $DEVICE_SUBNET.0/24)"
    fi
else
    echo -e "${YELLOW}⚠️  Could not determine system IP${NC}"
fi
echo ""

# Summary
echo "=========================================="
echo "Summary & Recommendations"
echo "=========================================="
echo ""

# Check if device is reachable
if ping -c 1 -W 1 $DEVICE_IP > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Device is online${NC}"
else
    echo -e "${RED}❌ Device is offline${NC}"
    echo "   Action: Wait 2-3 minutes for device to finish rebooting"
    echo "   Then run this script again"
    echo ""
fi

# Check OCPP accessibility
if nc -zv -w 1 $SYSTEM_IP $OCPP_PORT > /dev/null 2>&1; then
    echo -e "${GREEN}✅ OCPP endpoint is accessible${NC}"
else
    echo -e "${RED}❌ OCPP endpoint is NOT accessible from network${NC}"
    echo "   Action: Restart API container:"
    echo "   docker restart ev-billing-csms-api"
    echo ""
fi

# Check configuration
echo "Configuration Checklist:"
echo "1. Device OCPP URL must be: ${GREEN}ws://$SYSTEM_IP:$OCPP_PORT/ocpp/$CHARGE_POINT_ID${NC}"
echo "2. Device must have rebooted after configuration"
echo "3. OCPP Gateway must be running and accessible"
echo "4. Both devices must be on same network"
echo ""

echo "Next Steps:"
echo "1. Verify device configuration includes full URL with Charge Point ID"
echo "2. Ensure device has rebooted (wait 2-3 minutes)"
echo "3. Monitor connection logs:"
echo "   ${BLUE}docker logs -f ev-billing-csms-api | grep -i ocpp${NC}"
echo "4. Check dashboard: http://localhost:8080"
echo ""

echo "=========================================="

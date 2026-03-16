#!/bin/bash

DEVICE_IP="192.168.0.100"

echo "=========================================="
echo "Device Discovery Test for $DEVICE_IP"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get local IP
LOCAL_IP=$(ifconfig | grep -E "inet " | grep -v 127.0.0.1 | grep "192.168.0" | head -1 | awk '{print $2}')
LOCAL_SUBNET=$(echo $LOCAL_IP | cut -d. -f1-3)
DEVICE_SUBNET=$(echo $DEVICE_IP | cut -d. -f1-3)

echo -e "${BLUE}Network Information:${NC}"
echo "----------------------------"
echo "Your IP: $LOCAL_IP"
echo "Device IP: $DEVICE_IP"
if [ "$LOCAL_SUBNET" = "$DEVICE_SUBNET" ]; then
    echo -e "${GREEN}✅ Device is on same subnet ($LOCAL_SUBNET.0/24)${NC}"
else
    echo -e "${YELLOW}⚠️  Device may be on different subnet${NC}"
fi
echo ""

# Step 1: Ping test
echo -e "${BLUE}1. Network Connectivity Test${NC}"
echo "----------------------------"
if ping -c 3 -W 2 $DEVICE_IP > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Device is reachable on network${NC}"
    PING_RESULT=$(ping -c 3 $DEVICE_IP 2>&1 | tail -1)
    echo "   $PING_RESULT"
else
    echo -e "${RED}❌ Device is NOT reachable on network${NC}"
    echo "   Possible issues:"
    echo "   - Device is not connected to WiFi/Ethernet"
    echo "   - Wrong IP address"
    echo "   - Firewall blocking ICMP"
    echo "   - Device is powered off"
    echo "   - Device is on different network segment"
fi
echo ""

# Step 2: ARP Table Check
echo -e "${BLUE}2. ARP Table Check${NC}"
echo "----------------------"
ARP_INFO=$(arp -n $DEVICE_IP 2>/dev/null)
if [ -n "$ARP_INFO" ]; then
    echo -e "${GREEN}✅ Device found in ARP table${NC}"
    echo "$ARP_INFO"
    if echo "$ARP_INFO" | grep -q "incomplete"; then
        echo -e "${YELLOW}⚠️  MAC address incomplete - device may be offline${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Device not in ARP table${NC}"
    echo "   Try pinging the device first to populate ARP table"
fi
echo ""

# Step 3: Port scan
echo -e "${BLUE}3. Port Scan (Common EV Charger Ports)${NC}"
echo "----------------------------------------"
PORTS=(80 443 8080 9000 8081 8443 9001)
OPEN_PORTS=()

for port in "${PORTS[@]}"; do
    if timeout 2 bash -c "nc -zv -w 1 $DEVICE_IP $port" > /dev/null 2>&1; then
        echo -e "   Port $port: ${GREEN}✅ OPEN${NC}"
        OPEN_PORTS+=($port)
    else
        echo -e "   Port $port: ${RED}❌ CLOSED${NC}"
    fi
done
echo ""

# Step 4: HTTP/Web Interface Test
echo -e "${BLUE}4. Web Interface Test${NC}"
echo "----------------------"
for port in 80 443 8080 8081; do
    echo -n "   Testing http://$DEVICE_IP:$port ... "
    HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://$DEVICE_IP:$port 2>&1)
    if [ "$HTTP_RESPONSE" = "200" ] || [ "$HTTP_RESPONSE" = "301" ] || [ "$HTTP_RESPONSE" = "302" ]; then
        echo -e "${GREEN}✅ Responding (HTTP $HTTP_RESPONSE)${NC}"
        echo "   Try opening: http://$DEVICE_IP:$port in your browser"
    elif [ "$HTTP_RESPONSE" != "000" ]; then
        echo -e "${YELLOW}⚠️  HTTP $HTTP_RESPONSE${NC}"
    else
        echo -e "${RED}❌ Not responding${NC}"
    fi
done
echo ""

# Step 5: OCPP WebSocket Test
echo -e "${BLUE}5. OCPP WebSocket Test${NC}"
echo "----------------------"
echo -n "   Testing ws://$DEVICE_IP:9000 ... "
if timeout 2 bash -c "nc -zv -w 1 $DEVICE_IP 9000" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Port 9000 is open${NC}"
    echo "   Device may support OCPP WebSocket connections"
else
    echo -e "${RED}❌ Port 9000 is closed${NC}"
    echo "   Device may not be configured for OCPP WebSocket"
fi
echo ""

# Step 6: Check Database for Registered Device
echo -e "${BLUE}6. Database Check${NC}"
echo "----------------------"
DB_RESULT=$(docker exec ev-billing-postgres psql -U evbilling -d ev_billing_db -t -c "SELECT charge_point_id, status, last_seen FROM charge_points WHERE charge_point_id LIKE '%0900330710111935%' OR charge_point_id LIKE '%100%';" 2>/dev/null | xargs)
if [ -n "$DB_RESULT" ]; then
    echo -e "${GREEN}✅ Found registered charge point in database${NC}"
    docker exec ev-billing-postgres psql -U evbilling -d ev_billing_db -c "SELECT charge_point_id, status, last_seen, last_heartbeat FROM charge_points WHERE charge_point_id LIKE '%0900330710111935%' OR charge_point_id LIKE '%100%';" 2>/dev/null
else
    echo -e "${YELLOW}⚠️  No charge point found in database for this IP${NC}"
fi
echo ""

# Step 7: OCPP Gateway Status
echo -e "${BLUE}7. OCPP Gateway Status${NC}"
echo "----------------------"
OCPP_GATEWAY=$(docker ps --format "{{.Names}}" | grep ocpp-gateway)
if [ -n "$OCPP_GATEWAY" ]; then
    echo -e "${GREEN}✅ OCPP Gateway is running${NC}"
    echo "   Container: $OCPP_GATEWAY"
    echo "   Gateway URL: ws://$LOCAL_IP:9000/ocpp/{chargePointId}"
    echo ""
    echo "   To connect your device, configure it with:"
    echo "   - OCPP Central System URL: ws://$LOCAL_IP:9000/ocpp/"
    echo "   - Charge Point ID: 0900330710111935 (from database)"
else
    echo -e "${RED}❌ OCPP Gateway is not running${NC}"
    echo "   Start it with: docker-compose up -d ocpp-gateway"
fi
echo ""

# Step 8: Check Recent OCPP Gateway Logs
echo -e "${BLUE}8. Recent OCPP Gateway Activity${NC}"
echo "----------------------"
RECENT_LOGS=$(docker logs --tail 20 ev-billing-ocpp-gateway 2>&1 | grep -i "0900330710111935\|192.168.0.100\|connection\|boot" | tail -5)
if [ -n "$RECENT_LOGS" ]; then
    echo "$RECENT_LOGS"
else
    echo -e "${YELLOW}⚠️  No recent activity for this device${NC}"
fi
echo ""

# Summary
echo "=========================================="
echo "Summary & Recommendations"
echo "=========================================="
echo ""

if [ ${#OPEN_PORTS[@]} -gt 0 ]; then
    echo -e "${GREEN}✅ Device is responding on ports: ${OPEN_PORTS[*]}${NC}"
    echo ""
    echo "Next Steps:"
    echo "1. Try accessing web interface:"
    for port in "${OPEN_PORTS[@]}"; do
        if [[ "80 443 8080 8081" == *"$port"* ]]; then
            echo "   - http://$DEVICE_IP:$port"
        fi
    done
    echo ""
    echo "2. Configure OCPP connection:"
    echo "   - Charge Point ID: 0900330710111935"
    echo "   - Central System URL: ws://$LOCAL_IP:9000/ocpp/"
else
    echo -e "${RED}❌ Device is NOT currently discoverable${NC}"
    echo ""
    echo "Device Status: OFFLINE or NOT REACHABLE"
    echo ""
    echo "Troubleshooting Steps:"
    echo "1. Check if device is powered on"
    echo "2. Verify device is connected to network (WiFi/Ethernet)"
    echo "3. Check device display for current IP address"
    echo "4. Verify device is on same network segment ($LOCAL_SUBNET.0/24)"
    echo "5. Try accessing device web interface if available"
    echo "6. Check device firewall settings"
    echo ""
    echo "Note: Device was previously registered (last seen: 2025-12-17)"
    echo "      Charge Point ID: 0900330710111935"
fi

echo ""
echo "=========================================="


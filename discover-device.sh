#!/bin/bash

DEVICE_IP="192.168.8.139"

echo "=========================================="
echo "EV Charger Device Discovery"
echo "=========================================="
echo ""
echo "Device IP: $DEVICE_IP"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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
    echo "   - Device is not connected to WiFi"
    echo "   - Wrong IP address"
    echo "   - Firewall blocking ICMP"
    echo "   - Device is on different network segment"
fi
echo ""

# Step 2: Port scan
echo -e "${BLUE}2. Port Scan (Common EV Charger Ports)${NC}"
echo "----------------------------------------"
PORTS=(80 443 8080 9000 8081 8443 9001)
OPEN_PORTS=()

for port in "${PORTS[@]}"; do
    if nc -zv -w 2 $DEVICE_IP $port > /dev/null 2>&1; then
        echo -e "   Port $port: ${GREEN}✅ OPEN${NC}"
        OPEN_PORTS+=($port)
    else
        echo -e "   Port $port: ${RED}❌ CLOSED${NC}"
    fi
done
echo ""

# Step 3: HTTP/Web Interface Test
echo -e "${BLUE}3. Web Interface Test${NC}"
echo "----------------------"
for port in 80 443 8080 8081; do
    echo -n "   Testing http://$DEVICE_IP:$port ... "
    HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 http://$DEVICE_IP:$port 2>&1)
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

# Step 4: OCPP WebSocket Test
echo -e "${BLUE}4. OCPP WebSocket Test${NC}"
echo "----------------------"
echo -n "   Testing ws://$DEVICE_IP:9000 ... "
if nc -zv -w 2 $DEVICE_IP 9000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Port 9000 is open${NC}"
    echo "   Device may support OCPP WebSocket connections"
    echo "   Try connecting with: ws://$DEVICE_IP:9000"
else
    echo -e "${RED}❌ Port 9000 is closed${NC}"
    echo "   Device may not be configured for OCPP WebSocket"
fi
echo ""

# Step 5: ARP Table Check
echo -e "${BLUE}5. Network Device Information${NC}"
echo "----------------------------"
ARP_INFO=$(arp -n $DEVICE_IP 2>/dev/null)
if [ -n "$ARP_INFO" ]; then
    echo -e "${GREEN}✅ Device found in ARP table${NC}"
    echo "$ARP_INFO"
else
    echo -e "${YELLOW}⚠️  Device not in ARP table (may need to ping first)${NC}"
fi
echo ""

# Step 6: Network Route Check
echo -e "${BLUE}6. Network Route Check${NC}"
echo "----------------------"
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "unknown")
if [ "$LOCAL_IP" != "unknown" ]; then
    LOCAL_SUBNET=$(echo $LOCAL_IP | cut -d. -f1-3)
    DEVICE_SUBNET=$(echo $DEVICE_IP | cut -d. -f1-3)
    
    if [ "$LOCAL_SUBNET" = "$DEVICE_SUBNET" ]; then
        echo -e "${GREEN}✅ Device is on same subnet${NC}"
        echo "   Your IP: $LOCAL_IP"
        echo "   Device IP: $DEVICE_IP"
        echo "   Subnet: $LOCAL_SUBNET.0/24"
    else
        echo -e "${YELLOW}⚠️  Device may be on different subnet${NC}"
        echo "   Your IP: $LOCAL_IP (subnet: $LOCAL_SUBNET.0/24)"
        echo "   Device IP: $DEVICE_IP (subnet: $DEVICE_SUBNET.0/24)"
    fi
else
    echo -e "${YELLOW}⚠️  Could not determine local IP${NC}"
fi
echo ""

# Step 7: OCPP Gateway Connection Test
echo -e "${BLUE}7. OCPP Gateway Status${NC}"
echo "----------------------"
OCPP_GATEWAY=$(docker ps --format "{{.Names}}" | grep ocpp-gateway)
if [ -n "$OCPP_GATEWAY" ]; then
    echo -e "${GREEN}✅ OCPP Gateway is running${NC}"
    echo "   Container: $OCPP_GATEWAY"
    echo "   Gateway URL: ws://localhost:9000"
    echo ""
    echo "   To connect your device, configure it with:"
    echo "   - OCPP Central System URL: ws://$(hostname -I | awk '{print $1}'):9000"
    echo "   - Or use your computer's local IP: ws://$LOCAL_IP:9000"
else
    echo -e "${RED}❌ OCPP Gateway is not running${NC}"
    echo "   Start it with: docker-compose up -d ocpp-gateway"
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
    echo "   - Charge Point ID: (check device manual or web interface)"
    echo "   - Central System URL: ws://$LOCAL_IP:9000"
    echo "   - Or use: ws://$(hostname -I | awk '{print $1}'):9000"
else
    echo -e "${YELLOW}⚠️  No open ports detected${NC}"
    echo ""
    echo "Possible issues:"
    echo "1. Device firewall is blocking connections"
    echo "2. Device is not fully booted"
    echo "3. Device requires specific configuration"
    echo "4. Device uses non-standard ports"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check device manual for default ports"
    echo "2. Try accessing device via mobile app (if available)"
    echo "3. Check device display for IP and port information"
    echo "4. Verify device is connected to same WiFi network"
fi

echo ""
echo "=========================================="

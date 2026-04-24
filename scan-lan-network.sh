#!/bin/bash

echo "=========================================="
echo "LAN Network Device Scanner"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get local network information
LOCAL_IPS=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}')
PRIMARY_IP=$(echo "$LOCAL_IPS" | head -1)
SUBNET=$(echo "$PRIMARY_IP" | cut -d. -f1-3)

echo -e "${BLUE}Network Information${NC}"
echo "-------------------"
echo "  Primary IP: $PRIMARY_IP"
echo "  Subnet: $SUBNET.0/24"
echo "  All IPs: $(echo $LOCAL_IPS | tr '\n' ' ')"
echo ""

# Get ARP table entries
echo -e "${BLUE}1. Devices in ARP Table (Recently Active)${NC}"
echo "----------------------------------------"
ARP_ENTRIES=$(arp -a | grep -E "$SUBNET" | grep -v "incomplete")
if [ -n "$ARP_ENTRIES" ]; then
    echo "$ARP_ENTRIES" | while IFS= read -r line; do
        IP=$(echo "$line" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' | head -1)
        MAC=$(echo "$line" | grep -oE '([0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2}')
        INTERFACE=$(echo "$line" | awk '{print $NF}')
        
        # Test if device is reachable
        if ping -c 1 -W 1 "$IP" > /dev/null 2>&1; then
            STATUS="${GREEN}✅ ONLINE${NC}"
        else
            STATUS="${RED}❌ OFFLINE${NC}"
        fi
        
        echo -e "  IP: $IP | MAC: $MAC | $STATUS"
        
        # Check if this is the charger (known MAC)
        if [ "$MAC" = "bc:35:1e:fe:1e:1f" ]; then
            echo -e "    ${YELLOW}⚠️  This is your EV Charger!${NC}"
        fi
    done
else
    echo -e "${YELLOW}  No devices found in ARP table${NC}"
fi
echo ""

# Scan common IPs in subnet
echo -e "${BLUE}2. Scanning Common IPs in Subnet${NC}"
echo "----------------------------------------"
echo "Scanning $SUBNET.1 - $SUBNET.254 (this may take a minute)..."
echo ""

FOUND_DEVICES=0
for i in {1..254}; do
    IP="$SUBNET.$i"
    
    # Skip our own IPs
    if echo "$LOCAL_IPS" | grep -q "$IP"; then
        continue
    fi
    
    # Quick ping test
    if ping -c 1 -W 0.5 "$IP" > /dev/null 2>&1; then
        # Get MAC address from ARP
        MAC=$(arp -n "$IP" 2>/dev/null | awk '{print $4}' | grep -E '([0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2}')
        
        if [ -n "$MAC" ]; then
            echo -e "  ${GREEN}✅ $IP${NC} - MAC: $MAC"
            
            # Check if this is the charger
            if [ "$MAC" = "bc:35:1e:fe:1e:1f" ]; then
                echo -e "    ${YELLOW}🎯 EV CHARGER FOUND!${NC}"
            fi
            
            FOUND_DEVICES=$((FOUND_DEVICES + 1))
        fi
    fi
done

if [ $FOUND_DEVICES -eq 0 ]; then
    echo -e "${YELLOW}  No additional devices found via ping scan${NC}"
    echo "  (Devices may not respond to ping)"
fi
echo ""

# Test known charger IPs
echo -e "${BLUE}3. Testing Known Charger IPs${NC}"
echo "----------------------------------------"
KNOWN_IPS=("192.168.8.139" "192.168.8.142")
for IP in "${KNOWN_IPS[@]}"; do
    echo -n "  $IP: "
    if ping -c 2 -W 1 "$IP" > /dev/null 2>&1; then
        MAC=$(arp -n "$IP" 2>/dev/null | awk '{print $4}' | grep -E '([0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2}')
        if [ "$MAC" = "bc:35:1e:fe:1e:1f" ]; then
            echo -e "${GREEN}✅ ONLINE - This is your charger!${NC}"
        else
            echo -e "${GREEN}✅ ONLINE${NC} (MAC: $MAC)"
        fi
        
        # Test ports
        echo "    Testing ports:"
        for port in 80 443 8080 9000; do
            echo -n "      Port $port: "
            if nc -zv -w 1 "$IP" "$port" > /dev/null 2>&1; then
                echo -e "${GREEN}✅ OPEN${NC}"
            else
                echo -e "${RED}❌ CLOSED${NC}"
            fi
        done
    else
        echo -e "${RED}❌ NOT REACHABLE${NC}"
    fi
    echo ""
done

# Check embedded OCPP in CSMS API
echo -e "${BLUE}4. OCPP API Status${NC}"
echo "----------------------"
OCPP_CONTAINER=$(docker ps --format "{{.Names}}" | grep csms-api)
if [ -n "$OCPP_CONTAINER" ]; then
    echo -e "${GREEN}✅ CSMS API is running${NC}"
    echo "   Container: $OCPP_CONTAINER"
    echo "   Local URL: ws://localhost:3000/ocpp/{chargePointId}"
    echo "   Network URL: ws://$PRIMARY_IP:3000/ocpp/{chargePointId}"
    echo ""
    echo "   Recent connection attempts:"
    docker logs ev-billing-csms-api --tail 40 2>&1 | grep -iE "ocpp|connection|connect|bootnotification" | tail -8 || echo "   No recent connections"
else
    echo -e "${RED}❌ CSMS API is not running${NC}"
fi
echo ""

# Summary
echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""
echo "Network: $SUBNET.0/24"
echo "Your IP: $PRIMARY_IP"
echo ""
echo "Next Steps:"
echo "1. Identify charger IP from above"
echo "2. Configure charger with OCPP URL: ws://$PRIMARY_IP:3000/ocpp/{chargePointId}"
echo "3. Use Charge Point ID: bfe72084fec9521707y1c"
echo "4. Monitor connection: docker logs -f ev-billing-csms-api | grep -i ocpp"
echo ""








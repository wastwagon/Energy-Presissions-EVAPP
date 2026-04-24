#!/bin/bash

echo "=========================================="
echo "EV Charger LAN Discovery"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

CHARGER_MAC="bc:35:1e:fe:1e:1f"
CHARGER_VIRTUAL_ID="bfe72084fec9521707y1c"

echo -e "${BLUE}Step 1: Finding Charger by MAC Address${NC}"
echo "----------------------------------------"
CHARGER_ENTRY=$(arp -a | grep -i "$CHARGER_MAC")
if [ -n "$CHARGER_ENTRY" ]; then
    CHARGER_IP=$(echo "$CHARGER_ENTRY" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    CHARGER_IFACE=$(echo "$CHARGER_ENTRY" | awk '{print $NF}')
    echo -e "${GREEN}✅ Charger found!${NC}"
    echo "   IP Address: $CHARGER_IP"
    echo "   MAC Address: $CHARGER_MAC"
    echo "   Interface: $CHARGER_IFACE"
    echo ""
    
    # Test connectivity
    echo -e "${BLUE}Step 2: Testing Connectivity${NC}"
    echo "----------------------------------------"
    if ping -c 3 -W 2 "$CHARGER_IP" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Charger is reachable${NC}"
        PING_STATS=$(ping -c 3 "$CHARGER_IP" 2>&1 | tail -1)
        echo "   $PING_STATS"
    else
        echo -e "${RED}❌ Charger is not responding to ping${NC}"
    fi
    echo ""
    
    # Test ports
    echo -e "${BLUE}Step 3: Testing Ports${NC}"
    echo "----------------------------------------"
    for port in 80 443 8080 9000; do
        echo -n "   Port $port: "
        if nc -zv -w 2 "$CHARGER_IP" "$port" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ OPEN${NC}"
        else
            echo -e "${RED}❌ CLOSED${NC}"
        fi
    done
    echo ""
    
    # Get network info
    MY_IP=$(ifconfig "$CHARGER_IFACE" 2>/dev/null | grep "inet " | awk '{print $2}' | head -1)
    if [ -z "$MY_IP" ]; then
        # Try to find IP on same subnet
        SUBNET=$(echo "$CHARGER_IP" | cut -d. -f1-3)
        MY_IP=$(ifconfig | grep "inet " | grep "$SUBNET" | awk '{print $2}' | head -1)
    fi
    
    echo -e "${BLUE}Step 4: OCPP Configuration${NC}"
    echo "----------------------------------------"
    if [ -n "$MY_IP" ]; then
        echo -e "${GREEN}OCPP Central System URL:${NC}"
        echo "   ws://$MY_IP:3000/ocpp/{chargePointId}"
        echo ""
        echo -e "${GREEN}Charge Point ID:${NC}"
        echo "   $CHARGER_VIRTUAL_ID"
        echo ""
        echo -e "${GREEN}Protocol:${NC} OCPP 1.6J"
    else
        echo -e "${YELLOW}⚠️  Could not determine your IP on charger's network${NC}"
        echo "   Please check your network configuration"
    fi
    echo ""
    
else
    echo -e "${RED}❌ Charger not found in ARP table${NC}"
    echo ""
    echo -e "${YELLOW}Possible reasons:${NC}"
    echo "  1. Charger is not connected to network"
    echo "  2. Charger is on different network segment"
    echo "  3. Charger hasn't communicated recently"
    echo ""
    echo -e "${BLUE}Step 2: Scanning All Networks${NC}"
    echo "----------------------------------------"
    
    # Get all network interfaces
    INTERFACES=$(ifconfig | grep "^[a-z]" | awk '{print $1}' | grep -v "lo0")
    
    for iface in $INTERFACES; do
        IP=$(ifconfig "$iface" 2>/dev/null | grep "inet " | awk '{print $2}' | head -1)
        if [ -n "$IP" ] && [ "$IP" != "127.0.0.1" ]; then
            SUBNET=$(echo "$IP" | cut -d. -f1-3)
            echo ""
            echo "Interface: $iface"
            echo "  Your IP: $IP"
            echo "  Subnet: $SUBNET.0/24"
            echo "  Scanning for charger..."
            
            # Quick scan of common IPs
            FOUND=0
            for i in 1 100 139 142 200 254; do
                TEST_IP="$SUBNET.$i"
                if [ "$TEST_IP" != "$IP" ]; then
                    if ping -c 1 -W 1 "$TEST_IP" > /dev/null 2>&1; then
                        TEST_MAC=$(arp -n "$TEST_IP" 2>/dev/null | awk '{print $4}' | grep -E '([0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2}')
                        if [ "$TEST_MAC" = "$CHARGER_MAC" ]; then
                            echo -e "  ${GREEN}✅ Charger found at $TEST_IP!${NC}"
                            CHARGER_IP="$TEST_IP"
                            FOUND=1
                            break
                        fi
                    fi
                fi
            done
            
            if [ $FOUND -eq 0 ]; then
                echo "  No charger found on this network"
            fi
        fi
    done
fi

echo ""
echo "=========================================="
echo "Next Steps"
echo "=========================================="
echo ""
if [ -n "$CHARGER_IP" ]; then
    echo -e "${GREEN}✅ Charger IP: $CHARGER_IP${NC}"
    echo ""
    echo "1. Configure charger with:"
    if [ -n "$MY_IP" ]; then
        echo "   OCPP URL: ws://$MY_IP:3000/ocpp/{chargePointId}"
    else
        echo "   OCPP URL: ws://YOUR_IP:3000/ocpp/{chargePointId} (check your IP on charger's network)"
    fi
    echo "   Charge Point ID: $CHARGER_VIRTUAL_ID"
    echo ""
    echo "2. Monitor connection:"
    echo "   docker logs -f ev-billing-csms-api | grep -i ocpp"
    echo ""
    echo "3. Check device registration:"
    echo "   Login to http://localhost:8080"
    echo "   Go to: Super Admin → Device Inventory"
else
    echo "1. Ensure charger is connected via LAN cable"
    echo "2. Check charger power and network LEDs"
    echo "3. Wait 2-3 minutes for charger to fully boot"
    echo "4. Run this script again"
    echo ""
    echo "Alternative: Check router's DHCP client list"
    echo "  - Access router admin panel"
    echo "  - Look for MAC: $CHARGER_MAC"
fi
echo ""








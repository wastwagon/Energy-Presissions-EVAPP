#!/bin/bash

# EV Charger LAN Connection Scanner
# Scans network for charger connected via LAN cable

echo "=========================================="
echo "EV Charger LAN Connection Scanner"
echo "=========================================="
echo ""

# Get network info
MAC_IP=$(ifconfig | grep -E "inet " | grep -v 127.0.0.1 | grep "192.168.0" | head -1 | awk '{print $2}')
NETWORK=$(echo $MAC_IP | cut -d'.' -f1-3)

echo "📡 Network Information:"
echo "   Your Mac IP: $MAC_IP"
echo "   Network: $NETWORK.0/24"
echo ""

echo "🔍 Scanning for devices..."
echo ""

# Refresh ARP table by pinging network
echo "Refreshing ARP table..."
for i in {1..254}; do
    timeout 0.05 ping -c 1 $NETWORK.$i > /dev/null 2>&1 &
done
sleep 3

echo ""
echo "=========================================="
echo "Discovered Devices"
echo "=========================================="
echo ""

DEVICE_COUNT=0

arp -a | grep "$NETWORK" | grep -v "192.168.0.255" | while read line; do
    IP=$(echo "$line" | grep -oE '[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}' | head -1)
    HOSTNAME=$(echo "$line" | awk '{print $1}' | tr -d '()')
    MAC=$(echo "$line" | awk '{print $4}')
    
    if [ "$IP" != "$MAC_IP" ] && [ "$IP" != "192.168.0.1" ]; then
        DEVICE_COUNT=$((DEVICE_COUNT + 1))
        echo "Device #$DEVICE_COUNT:"
        echo "  IP Address: $IP"
        echo "  Hostname: $HOSTNAME"
        echo "  MAC Address: $MAC"
        
        # Test if device is online
        if ping -c 1 -W 1 $IP > /dev/null 2>&1; then
            echo "  Status: ✅ Online"
        else
            echo "  Status: ⚠️  May be offline"
        fi
        
        # Test HTTP access
        echo "  Testing web interface..."
        HTTP_CODE=$(timeout 2 curl -s -o /dev/null -w "%{http_code}" http://$IP 2>/dev/null)
        if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
            echo "  🌐 Web Interface: ✅ Accessible (HTTP $HTTP_CODE)"
            echo "  🔗 Try opening: http://$IP"
            echo "  ⚠️  THIS COULD BE YOUR CHARGER!"
        else
            echo "  🌐 Web Interface: ❌ Not accessible"
        fi
        
        echo ""
    fi
done

echo "=========================================="
echo "Charger Configuration"
echo "=========================================="
echo ""
echo "If you found your charger above:"
echo ""
echo "1. Open the IP address in browser:"
echo "   http://CHARGER_IP:80"
echo ""
echo "2. Login with:"
echo "   Password: SN:SERIAL_NUMBER"
echo "   (Serial number from charger display)"
echo ""
echo "3. Configure OCPP:"
echo "   Charger ID: CP001 (or your choice)"
echo "   OCPP URL: ws://$MAC_IP:9000/ocpp/CP001"
echo ""
echo "4. Monitor connection:"
echo "   ./monitor-device-connection.sh"
echo ""


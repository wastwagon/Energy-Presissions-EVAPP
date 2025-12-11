#!/bin/bash

# Device Discovery and Connection Monitoring Script
# This script helps discover and monitor charge point devices on your network

echo "=========================================="
echo "EV Charging Device Discovery Tool"
echo "=========================================="
echo ""

# Get network info
MAC_IP=$(ifconfig | grep -E "inet " | grep -v 127.0.0.1 | grep "192.168.0" | head -1 | awk '{print $2}')
NETWORK=$(echo $MAC_IP | cut -d'.' -f1-3)

echo "1. Network Information:"
echo "   Your Mac IP: $MAC_IP"
echo "   Network: $NETWORK.0/24"
echo ""

# Check if nmap is available
if command -v nmap &> /dev/null; then
    echo "2. Scanning network for active devices..."
    echo "   (This may take a minute...)"
    echo ""
    
    # Scan network for active hosts
    nmap -sn $NETWORK.0/24 2>/dev/null | grep -E "Nmap scan report" | while read line; do
        IP=$(echo $line | grep -oE '[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}')
        if [ "$IP" != "$MAC_IP" ] && [ ! -z "$IP" ]; then
            echo "   Found device: $IP"
            
            # Try to identify if it's a web server (common for charge points)
            HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://$IP 2>/dev/null)
            if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "401" ] || [ "$HTTP_STATUS" = "403" ]; then
                echo "      ⚠️  Has web interface (possible charge point!)"
                echo "      Try: http://$IP"
            fi
        fi
    done
    echo ""
else
    echo "2. nmap not installed. Install with: brew install nmap"
    echo "   Or manually check your router's admin panel for connected devices"
    echo ""
fi

# Check OCPP Gateway status
echo "3. OCPP Gateway Status:"
OCPP_HEALTH=$(curl -s http://localhost:9000/health)
if [ "$OCPP_HEALTH" = "OK" ]; then
    echo "   ✅ OCPP Gateway is running and accessible"
else
    echo "   ❌ OCPP Gateway is not responding"
fi
echo ""

# Check for active connections
echo "4. Active OCPP Connections:"
echo "   Checking recent connection logs..."
docker-compose logs --tail=50 ocpp-gateway 2>/dev/null | grep -E "New WebSocket connection|BootNotification|charge point" | tail -5
if [ $? -ne 0 ]; then
    echo "   No recent connections found"
fi
echo ""

# Monitor mode
echo "=========================================="
echo "Monitoring Mode"
echo "=========================================="
echo ""
echo "Starting real-time monitoring for device connections..."
echo "Press Ctrl+C to stop"
echo ""
echo "Configure your device with:"
echo "  ws://$MAC_IP:9000/ocpp/CP001"
echo ""
echo "Waiting for connections..."
echo ""

# Monitor OCPP Gateway logs in real-time
docker-compose logs -f ocpp-gateway 2>/dev/null | while read line; do
    if echo "$line" | grep -qE "New WebSocket connection|BootNotification|charge point"; then
        echo "🔔 NEW CONNECTION DETECTED:"
        echo "   $line"
        echo ""
        echo "✅ Device should appear in dashboard:"
        echo "   http://localhost:8080/admin/ops/devices"
        echo ""
    fi
done


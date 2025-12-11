#!/bin/bash

# Check discovered devices for charge point web interfaces

echo "=========================================="
echo "Checking Devices for Web Interfaces"
echo "=========================================="
echo ""

# Devices found on network
DEVICES=("192.168.0.159" "192.168.0.199")

for IP in "${DEVICES[@]}"; do
    echo "Checking $IP..."
    
    # Try HTTP
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://$IP 2>/dev/null)
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
        echo "  ✅ HTTP accessible (Status: $HTTP_CODE)"
        echo "  🌐 Try opening: http://$IP"
        echo "  📋 This might be your charge point device!"
        echo ""
    fi
    
    # Try HTTPS
    HTTPS_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 -k https://$IP 2>/dev/null)
    if [ "$HTTPS_CODE" = "200" ] || [ "$HTTPS_CODE" = "401" ] || [ "$HTTPS_CODE" = "403" ]; then
        echo "  ✅ HTTPS accessible (Status: $HTTPS_CODE)"
        echo "  🌐 Try opening: https://$IP"
        echo "  📋 This might be your charge point device!"
        echo ""
    fi
    
    # Check if port 80 is open
    if timeout 1 bash -c "echo > /dev/tcp/$IP/80" 2>/dev/null; then
        echo "  ✅ Port 80 is open"
    fi
    
    # Check if port 443 is open
    if timeout 1 bash -c "echo > /dev/tcp/$IP/443" 2>/dev/null; then
        echo "  ✅ Port 443 is open"
    fi
    
    echo ""
done

echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo ""
echo "1. Open the IP addresses above in your browser"
echo "2. Look for OCPP or device configuration pages"
echo "3. Find the Charge Point ID in the settings"
echo "4. Configure device with: ws://192.168.0.166:9000/ocpp/YOUR_ID"
echo ""


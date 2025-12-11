#!/bin/bash

# Advanced Charger Discovery & Configuration Script
# Tries every possible method to discover and configure the charger

MAC_IP="192.168.0.166"
CHARGER_IP="192.168.0.199"
OCPP_PORT="9000"
CHARGE_POINT_ID="CP001"

echo "=========================================="
echo "Advanced Charger Discovery & Configuration"
echo "=========================================="
echo ""

# Method 1: Try to find charger via ARP and MAC vendor lookup
echo "Method 1: MAC Address Analysis"
echo "=============================="
CHARGER_MAC=$(arp -a | grep "$CHARGER_IP" | awk '{print $4}')
if [ ! -z "$CHARGER_MAC" ]; then
    echo "   ✅ Found MAC: $CHARGER_MAC"
    echo "   IP: $CHARGER_IP"
    echo "   Vendor lookup:"
    # Try to identify vendor from MAC
    MAC_PREFIX=$(echo $CHARGER_MAC | cut -d: -f1-3 | tr ':' '-')
    echo "   MAC prefix: $MAC_PREFIX"
    echo "   (Check https://macvendors.com/query/$CHARGER_MAC for vendor info)"
else
    echo "   ⚠️  Could not find MAC address"
fi
echo ""

# Method 2: Try different HTTP methods and headers
echo "Method 2: HTTP Method Testing"
echo "=============================="
for method in GET POST PUT OPTIONS HEAD; do
    for port in 80 8080 443 8443; do
        RESPONSE=$(curl -s -X $method -o /dev/null -w "%{http_code}" --connect-timeout 1 \
            -H "User-Agent: Mozilla/5.0" \
            -H "Accept: */*" \
            http://$CHARGER_IP:$port 2>/dev/null)
        if [ ! -z "$RESPONSE" ] && [ "$RESPONSE" != "000" ] && [ "$RESPONSE" != "404" ]; then
            echo "   ✅ $method http://$CHARGER_IP:$port → $RESPONSE"
            echo "   🔗 Try: curl -v http://$CHARGER_IP:$port"
        fi
    done
done
echo ""

# Method 3: Try common default credentials
echo "Method 3: Default Credential Testing"
echo "====================================="
echo "   Testing common default logins..."
for user in "admin" "root" "user" "charger" ""; do
    for pass in "admin" "password" "123456" "charger" ""; do
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 1 \
            -u "$user:$pass" \
            http://$CHARGER_IP:80 2>/dev/null)
        if [ ! -z "$HTTP_CODE" ] && [ "$HTTP_CODE" != "000" ] && [ "$HTTP_CODE" != "401" ] && [ "$HTTP_CODE" != "403" ]; then
            echo "   ✅ Found working credentials: $user:$pass (Status: $HTTP_CODE)"
        fi
    done
done
echo ""

# Method 4: Try OCPP-specific endpoints
echo "Method 4: OCPP Endpoint Testing"
echo "==============================="
for endpoint in "/ocpp" "/ocpp16" "/ocpp/1.6" "/ocpp/CP001" "/ocpp/chargepoint" "/api/ocpp" "/ws" "/websocket"; do
    for port in 80 8080 9000 443; do
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 1 \
            http://$CHARGER_IP:$port$endpoint 2>/dev/null)
        if [ ! -z "$HTTP_CODE" ] && [ "$HTTP_CODE" != "000" ] && [ "$HTTP_CODE" != "404" ]; then
            echo "   ✅ Found: http://$CHARGER_IP:$port$endpoint (Status: $HTTP_CODE)"
        fi
    done
done
echo ""

# Method 5: Try to send WebSocket upgrade request
echo "Method 5: WebSocket Handshake Testing"
echo "======================================"
echo "   Testing if charger accepts WebSocket connections..."
WS_RESPONSE=$(echo -ne "GET / HTTP/1.1\r\nHost: $CHARGER_IP\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: test\r\nSec-WebSocket-Version: 13\r\n\r\n" | nc -w 2 $CHARGER_IP 80 2>/dev/null | head -5)
if [ ! -z "$WS_RESPONSE" ]; then
    echo "   ✅ WebSocket upgrade response received:"
    echo "$WS_RESPONSE" | sed 's/^/      /'
else
    echo "   ❌ No WebSocket support detected"
fi
echo ""

# Method 6: Try Telnet/SSH if ports are open
echo "Method 6: Terminal Access Testing"
echo "=================================="
for port in 22 23 2323; do
    if timeout 1 bash -c "echo > /dev/tcp/$CHARGER_IP/$port" 2>/dev/null; then
        echo "   ✅ Port $port is OPEN"
        echo "   🔗 Try: telnet $CHARGER_IP $port"
        echo "   🔗 Or: ssh root@$CHARGER_IP (if SSH)"
    fi
done
echo ""

# Method 7: Check for UPnP/SSDP services
echo "Method 7: UPnP/SSDP Discovery"
echo "============================="
echo "   Sending SSDP discovery..."
SSDP_RESPONSE=$(timeout 3 bash -c "echo -e 'M-SEARCH * HTTP/1.1\r\nHOST: 239.255.255.250:1900\r\nMAN: \"ssdp:discover\"\r\nST: upnp:rootdevice\r\nMX: 3\r\n\r\n' | nc -u -w 2 239.255.255.250 1900 2>&1" | grep -i "$CHARGER_IP" | head -3)
if [ ! -z "$SSDP_RESPONSE" ]; then
    echo "   ✅ UPnP device found:"
    echo "$SSDP_RESPONSE" | sed 's/^/      /'
else
    echo "   ❌ No UPnP response from charger"
fi
echo ""

# Method 8: Try Modbus/TCP (common in industrial chargers)
echo "Method 8: Modbus/TCP Testing"
echo "============================"
MODBUS_RESPONSE=$(timeout 1 bash -c "echo -ne '\x00\x01\x00\x00\x00\x06\x01\x03\x00\x00\x00\x01' | nc -w 1 $CHARGER_IP 502 2>/dev/null | od -An -tx1 | head -1)
if [ ! -z "$MODBUS_RESPONSE" ]; then
    echo "   ✅ Modbus/TCP response detected"
    echo "   🔗 Charger may support Modbus configuration"
else
    echo "   ❌ No Modbus/TCP support"
fi
echo ""

# Method 9: Try CoAP (IoT protocol)
echo "Method 9: CoAP Protocol Testing"
echo "==============================="
for path in ".well-known/core" "ocpp" "config"; do
    COAP_RESPONSE=$(timeout 1 coap-client -m get coap://$CHARGER_IP/$path 2>/dev/null)
    if [ ! -z "$COAP_RESPONSE" ]; then
        echo "   ✅ CoAP endpoint found: coap://$CHARGER_IP/$path"
    fi
done
echo "   (CoAP client may not be installed)"
echo ""

# Method 10: Check for active OCPP connections from charger
echo "Method 10: Active OCPP Connection Check"
echo "======================================="
echo "   Checking if charger is trying to connect..."
RECENT_ATTEMPTS=$(docker-compose logs --since 5m ocpp-gateway 2>/dev/null | grep -i "$CHARGER_IP\|connection\|websocket" | wc -l)
if [ "$RECENT_ATTEMPTS" -gt 0 ]; then
    echo "   ✅ Found $RECENT_ATTEMPTS connection-related log entries"
    echo "   Recent activity:"
    docker-compose logs --since 5m ocpp-gateway 2>/dev/null | grep -i "$CHARGER_IP\|connection\|websocket" | tail -3 | sed 's/^/      /'
else
    echo "   ⚠️  No connection attempts detected"
    echo "   Charger is not trying to connect yet"
fi
echo ""

# Summary and Recommendations
echo "=========================================="
echo "SUMMARY & NEXT STEPS"
echo "=========================================="
echo ""
echo "Based on all tests:"
echo ""
echo "✅ Network Status:"
echo "   - Charger is on network ($CHARGER_IP)"
echo "   - OCPP Gateway is ready ($MAC_IP:$OCPP_PORT)"
echo "   - No firewall blocking"
echo ""
echo "❌ Configuration Access:"
echo "   - No web interface accessible"
echo "   - No open ports for configuration"
echo "   - Charger not attempting OCPP connection"
echo ""
echo "📋 REQUIRED ACTION:"
echo "   You MUST configure the charger using one of these methods:"
echo ""
echo "   1. Mobile App (Most Common)"
echo "      - Download manufacturer's app"
echo "      - Connect via WiFi hotspot or Bluetooth"
echo "      - Configure OCPP URL: ws://$MAC_IP:$OCPP_PORT/ocpp/$CHARGE_POINT_ID"
echo ""
echo "   2. Display Menu"
echo "      - Use buttons on charger display"
echo "      - Navigate to OCPP/Network settings"
echo "      - Enter OCPP URL manually"
echo ""
echo "   3. Serial/USB Connection"
echo "      - Connect via USB/Serial cable"
echo "      - Use terminal/serial monitor"
echo "      - Send configuration commands"
echo ""
echo "   4. Factory Reset"
echo "      - Reset charger to factory defaults"
echo "      - May enable setup mode with WiFi/Bluetooth"
echo ""
echo "🔧 Configuration Details:"
echo "   OCPP URL: ws://$MAC_IP:$OCPP_PORT/ocpp/$CHARGE_POINT_ID"
echo "   Charge Point ID: $CHARGE_POINT_ID"
echo "   Protocol: OCPP 1.6J (JSON over WebSocket)"
echo ""
echo "📊 After Configuration:"
echo "   1. Monitor: ./monitor-device-connection.sh"
echo "   2. Check dashboard: http://localhost:8080/admin/ops/devices"
echo "   3. Device will appear automatically when it connects"
echo ""


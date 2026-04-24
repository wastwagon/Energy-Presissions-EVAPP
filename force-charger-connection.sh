#!/bin/bash

# Force Charger Connection - Attempts all possible methods to get charger connected

MAC_IP="192.168.0.166"
CHARGER_IP="192.168.0.199"
OCPP_PORT="3000"
CHARGE_POINT_ID="CP001"

echo "=========================================="
echo "Force Charger Connection Script"
echo "=========================================="
echo ""

# Method 1: Pre-register device in database
echo "Method 1: Pre-registering device in database..."
echo ""

TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin1@tenant1.com","password":"admin123"}' \
  | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$TOKEN" ]; then
    echo "   ✅ Got authentication token"
    
    # Try to create charge point
    CREATE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/charge-points \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{
        \"chargePointId\": \"$CHARGE_POINT_ID\",
        \"vendor\": \"DY\",
        \"model\": \"DY0131-BG132\",
        \"serialNumber\": \"2103241322012080001\",
        \"status\": \"Offline\"
      }")
    
    if echo "$CREATE_RESPONSE" | grep -q "chargePointId"; then
        echo "   ✅ Device pre-registered in database"
        echo "   Device will appear when it connects"
    else
        echo "   ⚠️  Device may already exist or error occurred"
        echo "   Response: $CREATE_RESPONSE"
    fi
else
    echo "   ❌ Could not authenticate"
fi
echo ""

# Method 2: Test WebSocket connection manually
echo "Method 2: Testing WebSocket connection capability..."
echo ""

if command -v wscat &> /dev/null; then
    echo "   wscat available - testing connection..."
    echo "   Attempting: ws://$MAC_IP:$OCPP_PORT/ocpp/$CHARGE_POINT_ID"
    echo "   (This will timeout if charger doesn't connect)"
    timeout 5 wscat -c "ws://$MAC_IP:$OCPP_PORT/ocpp/$CHARGE_POINT_ID" 2>&1 | head -5 || echo "   Connection test completed"
else
    echo "   ⚠️  wscat not installed"
    echo "   Install: npm install -g wscat"
fi
echo ""

# Method 3: Check if we can reach charger configuration
echo "Method 3: Attempting to access charger configuration..."
echo ""

# Try common configuration endpoints
for endpoint in "" "/" "/config" "/settings" "/ocpp" "/api/config" "/admin"; do
    for port in 80 8080 443; do
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://$CHARGER_IP:$port$endpoint 2>/dev/null)
        if [ ! -z "$HTTP_CODE" ] && [ "$HTTP_CODE" != "000" ] && [ "$HTTP_CODE" != "404" ]; then
            echo "   ✅ Found accessible endpoint: http://$CHARGER_IP:$port$endpoint (Status: $HTTP_CODE)"
            echo "   🔗 Open in browser to configure charger"
        fi
    done
done
echo ""

# Method 4: Monitor and wait for connection
echo "Method 4: Starting connection monitor..."
echo ""
echo "   Monitoring embedded OCPP logs for incoming connections..."
echo "   Configure your charger with:"
echo "   OCPP URL: ws://$MAC_IP:$OCPP_PORT/ocpp/$CHARGE_POINT_ID"
echo ""
echo "   Press Ctrl+C to stop monitoring"
echo ""

# Monitor for 30 seconds
timeout 30 docker-compose logs -f csms-api 2>/dev/null | while IFS= read -r line; do
    if echo "$line" | grep -qE "New WebSocket connection|BootNotification|charge point"; then
        echo "🔔 CONNECTION DETECTED:"
        echo "   $line"
        echo ""
        echo "✅ Device should now appear in dashboard!"
        echo "   http://localhost:8080/admin/ops/devices"
        break
    fi
done

echo ""
echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo ""
echo "1. If charger has web interface:"
echo "   - Open: http://$CHARGER_IP:80"
echo "   - Login: SN:SERIAL_NUMBER"
echo "   - Configure OCPP URL: ws://$MAC_IP:$OCPP_PORT/ocpp/$CHARGE_POINT_ID"
echo ""
echo "2. If charger has mobile app:"
echo "   - Use app to configure OCPP settings"
echo "   - Enter same URL as above"
echo ""
echo "3. If charger has display menu:"
echo "   - Navigate to OCPP/Network settings"
echo "   - Enter OCPP URL manually"
echo ""
echo "4. Monitor continuously:"
echo "   ./monitor-device-connection.sh"
echo ""


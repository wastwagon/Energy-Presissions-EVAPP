#!/bin/bash

# Comprehensive Testing Script - All Possible Solutions for LAN Connection
# Tests every possible way to get the charger connected

echo "=========================================="
echo "Comprehensive Charger Connection Test"
echo "=========================================="
echo ""

MAC_IP="192.168.0.166"
CHARGER_IP="192.168.0.199"
OCPP_PORT="9000"

echo "Configuration:"
echo "  Mac IP: $MAC_IP"
echo "  Charger IP: $CHARGER_IP"
echo "  OCPP Port: $OCPP_PORT"
echo ""

# Test 1: Basic Connectivity
echo "=========================================="
echo "Test 1: Basic Network Connectivity"
echo "=========================================="
echo ""

echo "1.1 Testing ping to charger..."
if ping -c 2 -W 2 $CHARGER_IP > /dev/null 2>&1; then
    echo "   ✅ Charger is reachable via ping"
else
    echo "   ❌ Charger NOT reachable via ping"
    echo "   ⚠️  Check network connection"
fi
echo ""

echo "1.2 Testing OCPP Gateway from Mac..."
OCPP_HEALTH=$(curl -s --connect-timeout 2 http://localhost:$OCPP_PORT/health)
if [ "$OCPP_HEALTH" = "OK" ]; then
    echo "   ✅ OCPP Gateway is running"
else
    echo "   ❌ OCPP Gateway not responding"
fi
echo ""

echo "1.3 Testing OCPP Gateway from network perspective..."
OCPP_NETWORK=$(curl -s --connect-timeout 2 http://$MAC_IP:$OCPP_PORT/health)
if [ "$OCPP_NETWORK" = "OK" ]; then
    echo "   ✅ OCPP Gateway accessible from network"
else
    echo "   ❌ OCPP Gateway not accessible from network"
    echo "   ⚠️  May be firewall issue"
fi
echo ""

# Test 2: Port Scanning
echo "=========================================="
echo "Test 2: Port Scanning on Charger"
echo "=========================================="
echo ""

echo "2.1 Scanning common charger ports..."
for port in 80 443 8080 9000 22 23; do
    if timeout 1 bash -c "echo > /dev/tcp/$CHARGER_IP/$port" 2>/dev/null; then
        echo "   ✅ Port $port is OPEN"
        # Try HTTP if web port
        if [ "$port" = "80" ] || [ "$port" = "8080" ]; then
            HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://$CHARGER_IP:$port 2>/dev/null)
            if [ ! -z "$HTTP_CODE" ] && [ "$HTTP_CODE" != "000" ]; then
                echo "      🌐 HTTP Status: $HTTP_CODE - Web interface available!"
                echo "      🔗 Try: http://$CHARGER_IP:$port"
            fi
        fi
    else
        echo "   ❌ Port $port is closed"
    fi
done
echo ""

# Test 3: WebSocket Connection Test
echo "=========================================="
echo "Test 3: WebSocket Connection Testing"
echo "=========================================="
echo ""

echo "3.1 Testing WebSocket server accessibility..."
# Check if WebSocket port is listening
if netstat -an | grep -q "\.$OCPP_PORT.*LISTEN"; then
    echo "   ✅ WebSocket port $OCPP_PORT is listening"
else
    echo "   ❌ WebSocket port $OCPP_PORT is NOT listening"
fi
echo ""

echo "3.2 Testing WebSocket endpoint structure..."
echo "   Testing: ws://$MAC_IP:$OCPP_PORT/ocpp/CP001"
echo "   (This requires WebSocket client - testing server readiness)"
echo ""

# Test 4: Try Different Connection Methods
echo "=========================================="
echo "Test 4: Alternative Connection Methods"
echo "=========================================="
echo ""

echo "4.1 Testing HTTP endpoints on charger..."
for endpoint in "" "/" "/ocpp" "/api" "/config" "/settings" "/admin" "/login"; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 1 http://$CHARGER_IP:80$endpoint 2>/dev/null)
    if [ ! -z "$HTTP_CODE" ] && [ "$HTTP_CODE" != "000" ]; then
        echo "   ✅ Found endpoint: http://$CHARGER_IP:80$endpoint (Status: $HTTP_CODE)"
    fi
done
echo ""

echo "4.2 Testing HTTPS endpoints..."
for endpoint in "" "/" "/ocpp" "/api" "/config"; do
    HTTPS_CODE=$(curl -s -o /dev/null -w "%{http_code}" -k --connect-timeout 1 https://$CHARGER_IP:443$endpoint 2>/dev/null)
    if [ ! -z "$HTTPS_CODE" ] && [ "$HTTPS_CODE" != "000" ]; then
        echo "   ✅ Found endpoint: https://$CHARGER_IP:443$endpoint (Status: $HTTPS_CODE)"
    fi
done
echo ""

# Test 5: OCPP Gateway Logs
echo "=========================================="
echo "Test 5: Connection Attempt History"
echo "=========================================="
echo ""

echo "5.1 Checking for recent connection attempts..."
RECENT_CONNECTIONS=$(docker-compose logs --since 10m ocpp-gateway 2>/dev/null | grep -E "connection|WebSocket|charge point" | wc -l)
if [ "$RECENT_CONNECTIONS" -gt 0 ]; then
    echo "   ✅ Found $RECENT_CONNECTIONS connection-related log entries"
    echo "   Recent entries:"
    docker-compose logs --since 10m ocpp-gateway 2>/dev/null | grep -E "connection|WebSocket|charge point" | tail -5
else
    echo "   ⚠️  No recent connection attempts found"
    echo "   This means charger hasn't tried to connect yet"
fi
echo ""

# Test 6: Manual WebSocket Test
echo "=========================================="
echo "Test 6: Manual WebSocket Test"
echo "=========================================="
echo ""

if command -v wscat &> /dev/null; then
    echo "6.1 wscat available - can test WebSocket connection"
    echo "   Run manually: wscat -c ws://$MAC_IP:$OCPP_PORT/ocpp/CP001"
else
    echo "6.1 wscat not installed"
    echo "   Install: npm install -g wscat"
    echo "   Then test: wscat -c ws://$MAC_IP:$OCPP_PORT/ocpp/CP001"
fi
echo ""

# Test 7: Check for Active Connections
echo "=========================================="
echo "Test 7: Active OCPP Connections"
echo "=========================================="
echo ""

ACTIVE_CONNECTIONS=$(docker-compose logs --tail=100 ocpp-gateway 2>/dev/null | grep -E "New WebSocket connection|Connection registered" | wc -l)
if [ "$ACTIVE_CONNECTIONS" -gt 0 ]; then
    echo "   ✅ Found active connections in logs"
    docker-compose logs --tail=100 ocpp-gateway 2>/dev/null | grep -E "New WebSocket connection|Connection registered" | tail -3
else
    echo "   ⚠️  No active connections found"
fi
echo ""

# Test 8: Try to Access Charger Configuration
echo "=========================================="
echo "Test 8: Charger Configuration Access"
echo "=========================================="
echo ""

echo "8.1 Testing charger web interface..."
for method in "GET" "POST"; do
    for port in 80 8080 443; do
        RESPONSE=$(curl -s -X $method -o /dev/null -w "%{http_code}" --connect-timeout 2 http://$CHARGER_IP:$port 2>/dev/null)
        if [ ! -z "$RESPONSE" ] && [ "$RESPONSE" != "000" ]; then
            echo "   ✅ $method http://$CHARGER_IP:$port → $RESPONSE"
        fi
    done
done
echo ""

# Test 9: Network Route Check
echo "=========================================="
echo "Test 9: Network Routing"
echo "=========================================="
echo ""

echo "9.1 Checking if charger can reach Mac..."
# Simulate what charger would see
echo "   From charger perspective:"
echo "   - Target: $MAC_IP:$OCPP_PORT"
echo "   - Should be able to connect if on same network"
echo ""

# Test 10: Firewall Check
echo "=========================================="
echo "Test 10: Firewall & Security"
echo "=========================================="
echo ""

echo "10.1 Checking macOS firewall status..."
FIREWALL_STATUS=$(/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate 2>/dev/null | grep -i "enabled\|disabled")
if [ ! -z "$FIREWALL_STATUS" ]; then
    echo "   Firewall: $FIREWALL_STATUS"
    if echo "$FIREWALL_STATUS" | grep -qi "enabled"; then
        echo "   ⚠️  Firewall is ON - may block connections"
        echo "   💡 Temporarily disable for testing:"
        echo "      sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off"
    fi
else
    echo "   ⚠️  Could not check firewall status"
fi
echo ""

# Test 11: Docker Network Check
echo "=========================================="
echo "Test 11: Docker Network Configuration"
echo "=========================================="
echo ""

echo "11.1 Checking Docker network binding..."
DOCKER_BINDING=$(netstat -an | grep "\.$OCPP_PORT.*LISTEN" | head -1)
if echo "$DOCKER_BINDING" | grep -q "\*\.$OCPP_PORT"; then
    echo "   ✅ Port $OCPP_PORT bound to all interfaces (0.0.0.0)"
    echo "   ✅ Accessible from network"
else
    echo "   ⚠️  Port binding: $DOCKER_BINDING"
    if echo "$DOCKER_BINDING" | grep -q "127.0.0.1"; then
        echo "   ❌ Only bound to localhost - NOT accessible from network!"
    fi
fi
echo ""

# Test 12: Try Different Charge Point IDs
echo "=========================================="
echo "Test 12: Charge Point ID Variations"
echo "=========================================="
echo ""

echo "12.1 Testing different ID formats..."
echo "   If charger is pre-configured, it might use:"
echo "   - Serial number format"
echo "   - MAC address format"
echo "   - Model-based format"
echo ""
echo "   Try configuring charger with these IDs:"
echo "   - CP001 (simple)"
echo "   - DY0131-001 (model-based)"
echo "   - 2103241322012080001 (batch number)"
echo ""

# Summary
echo "=========================================="
echo "SUMMARY & RECOMMENDATIONS"
echo "=========================================="
echo ""

echo "Based on tests above:"
echo ""
echo "If charger is reachable but not connecting:"
echo "  1. Charger needs OCPP URL configuration"
echo "  2. Use: ws://$MAC_IP:$OCPP_PORT/ocpp/CP001"
echo "  3. Configure via: web interface, mobile app, or display menu"
echo ""
echo "If charger is not reachable:"
echo "  1. Check network connection"
echo "  2. Verify charger IP address"
echo "  3. Check router/firewall settings"
echo ""
echo "Next Steps:"
echo "  1. Configure charger with OCPP URL"
echo "  2. Monitor: ./monitor-device-connection.sh"
echo "  3. Check dashboard: http://localhost:8080/admin/ops/devices"
echo ""


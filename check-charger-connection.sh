#!/bin/bash

# Check if charger is already configured and trying to connect
# This script monitors for any connection attempts from the charger

echo "=========================================="
echo "Charger Connection Checker"
echo "=========================================="
echo ""

echo "🔍 Checking if charger is already configured and connecting..."
echo ""

# Check embedded OCPP logs in csms-api for recent connections
echo "Recent connection attempts (last 5 minutes):"
docker-compose logs --since 5m csms-api 2>/dev/null | grep -E "OCPP|/ocpp|WebSocket|charge point|BootNotification|connection" | tail -10

if [ $? -ne 0 ] || [ -z "$(docker-compose logs --since 5m csms-api 2>/dev/null | grep -E 'OCPP|/ocpp|connection|BootNotification')" ]; then
    echo "   ⚠️  No recent connection attempts found"
    echo ""
    echo "This means:"
    echo "   - Charger may not be configured with OCPP URL yet"
    echo "   - Charger may be configured with wrong URL"
    echo "   - Charger may not be powered on"
    echo ""
fi

echo ""
echo "=========================================="
echo "Configuration Status"
echo "=========================================="
echo ""

echo "If charger is NOT connecting, you need to configure it."
echo ""
echo "Configuration Methods (choose one):"
echo ""
echo "1. 📱 Mobile App (if available)"
echo "   - Check if manufacturer provides app"
echo "   - App may allow OCPP configuration"
echo ""
echo "2. 🖥️  Display Menu"
echo "   - Use buttons on charger display"
echo "   - Navigate to OCPP/Network settings"
echo "   - Enter OCPP URL manually"
echo ""
echo "3. 🔌 Serial/USB Connection"
echo "   - Connect via USB cable"
echo "   - Use terminal/command interface"
echo "   - Configure OCPP URL via commands"
echo ""
echo "4. 📋 Pre-configured"
echo "   - Check if charger came with default OCPP URL"
echo "   - May already be configured"
echo ""

echo "=========================================="
echo "OCPP Configuration"
echo "=========================================="
echo ""

MAC_IP=$(ifconfig | grep -E "inet " | grep -v 127.0.0.1 | grep "192.168.0" | head -1 | awk '{print $2}')

echo "Your OCPP URL:"
echo "  ws://$MAC_IP:3000/ocpp/CP001"
echo ""
echo "Replace 'CP001' with your Charge Point ID"
echo ""

echo "=========================================="
echo "Real-Time Monitoring"
echo "=========================================="
echo ""
echo "Start monitoring to watch for connections:"
echo "  ./monitor-device-connection.sh"
echo ""
echo "Or manually:"
echo "  docker-compose logs -f csms-api | grep -i ocpp"
echo ""


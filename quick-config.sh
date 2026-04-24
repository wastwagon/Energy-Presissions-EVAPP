#!/bin/bash

# Quick Configuration Helper
# Displays your specific OCPP configuration details

echo "=========================================="
echo "EV Charger OCPP Configuration"
echo "=========================================="
echo ""

echo "📡 Your Network Setup:"
echo "   Network: 192.168.0.0/24"
echo "   Mac IP: 192.168.0.166"
echo "   OCPP Endpoint: ws://192.168.0.166:3000/ocpp/{ID}"
echo ""

echo "🔍 Potential Charger IPs (check these):"
echo "   http://192.168.0.159:80"
echo "   http://192.168.0.199:80"
echo ""

echo "🔐 Login Information:"
echo "   Password Format: SN:XXXXXXXXXX"
echo "   (Where XXXXXXXXXX is serial number from charger display)"
echo ""

echo "⚙️  OCPP Configuration:"
echo ""
echo "   Charger ID (choose one):"
echo "   - CP001 (recommended)"
echo "   - DY0131-001"
echo "   - STATION-001"
echo ""
echo "   OCPP Server URL:"
echo "   ws://192.168.0.166:3000/ocpp/CP001"
echo "   (Replace CP001 with your chosen Charger ID)"
echo ""

echo "📋 Step-by-Step:"
echo "   1. Open browser: http://192.168.0.159:80 (or .199)"
echo "   2. Login with: SN:YOUR_SERIAL_NUMBER"
echo "   3. Find OCPP Settings"
echo "   4. Enter Charger ID: CP001"
echo "   5. Enter OCPP URL: ws://192.168.0.166:3000/ocpp/CP001"
echo "   6. Click 'Set and Reboot'"
echo "   7. Wait for restart"
echo ""

echo "👀 Monitor Connection:"
echo "   ./monitor-device-connection.sh"
echo ""

echo "✅ Check Dashboard:"
echo "   http://localhost:8080/admin/ops/devices"
echo ""


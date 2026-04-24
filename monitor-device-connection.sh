#!/bin/bash

# Real-time Device Connection Monitor
# Monitors embedded OCPP logs for incoming device connections

echo "=========================================="
echo "Device Connection Monitor"
echo "=========================================="
echo ""
echo "Monitoring embedded OCPP logs for incoming connections..."
echo ""
echo "Configure your device with:"
echo "  ws://192.168.0.166:3000/ocpp/CP001"
echo ""
echo "Press Ctrl+C to stop monitoring"
echo ""
echo "=========================================="
echo ""

# Monitor logs in real-time
docker-compose logs -f csms-api 2>/dev/null | while IFS= read -r line; do
    # Check for new connections
    if echo "$line" | grep -qE "New WebSocket connection from charge point|BootNotification|/ocpp"; then
        CHARGE_POINT_ID=$(echo "$line" | grep -oE "charge point: [^ ]+" | cut -d':' -f2 | tr -d ' ')
        echo "🔔 NEW DEVICE CONNECTED!"
        echo "   Charge Point ID: $CHARGE_POINT_ID"
        echo "   Time: $(date '+%Y-%m-%d %H:%M:%S')"
        echo ""
    fi
    
    # Check for BootNotification
    if echo "$line" | grep -qE "BootNotification"; then
        echo "✅ BootNotification received - Device registering..."
        echo ""
    fi
    
    # Check for errors
    if echo "$line" | grep -qiE "error|failed|rejected"; then
        echo "⚠️  ERROR DETECTED:"
        echo "   $line"
        echo ""
    fi
    
    # Show all relevant messages
    if echo "$line" | grep -qE "charge point|BootNotification|connection|WebSocket|OCPP|/ocpp"; then
        echo "📡 $line"
    fi
done


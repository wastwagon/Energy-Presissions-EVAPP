#!/bin/bash

# Quick test script to verify device connectivity
# Run this to check if your OCPP Gateway is accessible from the network

echo "=========================================="
echo "Device Connection Test Script"
echo "=========================================="
echo ""

# Get Mac's IP address
echo "1. Finding your Mac's IP address..."
MAC_IP=$(ifconfig | grep -E "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
echo "   Your Mac's IP: $MAC_IP"
echo ""

# Test local health endpoint
echo "2. Testing OCPP Gateway locally..."
LOCAL_TEST=$(curl -s http://localhost:9000/health)
if [ "$LOCAL_TEST" = "OK" ]; then
    echo "   ✅ Local connection: WORKING"
else
    echo "   ❌ Local connection: FAILED"
    echo "   Response: $LOCAL_TEST"
fi
echo ""

# Check if port is listening
echo "3. Checking if port 9000 is listening..."
if netstat -an | grep -q "\.9000.*LISTEN"; then
    echo "   ✅ Port 9000 is listening"
else
    echo "   ❌ Port 9000 is NOT listening"
fi
echo ""

# Check Docker status
echo "4. Checking Docker containers..."
if docker-compose ps | grep -q "ev-billing-ocpp-gateway.*Up"; then
    echo "   ✅ OCPP Gateway container is running"
else
    echo "   ❌ OCPP Gateway container is NOT running"
    echo "   Run: docker-compose up -d"
fi
echo ""

# Display device configuration
echo "=========================================="
echo "Device Configuration"
echo "=========================================="
echo ""
echo "Configure your charge point device with:"
echo ""
echo "  OCPP Central System URL:"
echo "  ws://$MAC_IP:9000/ocpp/YOUR_CHARGE_POINT_ID"
echo ""
echo "  Example (if Charge Point ID is CP001):"
echo "  ws://$MAC_IP:9000/ocpp/CP001"
echo ""
echo "=========================================="
echo "Testing from Network"
echo "=========================================="
echo ""
echo "To test from another device on the same network:"
echo "  curl http://$MAC_IP:9000/health"
echo ""
echo "Or use a WebSocket client:"
echo "  wscat -c ws://$MAC_IP:9000/ocpp/CP001"
echo ""
echo "=========================================="
echo "Monitoring Logs"
echo "=========================================="
echo ""
echo "Watch for incoming connections:"
echo "  docker-compose logs -f ocpp-gateway"
echo ""
echo "=========================================="


#!/bin/bash

echo "=========================================="
echo "EV Charging Device Connection Diagnostic"
echo "=========================================="
echo ""

echo "1. Checking CSMS API (embedded OCPP) Status..."
echo "-----------------------------------"
docker ps | grep csms-api
echo ""

echo "2. Checking API Health..."
echo "-----------------------------------"
curl -s http://localhost:3000/health
echo ""
echo ""

echo "3. Checking Recent OCPP Logs..."
echo "-----------------------------------"
docker logs --tail 80 ev-billing-csms-api 2>&1 | grep -E "(OCPP|/ocpp|BootNotification|connection|WebSocket)" | tail -20
echo ""

echo "4. Checking Database - Charge Points..."
echo "-----------------------------------"
docker exec ev-billing-postgres psql -U evbilling -d ev_billing_db -c "SELECT charge_point_id, vendor_name, model, serial_number, status, last_seen, last_heartbeat FROM charge_points ORDER BY created_at DESC LIMIT 10;" 2>/dev/null
echo ""

echo "5. Checking Database - Connection Logs..."
echo "-----------------------------------"
docker exec ev-billing-postgres psql -U evbilling -d ev_billing_db -c "SELECT charge_point_id, event_type, status, error_code, created_at FROM connection_logs ORDER BY created_at DESC LIMIT 10;" 2>/dev/null
echo ""

echo "6. Checking Network Connectivity..."
echo "-----------------------------------"
echo "Port 3000 listening on:"
netstat -an | grep 3000 | grep LISTEN
echo ""

echo "7. Checking Active OCPP WebSocket Connections..."
echo "-----------------------------------"
netstat -an | grep 3000 | grep ESTABLISHED
echo ""

echo "8. Testing Embedded OCPP/API endpoint..."
echo "-----------------------------------"
echo "Health endpoint:"
curl -s http://localhost:3000/health
echo ""
echo ""

echo "9. Checking Backend API - Charge Points..."
echo "-----------------------------------"
curl -s http://localhost:3000/api/charge-points | jq '.[0:3] | .[] | {chargePointId, status, lastSeen, lastHeartbeat}' 2>/dev/null
echo ""

echo "10. Device Configuration Recommendations..."
echo "-----------------------------------"
echo "Based on your device configuration images:"
echo ""
echo "Device 1 (192.168.9.x network):"
echo "  - Charge ID: 00330710111935"
echo "  - Server URL: ws://192.168.9.108:9000/ocpp/"
echo "  - Charger IP: 192.168.9.106"
echo "  - Gateway: 192.168.9.1"
echo ""
echo "Device 2 (192.168.0.x network):"
echo "  - Charge ID: 09003307101119"
echo "  - Server URL: ws://192.168.0.101:9000/ocpp/"
echo "  - Charger IP: 192.168.0.100"
echo "  - Gateway: 192.168.0.1"
echo ""
echo "IMPORTANT:"
echo "  - Server URL should NOT include charge point ID at the end"
echo "  - Charge point ID will be extracted from BootNotification"
echo "  - Ensure charger can reach OCPP gateway IP on port 9000"
echo ""

echo "=========================================="
echo "Diagnostic Complete"
echo "=========================================="


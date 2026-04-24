#!/bin/bash

echo "=========================================="
echo "Embedded OCPP Connection Monitor"
echo "=========================================="
echo ""
echo "Monitoring for connections from charge station..."
echo "Charge Station: 192.168.0.100"
echo "Gateway: 192.168.0.101:3000 (/ocpp)"
echo ""
echo "Press Ctrl+C to stop monitoring"
echo ""
echo "=========================================="
echo ""

# Monitor logs in real-time
docker logs -f ev-billing-csms-api 2>&1 | grep --line-buffered -E "(OCPP|/ocpp|BootNotification|connection|192.168.0.100|error|warn)" --color=always


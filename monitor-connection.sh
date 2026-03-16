#!/bin/bash

echo "=========================================="
echo "OCPP Gateway Connection Monitor"
echo "=========================================="
echo ""
echo "Monitoring for connections from charge station..."
echo "Charge Station: 192.168.0.100"
echo "Gateway: 192.168.0.101:9000"
echo ""
echo "Press Ctrl+C to stop monitoring"
echo ""
echo "=========================================="
echo ""

# Monitor logs in real-time
docker logs -f ev-billing-ocpp-gateway 2>&1 | grep --line-buffered -E "(connection|BootNotification|temp_|mapping|192.168.0.100|error|warn)" --color=always


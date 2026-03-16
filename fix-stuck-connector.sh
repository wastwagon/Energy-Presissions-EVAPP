#!/bin/bash

# Script to fix stuck connector status
# This will force the connector to Available status

CHARGE_POINT_ID="0900330710111935"
CONNECTOR_ID=1

echo "=========================================="
echo "Fixing Stuck Connector Status"
echo "=========================================="
echo ""
echo "Charge Point ID: $CHARGE_POINT_ID"
echo "Connector ID: $CONNECTOR_ID"
echo ""

# Force update connector status to Available
echo "1. Updating connector status to Available..."
docker exec ev-billing-postgres psql -U evbilling -d ev_billing_db -c \
  "UPDATE connectors SET status = 'Available', error_code = 'NoError', last_status_update = NOW() \
   WHERE charge_point_id = '$CHARGE_POINT_ID' AND connector_id = $CONNECTOR_ID;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Connector status updated to Available"
else
    echo "❌ Failed to update connector status"
    exit 1
fi

echo ""
echo "2. Verifying status..."
docker exec ev-billing-postgres psql -U evbilling -d ev_billing_db -c \
  "SELECT charge_point_id, connector_id, status, error_code, last_status_update \
   FROM connectors WHERE charge_point_id = '$CHARGE_POINT_ID';" 2>/dev/null

echo ""
echo "=========================================="
echo "⚠️  IMPORTANT NOTES"
echo "=========================================="
echo ""
echo "The device may continue to send 'Preparing' status if:"
echo "  1. An EV is physically connected to the charger"
echo "  2. The charging cable is plugged in"
echo ""
echo "To permanently fix this:"
echo "  1. Check if an EV is connected to the charger"
echo "  2. Unplug the charging cable if no charging should occur"
echo "  3. Check the device display for status"
echo "  4. Access device web interface: http://192.168.0.100:80"
echo ""
echo "The status will be overwritten again if the device sends"
echo "a StatusNotification with 'Preparing' status."
echo ""
echo "=========================================="


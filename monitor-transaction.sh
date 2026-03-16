#!/bin/bash

# Monitor transaction status
CHARGE_POINT_ID="0900330710111935"
USER_ID=15
USER_EMAIL="customer1@vendor1.com"

echo "=========================================="
echo "Transaction Monitor - GHS 10 Charging Session"
echo "=========================================="
echo ""
echo "Charge Point: $CHARGE_POINT_ID"
echo "User: $USER_EMAIL (ID: $USER_ID)"
echo "Amount: GHS 10.00"
echo ""

while true; do
    echo "=== $(date '+%Y-%m-%d %H:%M:%S') ==="
    
    # Check transaction
    echo "1. Transaction Status:"
    TRANSACTION=$(docker exec ev-billing-postgres psql -U evbilling -d ev_billing_db -t -c \
        "SELECT transaction_id, status, wallet_reserved_amount, start_time FROM transactions \
         WHERE charge_point_id = '$CHARGE_POINT_ID' AND user_id = $USER_ID ORDER BY created_at DESC LIMIT 1;" 2>/dev/null | xargs)
    
    if [ -n "$TRANSACTION" ] && [ "$TRANSACTION" != "" ]; then
        echo "   ✅ Transaction found: $TRANSACTION"
    else
        echo "   ⏳ Waiting for StartTransaction from device..."
    fi
    
    # Check connector status
    echo "2. Connector Status:"
    CONNECTOR_STATUS=$(docker exec ev-billing-postgres psql -U evbilling -d ev_billing_db -t -c \
        "SELECT status FROM connectors WHERE charge_point_id = '$CHARGE_POINT_ID' AND connector_id = 1;" 2>/dev/null | xargs)
    echo "   Status: $CONNECTOR_STATUS"
    
    # Check wallet balance
    echo "3. Wallet Balance:"
    BALANCE=$(docker exec ev-billing-postgres psql -U evbilling -d ev_billing_db -t -c \
        "SELECT balance FROM users WHERE id = $USER_ID;" 2>/dev/null | xargs)
    echo "   Balance: GHS $BALANCE"
    
    # Check wallet transactions
    echo "4. Wallet Transactions:"
    WALLET_TX=$(docker exec ev-billing-postgres psql -U evbilling -d ev_billing_db -t -c \
        "SELECT type, amount, status FROM wallet_transactions WHERE user_id = $USER_ID ORDER BY created_at DESC LIMIT 1;" 2>/dev/null | xargs)
    if [ -n "$WALLET_TX" ]; then
        echo "   Latest: $WALLET_TX"
    else
        echo "   No wallet transactions yet"
    fi
    
    # Check OCPP Gateway logs
    echo "5. Recent OCPP Activity:"
    RECENT=$(docker logs --tail 10 ev-billing-ocpp-gateway 2>&1 | grep -i "StartTransaction\|StatusNotification.*Charging\|StopTransaction" | tail -1)
    if [ -n "$RECENT" ]; then
        echo "   $RECENT"
    else
        echo "   No recent activity"
    fi
    
    echo ""
    
    # Break if transaction completed
    if [ -n "$TRANSACTION" ] && [[ "$TRANSACTION" == *"Completed"* ]]; then
        echo "✅ Transaction completed!"
        break
    fi
    
    sleep 10
done


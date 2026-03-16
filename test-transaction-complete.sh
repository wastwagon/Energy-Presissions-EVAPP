#!/bin/bash

# Complete Transaction Test Script
# Tests the full transaction flow for GHS 10

CHARGE_POINT_ID="0900330710111935"
CONNECTOR_ID=1
USER_EMAIL="customer1@vendor1.com"
USER_ID=15
AMOUNT=10
ID_TAG="USER_15"

echo "=========================================="
echo "Complete Transaction Test - GHS $AMOUNT"
echo "=========================================="
echo ""
echo "Charge Point: $CHARGE_POINT_ID"
echo "User: $USER_EMAIL (ID: $USER_ID)"
echo "Amount: GHS $AMOUNT"
echo "IdTag: $ID_TAG"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Step 1: Get auth token
echo -e "${BLUE}Step 1: Authenticating...${NC}"
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_EMAIL\",\"password\":\"customer123\"}" \
  2>&1 | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Failed to get auth token${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Authenticated${NC}"
echo ""

# Step 2: Check wallet balance
echo -e "${BLUE}Step 2: Checking wallet balance...${NC}"
BALANCE=$(docker exec ev-billing-postgres psql -U evbilling -d ev_billing_db -t -c \
  "SELECT balance FROM users WHERE id = $USER_ID;" 2>/dev/null | xargs)
echo "Current Balance: GHS $BALANCE"
if (( $(echo "$BALANCE < $AMOUNT" | bc -l) )); then
    echo -e "${RED}❌ Insufficient balance${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Sufficient balance${NC}"
echo ""

# Step 3: Ensure IdTag exists
echo -e "${BLUE}Step 3: Ensuring IdTag exists...${NC}"
docker exec ev-billing-postgres psql -U evbilling -d ev_billing_db -c \
  "INSERT INTO id_tags (id_tag, status, user_id) VALUES ('$ID_TAG', 'Active', $USER_ID) \
   ON CONFLICT (id_tag) DO UPDATE SET status = 'Active', user_id = $USER_ID;" 2>/dev/null > /dev/null
echo -e "${GREEN}✅ IdTag ready${NC}"
echo ""

# Step 4: Ensure connector is Available
echo -e "${BLUE}Step 4: Checking connector status...${NC}"
CONNECTOR_STATUS=$(docker exec ev-billing-postgres psql -U evbilling -d ev_billing_db -t -c \
  "SELECT status FROM connectors WHERE charge_point_id = '$CHARGE_POINT_ID' AND connector_id = $CONNECTOR_ID;" 2>/dev/null | xargs)

if [ "$CONNECTOR_STATUS" != "Available" ]; then
    echo "Current status: $CONNECTOR_STATUS"
    echo "Setting to Available..."
    docker exec ev-billing-postgres psql -U evbilling -d ev_billing_db -c \
      "UPDATE connectors SET status = 'Available', last_status_update = NOW() \
       WHERE charge_point_id = '$CHARGE_POINT_ID' AND connector_id = $CONNECTOR_ID;" 2>/dev/null > /dev/null
    echo -e "${GREEN}✅ Connector set to Available${NC}"
else
    echo -e "${GREEN}✅ Connector is Available${NC}"
fi
echo ""

# Step 5: Start transaction
echo -e "${BLUE}Step 5: Starting transaction...${NC}"
START_TIME=$(date '+%Y-%m-%d %H:%M:%S')
RESPONSE=$(curl -s -X POST http://localhost:3000/api/charge-points/$CHARGE_POINT_ID/wallet-start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"connectorId\": $CONNECTOR_ID, \"userId\": $USER_ID, \"amount\": $AMOUNT}" 2>&1)

echo "Response: $RESPONSE"
SUCCESS=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null)

if [ "$SUCCESS" != "True" ] && [ "$SUCCESS" != "true" ]; then
    echo -e "${RED}❌ Failed to start transaction${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Transaction command sent${NC}"
echo ""

# Step 6: Monitor for StartTransaction
echo -e "${BLUE}Step 6: Monitoring for StartTransaction...${NC}"
echo "Waiting for device to send StartTransaction message..."
echo ""

MAX_WAIT=120  # 2 minutes
ELAPSED=0
TRANSACTION_FOUND=false

while [ $ELAPSED -lt $MAX_WAIT ]; do
    # Check for StartTransaction in logs
    START_TX=$(docker logs --tail 100 ev-billing-ocpp-gateway 2>&1 | grep -i "StartTransaction.*$CHARGE_POINT_ID\|USER_15" | tail -1)
    
    # Check database for transaction
    DB_TX=$(docker exec ev-billing-postgres psql -U evbilling -d ev_billing_db -t -c \
      "SELECT transaction_id FROM transactions WHERE charge_point_id = '$CHARGE_POINT_ID' AND id_tag = '$ID_TAG' ORDER BY created_at DESC LIMIT 1;" 2>/dev/null | xargs)
    
    # Check connector status
    CONN_STATUS=$(docker exec ev-billing-postgres psql -U evbilling -d ev_billing_db -t -c \
      "SELECT status FROM connectors WHERE charge_point_id = '$CHARGE_POINT_ID' AND connector_id = $CONNECTOR_ID;" 2>/dev/null | xargs)
    
    if [ -n "$DB_TX" ] && [ "$DB_TX" != "" ]; then
        echo -e "${GREEN}✅ StartTransaction received! Transaction ID: $DB_TX${NC}"
        TRANSACTION_FOUND=true
        break
    fi
    
    echo "[$ELAPSED s] Status: $CONN_STATUS | Waiting for StartTransaction..."
    sleep 5
    ELAPSED=$((ELAPSED + 5))
done

if [ "$TRANSACTION_FOUND" = false ]; then
    echo -e "${YELLOW}⚠️  StartTransaction not received after $MAX_WAIT seconds${NC}"
    echo "Device may need:"
    echo "  - EV physically connected"
    echo "  - User confirmation on device screen"
    echo "  - Device configuration"
    echo ""
fi

# Step 7: Check transaction status
if [ "$TRANSACTION_FOUND" = true ]; then
    echo ""
    echo -e "${BLUE}Step 7: Transaction Details...${NC}"
    docker exec ev-billing-postgres psql -U evbilling -d ev_billing_db -c \
      "SELECT transaction_id, status, wallet_reserved_amount, start_time, \
       EXTRACT(EPOCH FROM (NOW() - start_time))/60 as minutes_running \
       FROM transactions WHERE transaction_id = $DB_TX;" 2>/dev/null
    
    echo ""
    echo -e "${BLUE}Step 8: Wallet Status...${NC}"
    docker exec ev-billing-postgres psql -U evbilling -d ev_billing_db -c \
      "SELECT id, type, amount, balance_before, balance_after, status, description \
       FROM wallet_transactions WHERE user_id = $USER_ID ORDER BY created_at DESC LIMIT 3;" 2>/dev/null
    
    echo ""
    echo -e "${BLUE}Step 9: Current Wallet Balance...${NC}"
    docker exec ev-billing-postgres psql -U evbilling -d ev_billing_db -c \
      "SELECT balance FROM users WHERE id = $USER_ID;" 2>/dev/null
    
    echo ""
    echo -e "${BLUE}Step 10: Monitoring for completion (~2 minutes)...${NC}"
    echo "Waiting for StopTransaction..."
    
    # Monitor for StopTransaction
    while [ $ELAPSED -lt $((MAX_WAIT + 120)) ]; do
        STOP_TX=$(docker logs --tail 50 ev-billing-ocpp-gateway 2>&1 | grep -i "StopTransaction.*$DB_TX" | tail -1)
        
        TX_STATUS=$(docker exec ev-billing-postgres psql -U evbilling -d ev_billing_db -t -c \
          "SELECT status FROM transactions WHERE transaction_id = $DB_TX;" 2>/dev/null | xargs)
        
        if [ "$TX_STATUS" = "Completed" ]; then
            echo -e "${GREEN}✅ Transaction completed!${NC}"
            break
        fi
        
        echo "[$ELAPSED s] Status: $TX_STATUS | Waiting for completion..."
        sleep 10
        ELAPSED=$((ELAPSED + 10))
    done
    
    echo ""
    echo -e "${BLUE}Final Transaction Status:${NC}"
    docker exec ev-billing-postgres psql -U evbilling -d ev_billing_db -c \
      "SELECT transaction_id, status, total_energy_kwh, total_cost, currency, \
       EXTRACT(EPOCH FROM (stop_time - start_time))/60 as duration_minutes \
       FROM transactions WHERE transaction_id = $DB_TX;" 2>/dev/null
fi

echo ""
echo "=========================================="
echo "Test Complete"
echo "=========================================="


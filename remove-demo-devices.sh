#!/bin/bash

# Remove Demo and Dummy Devices
# This script removes all demo/dummy charge points while preserving real devices

echo "=========================================="
echo "Remove Demo/Dummy Devices Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get authentication token
echo "Step 1: Authenticating..."
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@evcharging.com","password":"admin123"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin).get('accessToken', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Authentication failed${NC}"
    echo "Please check your credentials and ensure the backend is running"
    exit 1
fi

echo -e "${GREEN}✅ Authenticated successfully${NC}"
echo ""

# Get all charge points
echo "Step 2: Fetching all charge points..."
ALL_CHARGE_POINTS=$(curl -s "http://localhost:3000/api/charge-points" \
  -H "Authorization: Bearer $TOKEN")

# Identify demo devices
echo "Step 3: Identifying demo/dummy devices..."
echo ""

# Demo device IDs (from sample data)
DEMO_IDS=("CP-ACC-001" "CP-ACC-002" "CP-ACC-003" "CP-ACC-004" "CP-ASH-001" "CP-WES-001")

# Real device ID to preserve
REAL_DEVICE_ID="0900330710111935"

# Counters
DELETED=0
FAILED=0
SKIPPED=0

# Delete each demo device
for DEVICE_ID in "${DEMO_IDS[@]}"; do
    echo -n "Deleting $DEVICE_ID... "
    
    # Check if device exists
    DEVICE_EXISTS=$(echo "$ALL_CHARGE_POINTS" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    devices = data if isinstance(data, list) else []
    for d in devices:
        if d.get('chargePointId') == '$DEVICE_ID':
            print('exists')
            break
except:
    pass
" 2>/dev/null)
    
    if [ "$DEVICE_EXISTS" != "exists" ]; then
        echo -e "${YELLOW}⚠️  Not found (may already be deleted)${NC}"
        ((SKIPPED++))
        continue
    fi
    
    # Delete the device
    DELETE_RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "http://localhost:3000/api/charge-points/$DEVICE_ID" \
      -H "Authorization: Bearer $TOKEN")
    
    HTTP_CODE=$(echo "$DELETE_RESPONSE" | tail -n1)
    
    if [ "$HTTP_CODE" = "204" ] || [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✅ Deleted${NC}"
        ((DELETED++))
    else
        echo -e "${RED}❌ Failed (HTTP $HTTP_CODE)${NC}"
        ((FAILED++))
    fi
done

echo ""
echo "=========================================="
echo "Deletion Summary"
echo "=========================================="
echo -e "${GREEN}✅ Successfully deleted: $DELETED${NC}"
echo -e "${YELLOW}⚠️  Skipped (not found): $SKIPPED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo ""

# Verify real device is still present
echo "Step 4: Verifying real device is preserved..."
REAL_DEVICE_EXISTS=$(curl -s "http://localhost:3000/api/charge-points/$REAL_DEVICE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data.get('chargePointId') == '$REAL_DEVICE_ID':
        print('exists')
except:
    pass
" 2>/dev/null)

if [ "$REAL_DEVICE_EXISTS" = "exists" ]; then
    echo -e "${GREEN}✅ Real device ($REAL_DEVICE_ID) is preserved${NC}"
else
    echo -e "${RED}❌ WARNING: Real device ($REAL_DEVICE_ID) not found!${NC}"
fi

echo ""
echo "Step 5: Listing remaining charge points..."
REMAINING=$(curl -s "http://localhost:3000/api/charge-points" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    devices = data if isinstance(data, list) else []
    print(f'Total remaining devices: {len(devices)}')
    for d in devices:
        print(f\"  - {d.get('chargePointId', 'Unknown')} ({d.get('vendorName', 'No vendor') or 'No vendor'})\")
except Exception as e:
    print(f'Error: {e}')
" 2>/dev/null)

echo "$REMAINING"
echo ""
echo -e "${GREEN}✅ Demo device removal complete!${NC}"

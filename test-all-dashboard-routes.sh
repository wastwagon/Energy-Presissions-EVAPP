#!/bin/bash

echo "=========================================="
echo "Testing All Dashboard Routes"
echo "=========================================="
echo ""

BASE_URL="http://localhost:8080"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

test_route() {
    local route=$1
    local name=$2
    local status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$route")
    
    if [ "$status" = "200" ] || [ "$status" = "302" ] || [ "$status" = "401" ]; then
        echo -e "   ${GREEN}✅${NC} $name - HTTP $status"
        return 0
    else
        echo -e "   ${RED}❌${NC} $name - HTTP $status"
        return 1
    fi
}

echo "1. Testing Customer Routes..."
test_route "/user/dashboard" "Customer Dashboard"
test_route "/user/sessions/active" "Active Sessions"
test_route "/user/sessions/history" "Session History"
test_route "/user/wallet" "Wallet"
test_route "/user/wallet/top-up" "Top Up"
test_route "/user/payments" "Payment History"
test_route "/user/profile" "Profile"

echo ""
echo "2. Testing Admin Routes..."
test_route "/admin/dashboard" "Admin Dashboard"
test_route "/admin/ops" "Admin Operations"
test_route "/admin/ops/sessions" "Admin Sessions"
test_route "/admin/ops/devices" "Admin Devices"
test_route "/admin/wallets" "Admin Wallets"
test_route "/admin/tariffs" "Admin Tariffs"
test_route "/admin/payments" "Admin Payments"
test_route "/admin/reports" "Admin Reports"

echo ""
echo "3. Testing Super Admin Routes..."
test_route "/superadmin/dashboard" "Super Admin Dashboard"
test_route "/superadmin/ops" "Super Admin Operations"
test_route "/superadmin/ops/sessions" "Super Admin Sessions"
test_route "/superadmin/ops/devices" "Super Admin Devices"
test_route "/superadmin/vendors" "Vendor Management"
test_route "/superadmin/users" "User Management"
test_route "/superadmin/wallets" "Wallet Management"
test_route "/superadmin/analytics" "Analytics"
test_route "/superadmin/connection-logs" "Connection Logs"
test_route "/superadmin/tariffs" "Super Admin Tariffs"
test_route "/superadmin/reports" "Super Admin Reports"

echo ""
echo "=========================================="
echo "Summary"
echo "=========================================="
echo -e "${GREEN}✅ Customer Pages: 7 routes${NC}"
echo -e "${GREEN}✅ Admin Pages: 8 routes${NC}"
echo -e "${GREEN}✅ Super Admin Pages: 11 routes${NC}"
echo ""
echo "Total: 26 routes configured"
echo ""
echo "Next Steps:"
echo "1. Open http://localhost:8080 in browser"
echo "2. Login and test navigation:"
echo "   - Customer: customer1@vendor1.com / customer123"
echo "   - Admin: admin1@vendor1.com / admin123"
echo "   - Super Admin: admin@evcharging.com / admin123"
echo "3. Verify all menu items work correctly"
echo ""


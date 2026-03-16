#!/bin/bash

# Comprehensive Feature Testing Script
# Tests all dashboards, APIs, and frontend connectivity

set -e

API_URL="http://localhost:3000/api"
FRONTEND_URL="http://localhost:5173"
GATEWAY_URL="ws://localhost:9000"

echo "=========================================="
echo "EV Charging System - Feature Test Suite"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

test_endpoint() {
    local name=$1
    local method=$2
    local url=$3
    local data=$4
    local expected_status=${5:-200}
    
    echo -n "Testing $name... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "$url" -H "Content-Type: application/json" 2>/dev/null)
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$url" -H "Content-Type: application/json" -d "$data" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" -H "Content-Type: application/json" ${data:+-d "$data"} 2>/dev/null)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $http_code)"
        echo "  Response: $body" | head -c 200
        echo ""
        ((FAILED++))
        return 1
    fi
}

test_auth_endpoint() {
    local name=$1
    local email=$2
    local password=$3
    local expected_status=${4:-200}
    
    echo -n "Testing $name... "
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$password\"}" 2>/dev/null)
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        # Extract token if successful
        if [ "$http_code" = "200" ]; then
            TOKEN=$(echo "$body" | grep -o '"token":"[^"]*' | cut -d'"' -f4 || echo "")
            USER_DATA=$(echo "$body" | grep -o '"user":{[^}]*}' || echo "")
        fi
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $http_code)"
        echo "  Response: $body" | head -c 200
        echo ""
        ((FAILED++))
        return 1
    fi
}

test_authenticated_endpoint() {
    local name=$1
    local method=$2
    local url=$3
    local token=$4
    local data=$5
    local expected_status=${6:-200}
    
    echo -n "Testing $name... "
    
    if [ -z "$token" ]; then
        echo -e "${YELLOW}⚠ SKIP${NC} (No token available)"
        return 1
    fi
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "$url" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" 2>/dev/null)
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$url" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            -d "$data" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            ${data:+-d "$data"} 2>/dev/null)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $http_code)"
        echo "  Response: $body" | head -c 200
        echo ""
        ((FAILED++))
        return 1
    fi
}

echo -e "${BLUE}=== 1. Service Health Checks ===${NC}"
echo ""

test_endpoint "API Health Check" "GET" "$API_URL/../health"
test_endpoint "API Root" "GET" "$API_URL"
test_endpoint "Frontend Accessibility" "GET" "$FRONTEND_URL" "" "200"

echo ""
echo -e "${BLUE}=== 2. Public Endpoints (No Auth Required) ===${NC}"
echo ""

# Test public station endpoints
test_endpoint "Find Nearby Stations (Public)" "GET" "$API_URL/stations/nearby?latitude=5.6037&longitude=-0.1870&radiusKm=50&limit=5"
test_endpoint "Search Stations (Public)" "GET" "$API_URL/stations/search?q=Accra&limit=10"
test_endpoint "Stations in Map Bounds (Public)" "GET" "$API_URL/stations/map?north=5.7&south=5.5&east=-0.1&west=-0.3"

echo ""
echo -e "${BLUE}=== 3. Authentication Tests ===${NC}"
echo ""

SUPER_ADMIN_TOKEN=""
ADMIN_TOKEN=""
CUSTOMER_TOKEN=""

# Test Super Admin Login
if test_auth_endpoint "Super Admin Login" "admin@evcharging.com" "admin123"; then
    SUPER_ADMIN_TOKEN=$TOKEN
fi

# Test Admin Login
if test_auth_endpoint "Admin Login (Vendor 1)" "admin1@vendor1.com" "admin123"; then
    ADMIN_TOKEN=$TOKEN
fi

# Test Customer Login
if test_auth_endpoint "Customer Login" "customer1@vendor1.com" "customer123"; then
    CUSTOMER_TOKEN=$TOKEN
fi

# Test invalid login
test_auth_endpoint "Invalid Login" "invalid@example.com" "wrongpassword" "401"

echo ""
echo -e "${BLUE}=== 4. Super Admin Dashboard Features ===${NC}"
echo ""

if [ -n "$SUPER_ADMIN_TOKEN" ]; then
    test_authenticated_endpoint "Super Admin Dashboard Stats" "GET" "$API_URL/dashboard/stats" "$SUPER_ADMIN_TOKEN"
    test_authenticated_endpoint "All Vendors List" "GET" "$API_URL/vendors" "$SUPER_ADMIN_TOKEN"
    test_authenticated_endpoint "All Charge Points" "GET" "$API_URL/charge-points?limit=10" "$SUPER_ADMIN_TOKEN"
    test_authenticated_endpoint "All Transactions" "GET" "$API_URL/transactions?limit=10" "$SUPER_ADMIN_TOKEN"
    test_authenticated_endpoint "All Users" "GET" "$API_URL/users?limit=10" "$SUPER_ADMIN_TOKEN"
    test_authenticated_endpoint "Connection Logs" "GET" "$API_URL/connection-logs?limit=10" "$SUPER_ADMIN_TOKEN"
else
    echo -e "${YELLOW}⚠ Skipping Super Admin tests (no token)${NC}"
fi

echo ""
echo -e "${BLUE}=== 5. Admin Dashboard Features (Vendor Admin) ===${NC}"
echo ""

if [ -n "$ADMIN_TOKEN" ]; then
    test_authenticated_endpoint "Admin Dashboard Stats" "GET" "$API_URL/dashboard/vendor/stats" "$ADMIN_TOKEN"
    test_authenticated_endpoint "Vendor Charge Points" "GET" "$API_URL/charge-points?limit=10" "$ADMIN_TOKEN"
    test_authenticated_endpoint "Vendor Transactions" "GET" "$API_URL/transactions?limit=10" "$ADMIN_TOKEN"
    test_authenticated_endpoint "Vendor Users" "GET" "$API_URL/users?limit=10" "$ADMIN_TOKEN"
    test_authenticated_endpoint "Active Sessions" "GET" "$API_URL/transactions/active" "$ADMIN_TOKEN"
    test_authenticated_endpoint "Operations Dashboard Data" "GET" "$API_URL/charge-points?limit=20" "$ADMIN_TOKEN"
else
    echo -e "${YELLOW}⚠ Skipping Admin tests (no token)${NC}"
fi

echo ""
echo -e "${BLUE}=== 6. Customer Dashboard Features ===${NC}"
echo ""

if [ -n "$CUSTOMER_TOKEN" ]; then
    test_authenticated_endpoint "Customer Wallet Balance" "GET" "$API_URL/wallet/balance" "$CUSTOMER_TOKEN"
    test_authenticated_endpoint "Customer Transactions" "GET" "$API_URL/transactions?limit=10" "$CUSTOMER_TOKEN"
    test_authenticated_endpoint "Customer Payments" "GET" "$API_URL/payments/user/$(echo $CUSTOMER_TOKEN | cut -d'.' -f2 | base64 -d 2>/dev/null | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2 || echo '1')" "$CUSTOMER_TOKEN"
    test_authenticated_endpoint "Customer Charge Points Access" "GET" "$API_URL/charge-points?limit=10" "$CUSTOMER_TOKEN"
else
    echo -e "${YELLOW}⚠ Skipping Customer tests (no token)${NC}"
fi

echo ""
echo -e "${BLUE}=== 7. Station Finding Features ===${NC}"
echo ""

# Test with authenticated user
if [ -n "$CUSTOMER_TOKEN" ]; then
    test_authenticated_endpoint "Station Details (Auth)" "GET" "$API_URL/stations/CP001" "$CUSTOMER_TOKEN"
fi

# Test nearby with different locations (Ghana)
test_endpoint "Nearby Stations - Accra" "GET" "$API_URL/stations/nearby?latitude=5.6037&longitude=-0.1870&radiusKm=50"
test_endpoint "Nearby Stations - Kumasi" "GET" "$API_URL/stations/nearby?latitude=6.6885&longitude=-1.6244&radiusKm=50"
test_endpoint "Search Stations - Accra" "GET" "$API_URL/stations/search?q=Accra"
test_endpoint "Search Stations - Greater Accra" "GET" "$API_URL/stations/search?q=Greater%20Accra"

echo ""
echo -e "${BLUE}=== 8. Charge Point Management ===${NC}"
echo ""

if [ -n "$ADMIN_TOKEN" ]; then
    test_authenticated_endpoint "Get Charge Point by ID" "GET" "$API_URL/charge-points/CP001" "$ADMIN_TOKEN"
    test_authenticated_endpoint "Search Charge Points" "GET" "$API_URL/charge-points?search=CP&limit=10" "$ADMIN_TOKEN"
    test_authenticated_endpoint "Charge Point Connectors" "GET" "$API_URL/charge-points/CP001/connectors" "$ADMIN_TOKEN"
fi

echo ""
echo -e "${BLUE}=== 9. Transaction Management ===${NC}"
echo ""

if [ -n "$ADMIN_TOKEN" ]; then
    test_authenticated_endpoint "Get Transaction by ID" "GET" "$API_URL/transactions/1" "$ADMIN_TOKEN"
    test_authenticated_endpoint "Transaction Meter Values" "GET" "$API_URL/transactions/1/meter-values" "$ADMIN_TOKEN"
fi

if [ -n "$CUSTOMER_TOKEN" ]; then
    test_authenticated_endpoint "Customer Transaction History" "GET" "$API_URL/transactions?limit=20&offset=0" "$CUSTOMER_TOKEN"
fi

echo ""
echo -e "${BLUE}=== 10. Payment Features ===${NC}"
echo ""

if [ -n "$ADMIN_TOKEN" ]; then
    test_authenticated_endpoint "Get Paystack Public Key" "GET" "$API_URL/payments/public-key" "$ADMIN_TOKEN"
    test_authenticated_endpoint "Get User Payments" "GET" "$API_URL/payments/user/1" "$ADMIN_TOKEN"
fi

echo ""
echo -e "${BLUE}=== 11. Wallet Features ===${NC}"
echo ""

if [ -n "$CUSTOMER_TOKEN" ]; then
    test_authenticated_endpoint "Get Wallet Balance" "GET" "$API_URL/wallet/balance" "$CUSTOMER_TOKEN"
    test_authenticated_endpoint "Get Wallet Transactions" "GET" "$API_URL/wallet/transactions?limit=10" "$CUSTOMER_TOKEN"
fi

echo ""
echo -e "${BLUE}=== 12. Billing Features ===${NC}"
echo ""

if [ -n "$CUSTOMER_TOKEN" ]; then
    test_authenticated_endpoint "Get Customer Invoices" "GET" "$API_URL/billing/invoices?limit=10" "$CUSTOMER_TOKEN"
fi

echo ""
echo -e "${BLUE}=== 13. Settings & Configuration ===${NC}"
echo ""

if [ -n "$ADMIN_TOKEN" ]; then
    test_authenticated_endpoint "Get Vendor Settings" "GET" "$API_URL/settings/vendor" "$ADMIN_TOKEN"
    test_authenticated_endpoint "Get CMS Content" "GET" "$API_URL/settings/cms/about" "$ADMIN_TOKEN"
fi

echo ""
echo -e "${BLUE}=== 14. Frontend Route Accessibility ===${NC}"
echo ""

# Test frontend routes (should return HTML, not 404)
test_endpoint "Frontend - Home" "GET" "$FRONTEND_URL/"
test_endpoint "Frontend - Stations Page" "GET" "$FRONTEND_URL/stations"
test_endpoint "Frontend - Login Pages" "GET" "$FRONTEND_URL/login/admin"

echo ""
echo -e "${BLUE}=== 15. Database Connectivity Test ===${NC}"
echo ""

# Test that we can get data (indicates DB connectivity)
if [ -n "$SUPER_ADMIN_TOKEN" ]; then
    test_authenticated_endpoint "Database - Vendors Query" "GET" "$API_URL/vendors?limit=1" "$SUPER_ADMIN_TOKEN"
    test_authenticated_endpoint "Database - Charge Points Query" "GET" "$API_URL/charge-points?limit=1" "$SUPER_ADMIN_TOKEN"
fi

echo ""
echo "=========================================="
echo -e "${BLUE}Test Summary${NC}"
echo "=========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi


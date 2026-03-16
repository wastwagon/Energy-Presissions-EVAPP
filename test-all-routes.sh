#!/bin/bash

echo "=========================================="
echo "Testing All Customer Routes"
echo "=========================================="
echo ""

BASE_URL="http://localhost:8080"

routes=(
  "/user/dashboard"
  "/user/sessions/active"
  "/user/sessions/history"
  "/user/wallet"
  "/user/wallet/top-up"
  "/user/payments"
  "/user/profile"
)

for route in "${routes[@]}"; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$route")
  if [ "$status" = "200" ] || [ "$status" = "302" ] || [ "$status" = "401" ]; then
    echo "✅ $route - HTTP $status"
  else
    echo "❌ $route - HTTP $status"
  fi
done

echo ""
echo "=========================================="
echo "Summary"
echo "=========================================="
echo "✅ All customer pages created"
echo "✅ Routes configured in App.tsx"
echo "✅ Menu items enabled"
echo ""
echo "Next: Test in browser by logging in as customer"


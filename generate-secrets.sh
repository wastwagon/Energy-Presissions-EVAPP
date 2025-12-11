#!/bin/bash

# Script to generate secrets for Render deployment
# Run this script and copy the values to Render dashboard

echo "=========================================="
echo "  EV Billing System - Secret Generator"
echo "=========================================="
echo ""
echo "Copy these values to your Render dashboard:"
echo ""

echo "1. JWT_SECRET:"
echo "   $(openssl rand -base64 32)"
echo ""

echo "2. SERVICE_TOKEN:"
echo "   $(openssl rand -base64 32)"
echo ""

echo "3. PAYSTACK_SECRET_KEY:"
echo "   (Get from Paystack Dashboard: https://dashboard.paystack.com/#/settings/developer)"
echo ""

echo "4. PAYSTACK_PUBLIC_KEY:"
echo "   (Get from Paystack Dashboard: https://dashboard.paystack.com/#/settings/developer)"
echo ""

echo "=========================================="
echo "  Instructions:"
echo "=========================================="
echo ""
echo "1. Go to your Render dashboard"
echo "2. Select the 'ev-billing-api' service"
echo "3. Go to 'Environment' tab"
echo "4. Add each secret above with 'sync: false'"
echo "5. For Paystack keys, use your actual keys from Paystack dashboard"
echo ""
echo "Note: MINIO_ACCESS_KEY and MINIO_SECRET_KEY are already set"
echo "      to default values (minioadmin / minioadmin123)"
echo "      Change these in production for security!"
echo ""


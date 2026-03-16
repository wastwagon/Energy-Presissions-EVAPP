#!/bin/bash

# Script to clear resolved connection errors
# This script deletes connection errors that are older than 1 hour and have been resolved
# (i.e., the device has successfully connected since the error occurred)

echo "=== Clearing Resolved Connection Errors ==="
echo ""

# Get API URL from environment or use default
API_URL="${API_URL:-http://localhost:3000}"

# Clear errors older than 1 hour that are resolved
echo "Deleting resolved errors older than 1 hour..."
RESPONSE=$(curl -s -X DELETE "${API_URL}/api/connection-logs/errors/resolved?olderThanHours=1")

# Check if curl was successful
if [ $? -eq 0 ]; then
    DELETED=$(echo $RESPONSE | grep -o '"deleted":[0-9]*' | grep -o '[0-9]*')
    if [ -n "$DELETED" ]; then
        echo "✅ Successfully deleted $DELETED resolved error(s)"
    else
        echo "✅ No resolved errors found to delete"
        echo "Response: $RESPONSE"
    fi
else
    echo "❌ Failed to connect to API at $API_URL"
    echo "Make sure the backend is running and accessible"
    exit 1
fi

echo ""
echo "Done!"


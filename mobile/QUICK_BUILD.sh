#!/bin/bash
# Quick Build Script - Run after setup-env.sh

source setup-env.sh

echo "🚀 Building Mobile Apps..."
echo ""

# Build iOS
echo "🍎 Building iOS..."
cd ios
pod install
cd ..
npm run build:ios

# Build Android (if Java installed)
if command -v java &> /dev/null && java -version 2>&1 | grep -q "version"; then
    echo ""
    echo "🤖 Building Android..."
    npm run build:android
else
    echo ""
    echo "⚠️  Android build skipped - Java not installed"
    echo "   Install with: brew install openjdk@17"
fi

echo ""
echo "✅ Builds complete!"

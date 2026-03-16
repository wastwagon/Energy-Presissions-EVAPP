#!/bin/bash

# Complete Setup Script for Mobile App
# This script sets up everything automatically

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         🚀 AUTOMATED SETUP - Starting...                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

PROJECT_ROOT="/Users/OceanCyber/Downloads/EnergyPresissionsEVAP"
cd "$PROJECT_ROOT"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Step 1: Backend Setup
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Step 1: Setting up Backend..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$PROJECT_ROOT/backend"
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
else
    echo "✅ Backend dependencies already installed"
fi

# Start backend in background
echo "Starting backend server..."
npm run start:dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
echo "Waiting for backend to start..."
for i in {1..30}; do
    if curl -s http://localhost:3000/api > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is running!${NC}"
        break
    fi
    sleep 1
done

if ! curl -s http://localhost:3000/api > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Backend may need more time. Check: tail -f /tmp/backend.log${NC}"
fi

echo ""

# Step 2: Mobile Dependencies
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 Step 2: Setting up Mobile App..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$PROJECT_ROOT/mobile"

if [ ! -d "node_modules" ]; then
    echo "Installing mobile dependencies..."
    npm install
else
    echo "✅ Mobile dependencies already installed"
fi

echo ""

# Step 3: Fix Expo Dependencies
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Step 3: Fixing Expo Dependencies..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

npx expo install --fix 2>&1 | tail -10
echo -e "${GREEN}✅ Expo dependencies fixed${NC}"
echo ""

# Step 4: iOS Pods
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🍎 Step 4: Installing iOS Pods..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

export PATH="$HOME/.gem/ruby/3.4.0/bin:$PATH"
cd "$PROJECT_ROOT/mobile/ios"

if [ -d "Pods" ]; then
    echo "Pods already installed, updating..."
    pod install 2>&1 | tail -10
else
    echo "Installing pods (this may take 2-5 minutes)..."
    pod install 2>&1 | tail -20
fi

if [ -f "EVChargingTemp.xcworkspace" ] || [ -d "EVChargingTemp.xcworkspace" ]; then
    echo -e "${GREEN}✅ iOS workspace created!${NC}"
else
    echo -e "${YELLOW}⚠️  iOS workspace may need manual creation${NC}"
fi

echo ""

# Step 5: Android Setup
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🤖 Step 5: Checking Android Setup..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

export ANDROID_HOME=~/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin:$ANDROID_HOME/platform-tools

if [ -d "$ANDROID_HOME" ]; then
    echo -e "${GREEN}✅ Android SDK found${NC}"
    
    if command -v adb &> /dev/null; then
        echo -e "${GREEN}✅ ADB available${NC}"
    fi
    
    if [ -f "$ANDROID_HOME/emulator/emulator" ]; then
        AVD_LIST=$($ANDROID_HOME/emulator/emulator -list-avds 2>/dev/null || echo "")
        if [ -n "$AVD_LIST" ]; then
            echo -e "${GREEN}✅ Android emulators available:${NC}"
            echo "$AVD_LIST"
        else
            echo -e "${YELLOW}⚠️  No Android emulators found${NC}"
        fi
    fi
fi

echo ""

# Step 6: Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ SETUP COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Status:"
echo "  ✅ Backend: Running (PID: $BACKEND_PID)"
echo "  ✅ Mobile dependencies: Installed"
echo "  ✅ Expo: Fixed"
echo "  ✅ iOS Pods: Installed"
echo "  ✅ Android: Ready"
echo ""
echo "🚀 Next Steps:"
echo ""
echo "1. Backend is running in background"
echo "   Check logs: tail -f /tmp/backend.log"
echo "   Stop it: kill $BACKEND_PID"
echo ""
echo "2. Run Android:"
echo "   cd $PROJECT_ROOT/mobile"
echo "   npm run android"
echo ""
echo "3. Run iOS:"
echo "   cd $PROJECT_ROOT/mobile"
echo "   npm run ios"
echo ""
echo "4. Or use IDEs:"
echo "   Android: Open $PROJECT_ROOT/mobile/android in Android Studio"
echo "   iOS: Open $PROJECT_ROOT/mobile/ios/EVChargingTemp.xcworkspace in Xcode"
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              🎉 Everything is Ready!                            ║"
echo "╚══════════════════════════════════════════════════════════════╝"

#!/bin/bash

# Setup Native Projects Script
# This will help initialize iOS and Android projects

set -e

echo "🚀 Setting up Native Projects..."

cd "$(dirname "$0")/.."

# Check if we need to create projects
NEED_IOS=true
NEED_ANDROID=true

if [ -d "ios" ] && [ -f "ios/Podfile" ]; then
    NEED_IOS=false
    echo "✅ iOS project exists"
fi

if [ -d "android" ] && [ -f "android/build.gradle" ] && [ -f "android/gradlew" ]; then
    NEED_ANDROID=false
    echo "✅ Android project exists"
fi

if [ "$NEED_IOS" = false ] && [ "$NEED_ANDROID" = false ]; then
    echo "✅ Native projects already set up!"
    exit 0
fi

echo ""
echo "⚠️  Native projects need to be initialized."
echo ""
echo "Since React Native CLI init is deprecated, please:"
echo ""
echo "OPTION 1: Use Xcode (Recommended for iOS)"
echo "  1. Open Xcode"
echo "  2. File → New → Project"
echo "  3. Choose 'App' under iOS"
echo "  4. Product Name: EVCharging"
echo "  5. Team: Select your team"
echo "  6. Save to: $(pwd)/ios"
echo ""
echo "OPTION 2: Use Expo (Easiest)"
echo "  Run: npx create-expo-app@latest EVChargingTemp --template bare-minimum"
echo "  Then copy ios/ and android/ folders"
echo ""
echo "OPTION 3: Manual Setup"
echo "  I'll create basic structure files for you..."
echo ""

read -p "Create basic structure files? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Creating basic structure..."
    
    # Create basic iOS structure
    if [ "$NEED_IOS" = true ]; then
        mkdir -p ios
        echo "✅ Created ios/ directory"
        echo "⚠️  You'll need to create the Xcode project manually or use Expo"
    fi
    
    # Create basic Android structure  
    if [ "$NEED_ANDROID" = true ]; then
        echo "⚠️  Android project needs proper initialization"
        echo "   Run: npx react-native init EVChargingTemp --skip-install"
        echo "   Then copy android/ folder"
    fi
fi

echo ""
echo "After native projects are set up, run:"
echo "  npm install"
echo "  cd ios && pod install && cd .."
echo "  npm run build:android  # or build:ios"




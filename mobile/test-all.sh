#!/bin/bash

# Comprehensive Mobile App Testing Script
# Tests iOS, Android, Unit Tests, and Code Quality

set -e  # Exit on error

echo "🧪 Mobile App Comprehensive Testing"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track results
TESTS_PASSED=0
TESTS_FAILED=0
WARNINGS=0

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ $2${NC}"
        ((TESTS_FAILED++))
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Change to mobile directory
cd "$(dirname "$0")"
MOBILE_DIR=$(pwd)

echo "📱 Testing Environment Setup"
echo "----------------------------"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status 0 "Node.js installed: $NODE_VERSION"
else
    print_status 1 "Node.js not found"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_status 0 "npm installed: $NPM_VERSION"
else
    print_status 1 "npm not found"
    exit 1
fi

# Check dependencies
if [ -d "node_modules" ]; then
    print_status 0 "Dependencies installed"
else
    print_warning "Dependencies not installed, running npm install..."
    npm install
fi

echo ""
echo "🔍 Platform Availability Check"
echo "-------------------------------"

# Check iOS
if command -v xcodebuild &> /dev/null; then
    XCODE_VERSION=$(xcodebuild -version | head -1)
    print_status 0 "Xcode available: $XCODE_VERSION"
    
    # Check iOS simulators
    SIMULATORS=$(xcrun simctl list devices available | grep -i "iphone" | wc -l | tr -d ' ')
    if [ "$SIMULATORS" -gt 0 ]; then
        print_status 0 "iOS Simulators available: $SIMULATORS devices"
        xcrun simctl list devices available | grep -i "iphone" | head -3 | while read line; do
            print_info "  - $line"
        done
    else
        print_warning "No iOS simulators found"
    fi
else
    print_warning "Xcode not found - iOS testing skipped"
fi

# Check Android
export ANDROID_HOME=~/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin:$ANDROID_HOME/platform-tools

if [ -d "$ANDROID_HOME" ]; then
    print_status 0 "Android SDK found: $ANDROID_HOME"
    
    if command -v adb &> /dev/null; then
        ADB_VERSION=$(adb version | head -1)
        print_status 0 "ADB available: $ADB_VERSION"
        
        # Check Android emulators
        if [ -f "$ANDROID_HOME/emulator/emulator" ]; then
            AVD_LIST=$($ANDROID_HOME/emulator/emulator -list-avds 2>/dev/null || echo "")
            if [ -n "$AVD_LIST" ]; then
                AVD_COUNT=$(echo "$AVD_LIST" | wc -l | tr -d ' ')
                print_status 0 "Android Emulators available: $AVD_COUNT AVDs"
                echo "$AVD_LIST" | while read avd; do
                    print_info "  - $avd"
                done
            else
                print_warning "No Android emulators found"
            fi
        fi
    else
        print_warning "ADB not found in PATH"
    fi
else
    print_warning "Android SDK not found - Android testing skipped"
fi

# Check CocoaPods (for iOS)
if command -v pod &> /dev/null; then
    POD_VERSION=$(pod --version)
    print_status 0 "CocoaPods installed: $POD_VERSION"
else
    print_warning "CocoaPods not found - iOS build may fail"
fi

echo ""
echo "📦 Code Quality Checks"
echo "----------------------"

# TypeScript check
if [ -f "tsconfig.json" ]; then
    print_info "Running TypeScript type check..."
    if npx tsc --noEmit 2>&1 | tee /tmp/tsc-output.log; then
        print_status 0 "TypeScript: No type errors"
    else
        ERROR_COUNT=$(grep -c "error TS" /tmp/tsc-output.log 2>/dev/null || echo "0")
        if [ "$ERROR_COUNT" -gt 0 ]; then
            print_status 1 "TypeScript: $ERROR_COUNT type errors found"
            grep "error TS" /tmp/tsc-output.log | head -5
        else
            print_status 0 "TypeScript: Check completed"
        fi
    fi
fi

echo ""
echo "🧪 Unit Tests"
echo "-------------"

# Run Jest tests
print_info "Running unit tests..."
if npm test -- --passWithNoTests --silent 2>&1 | tee /tmp/jest-output.log; then
    print_status 0 "Unit tests passed"
    
    # Extract test results
    if grep -q "Tests:" /tmp/jest-output.log; then
        grep "Tests:" /tmp/jest-output.log
    fi
else
    print_status 1 "Unit tests failed"
    grep -A 5 "FAIL\|●" /tmp/jest-output.log | head -20
fi

echo ""
echo "📱 Build Checks"
echo "---------------"

# Check iOS build configuration
if [ -d "ios" ]; then
    print_info "Checking iOS configuration..."
    
    # Check Podfile
    if [ -f "ios/Podfile" ]; then
        print_status 0 "iOS Podfile exists"
        
        # Check if pods are installed
        if [ -d "ios/Pods" ]; then
            print_status 0 "iOS Pods installed"
        else
            print_warning "iOS Pods not installed - run: cd ios && pod install"
        fi
    fi
    
    # Check app.json for iOS config
    if grep -q "ios" app.json 2>/dev/null; then
        print_status 0 "iOS config in app.json"
    fi
fi

# Check Android build configuration
if [ -d "android" ]; then
    print_info "Checking Android configuration..."
    
    # Check build.gradle
    if [ -f "android/app/build.gradle" ]; then
        print_status 0 "Android build.gradle exists"
    fi
    
    # Check AndroidManifest
    if [ -f "android/app/src/main/AndroidManifest.xml" ]; then
        print_status 0 "AndroidManifest.xml exists"
        
        # Check for Google Maps API key
        if grep -q "AIzaSy" android/app/src/main/AndroidManifest.xml 2>/dev/null; then
            print_status 0 "Google Maps API key configured"
        else
            print_warning "Google Maps API key not found in AndroidManifest"
        fi
    fi
fi

echo ""
echo "🔗 API Configuration Check"
echo "--------------------------"

# Check API config
if [ -f "src/config/api.config.ts" ]; then
    print_status 0 "API config file exists"
    
    # Check if API URL is configured
    if grep -q "192.168\|localhost\|your-api-domain" src/config/api.config.ts; then
        print_warning "API URL may need to be updated for your environment"
        grep "DEV_API_URL\|PROD_API_URL" src/config/api.config.ts | head -2
    fi
fi

echo ""
echo "📊 File Structure Check"
echo "-----------------------"

# Check critical files
CRITICAL_FILES=(
    "src/App.tsx"
    "src/navigation/AppNavigator.tsx"
    "src/navigation/MainNavigator.tsx"
    "src/store/store.ts"
    "package.json"
    "app.json"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_status 0 "Found: $file"
    else
        print_status 1 "Missing: $file"
    fi
done

echo ""
echo "🎯 Summary"
echo "=========="
echo -e "${GREEN}✅ Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Failed: $TESTS_FAILED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All critical checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run: npm run ios (for iOS testing)"
    echo "2. Run: npm run android (for Android testing)"
    exit 0
else
    echo -e "${RED}⚠️  Some checks failed. Please review above.${NC}"
    exit 1
fi

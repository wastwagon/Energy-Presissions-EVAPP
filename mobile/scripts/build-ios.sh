#!/bin/bash

# iOS Build Script for TestFlight/Ad-Hoc Distribution
# This creates an IPA file that can be installed on iOS devices

set -e

echo "🚀 Building iOS App..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "ios" ]; then
    echo -e "${RED}❌ Error: ios directory not found. Please run this from the mobile directory.${NC}"
    exit 1
fi

cd ios

# Check if Pods are installed
if [ ! -d "Pods" ]; then
    echo -e "${YELLOW}⚠️  Pods not found. Installing CocoaPods dependencies...${NC}"
    pod install
fi

# Build configuration
SCHEME="EVCharging"
CONFIGURATION="Release"
WORKSPACE="EVCharging.xcworkspace"
ARCHIVE_PATH="./build/EVCharging.xcarchive"
EXPORT_PATH="./build/export"
EXPORT_OPTIONS_PLIST="./ExportOptions.plist"

# Create ExportOptions.plist if it doesn't exist
if [ ! -f "$EXPORT_OPTIONS_PLIST" ]; then
    echo -e "${YELLOW}⚠️  Creating ExportOptions.plist for ad-hoc distribution...${NC}"
    cat > "$EXPORT_OPTIONS_PLIST" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>ad-hoc</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
    <key>compileBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
</dict>
</plist>
EOF
    echo -e "${YELLOW}⚠️  Please update YOUR_TEAM_ID in ExportOptions.plist${NC}"
fi

# Clean build folder
echo -e "${GREEN}🧹 Cleaning build folder...${NC}"
rm -rf build
mkdir -p build

# Archive the app
echo -e "${GREEN}📦 Creating archive...${NC}"
xcodebuild archive \
    -workspace "$WORKSPACE" \
    -scheme "$SCHEME" \
    -configuration "$CONFIGURATION" \
    -archivePath "$ARCHIVE_PATH" \
    -allowProvisioningUpdates \
    CODE_SIGN_IDENTITY="iPhone Developer" \
    DEVELOPMENT_TEAM="" \
    || {
        echo -e "${RED}❌ Archive failed. Make sure you have:${NC}"
        echo -e "${RED}   1. Xcode installed${NC}"
        echo -e "${RED}   2. Valid signing certificate${NC}"
        echo -e "${RED}   3. Updated ExportOptions.plist with your Team ID${NC}"
        exit 1
    }

# Export IPA
echo -e "${GREEN}📤 Exporting IPA...${NC}"
xcodebuild -exportArchive \
    -archivePath "$ARCHIVE_PATH" \
    -exportPath "$EXPORT_PATH" \
    -exportOptionsPlist "$EXPORT_OPTIONS_PLIST" \
    -allowProvisioningUpdates \
    || {
        echo -e "${RED}❌ Export failed. Check your ExportOptions.plist and signing settings.${NC}"
        exit 1
    }

# Find the IPA file
IPA_FILE=$(find "$EXPORT_PATH" -name "*.ipa" | head -1)

if [ -f "$IPA_FILE" ]; then
    echo -e "${GREEN}✅ Build successful!${NC}"
    echo -e "${GREEN}📱 IPA file: $IPA_FILE${NC}"
    echo -e "${YELLOW}📝 To install on your device:${NC}"
    echo -e "${YELLOW}   1. Open Xcode → Window → Devices and Simulators${NC}"
    echo -e "${YELLOW}   2. Select your device${NC}"
    echo -e "${YELLOW}   3. Drag and drop the IPA file${NC}"
    echo -e "${YELLOW}   OR use: xcrun altool --upload-app -f $IPA_FILE -u YOUR_APPLE_ID -p YOUR_PASSWORD${NC}"
else
    echo -e "${RED}❌ IPA file not found${NC}"
    exit 1
fi

cd ..




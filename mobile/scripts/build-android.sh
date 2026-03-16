#!/bin/bash

# Android Build Script for APK/AAB Distribution
# This creates APK (for direct install) and AAB (for Play Store) files

set -e

echo "🚀 Building Android App..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "android" ]; then
    echo -e "${RED}❌ Error: android directory not found. Please run this from the mobile directory.${NC}"
    exit 1
fi

cd android

# Check if keystore exists
KEYSTORE_FILE="app/ev-charging-release.keystore"
KEYSTORE_PROPERTIES="keystore.properties"

if [ ! -f "$KEYSTORE_FILE" ]; then
    echo -e "${YELLOW}⚠️  Keystore not found. Creating one...${NC}"
    echo -e "${YELLOW}⚠️  You'll need to enter information for the keystore.${NC}"
    
    keytool -genkeypair -v -storetype PKCS12 \
        -keystore "$KEYSTORE_FILE" \
        -alias ev-charging-key \
        -keyalg RSA -keysize 2048 -validity 10000 \
        -storepass evcharging123 \
        -keypass evcharging123 \
        -dname "CN=EV Charging, OU=Mobile, O=EV Charging, L=Accra, ST=Greater Accra, C=GH" \
        || {
            echo -e "${RED}❌ Keystore creation failed. Please create it manually.${NC}"
            exit 1
        }
    
    echo -e "${GREEN}✅ Keystore created${NC}"
fi

# Create keystore.properties if it doesn't exist
if [ ! -f "$KEYSTORE_PROPERTIES" ]; then
    echo -e "${YELLOW}⚠️  Creating keystore.properties...${NC}"
    cat > "$KEYSTORE_PROPERTIES" << EOF
storePassword=evcharging123
keyPassword=evcharging123
keyAlias=ev-charging-key
storeFile=ev-charging-release.keystore
EOF
    echo -e "${YELLOW}⚠️  Using default passwords. Change them in keystore.properties for production!${NC}"
fi

# Update app/build.gradle to use keystore
GRADLE_FILE="app/build.gradle"
if ! grep -q "signingConfigs" "$GRADLE_FILE"; then
    echo -e "${YELLOW}⚠️  Updating build.gradle with signing config...${NC}"
    # This is a simplified approach - you may need to manually edit build.gradle
    echo -e "${YELLOW}⚠️  Please manually add signing config to app/build.gradle${NC}"
fi

# Clean previous builds
echo -e "${GREEN}🧹 Cleaning previous builds...${NC}"
./gradlew clean

# Build APK (for direct installation)
echo -e "${GREEN}📦 Building APK (for direct installation)...${NC}"
./gradlew assembleRelease || {
    echo -e "${RED}❌ APK build failed. Check the error messages above.${NC}"
    exit 1
}

# Build AAB (for Play Store)
echo -e "${GREEN}📦 Building AAB (for Play Store)...${NC}"
./gradlew bundleRelease || {
    echo -e "${YELLOW}⚠️  AAB build failed, but APK should be available${NC}"
}

# Find the APK file
APK_FILE=$(find app/build/outputs/apk/release -name "*.apk" | head -1)
AAB_FILE=$(find app/build/outputs/bundle/release -name "*.aab" | head -1)

if [ -f "$APK_FILE" ]; then
    echo -e "${GREEN}✅ APK build successful!${NC}"
    echo -e "${GREEN}📱 APK file: $APK_FILE${NC}"
    echo -e "${YELLOW}📝 To install on your Android device:${NC}"
    echo -e "${YELLOW}   1. Enable 'Install from Unknown Sources' in Settings${NC}"
    echo -e "${YELLOW}   2. Transfer APK to your device${NC}"
    echo -e "${YELLOW}   3. Open the APK file and install${NC}"
    echo -e "${YELLOW}   OR use: adb install $APK_FILE${NC}"
    
    # Copy APK to root for easy access
    cp "$APK_FILE" "../EVCharging-release.apk"
    echo -e "${GREEN}📋 APK also copied to: mobile/EVCharging-release.apk${NC}"
else
    echo -e "${RED}❌ APK file not found${NC}"
    exit 1
fi

if [ -f "$AAB_FILE" ]; then
    echo -e "${GREEN}✅ AAB build successful!${NC}"
    echo -e "${GREEN}📦 AAB file: $AAB_FILE${NC}"
    echo -e "${YELLOW}📝 Upload this AAB to Google Play Console for Play Store distribution${NC}"
    
    # Copy AAB to root for easy access
    cp "$AAB_FILE" "../EVCharging-release.aab"
    echo -e "${GREEN}📋 AAB also copied to: mobile/EVCharging-release.aab${NC}"
fi

cd ..




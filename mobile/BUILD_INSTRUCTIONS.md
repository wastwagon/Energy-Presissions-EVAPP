# Build Instructions for iOS and Android

This guide will help you create installable builds for testing on your devices before submitting to app stores.

## 📋 Prerequisites

### For iOS:
- macOS computer
- Xcode installed (latest version)
- Apple Developer Account (free account works for ad-hoc builds)
- iOS device for testing

### For Android:
- macOS, Linux, or Windows computer
- Android Studio installed
- Android device for testing (or emulator)

## 🔧 Initial Setup

### 1. Configure API Endpoints

**Update `src/config/api.config.ts`:**

```typescript
const API_CONFIG = {
  // For device testing, use your computer's IP address
  DEV_API_URL: 'http://YOUR_IP:3000/api',  // e.g., 'http://192.168.1.100:3000/api'
  DEV_WS_URL: 'http://YOUR_IP:8080',       // e.g., 'http://192.168.1.100:8080'
  
  // Production URLs (update when deploying)
  PROD_API_URL: 'https://your-api-domain.com/api',
  PROD_WS_URL: 'https://your-api-domain.com',
};
```

**To find your IP address:**
- macOS/Linux: `ifconfig | grep "inet " | grep -v 127.0.0.1`
- Windows: `ipconfig`

### 2. Install Dependencies

```bash
cd mobile
npm install
cd ios && pod install && cd ..
```

## 📱 Building for Android

### Quick Build (APK for Direct Installation)

```bash
cd mobile
npm run build:android
```

This will create:
- `EVCharging-release.apk` in the `mobile` directory
- APK file in `android/app/build/outputs/apk/release/`

### Installing APK on Android Device

**Option 1: Using ADB (Recommended)**
```bash
# Connect device via USB
adb devices  # Verify device is connected
adb install EVCharging-release.apk
```

**Option 2: Manual Installation**
1. Transfer `EVCharging-release.apk` to your Android device
2. On device: Settings → Security → Enable "Install from Unknown Sources"
3. Open the APK file and tap "Install"

### Building AAB for Play Store

The build script also creates an AAB (Android App Bundle) file:
- `EVCharging-release.aab` in the `mobile` directory
- Upload this to Google Play Console for Play Store distribution

## 🍎 Building for iOS

### Prerequisites

1. **Update ExportOptions.plist:**
   ```bash
   cd mobile/ios
   ```
   
   Edit `ExportOptions.plist` and replace `YOUR_TEAM_ID` with your Apple Developer Team ID.
   
   To find your Team ID:
   - Xcode → Preferences → Accounts → Select your Apple ID → Team ID

2. **Configure Signing:**
   - Open `ios/EVCharging.xcworkspace` in Xcode
   - Select the project → Signing & Capabilities
   - Select your Team
   - Ensure "Automatically manage signing" is checked

### Build IPA for Ad-Hoc Distribution

```bash
cd mobile
npm run build:ios
```

This will create:
- IPA file in `ios/build/export/`
- The script will show the exact path

### Installing IPA on iOS Device

**Option 1: Using Xcode**
1. Connect your iPhone via USB
2. Open Xcode → Window → Devices and Simulators
3. Select your device
4. Drag and drop the IPA file into the "Installed Apps" section

**Option 2: Using Apple Configurator 2**
1. Install Apple Configurator 2 from Mac App Store
2. Connect your iPhone
3. Add the IPA file

**Option 3: Using TestFlight (Recommended for Testing)**
1. Upload IPA to App Store Connect
2. Add testers in TestFlight
3. Testers receive email invitation

### Building for App Store

For App Store submission, use Xcode:
1. Open `ios/EVCharging.xcworkspace`
2. Product → Archive
3. Distribute App → App Store Connect
4. Follow the submission wizard

## 🚀 Quick Build Commands

```bash
# Build Android APK
npm run build:android

# Build iOS IPA
npm run build:ios

# Build both (if on macOS)
npm run build:all
```

## 📦 Build Output Locations

### Android:
- **APK:** `mobile/EVCharging-release.apk`
- **AAB:** `mobile/EVCharging-release.aab`
- **Detailed:** `android/app/build/outputs/apk/release/` and `android/app/build/outputs/bundle/release/`

### iOS:
- **IPA:** `ios/build/export/EVCharging.ipa`
- **Archive:** `ios/build/EVCharging.xcarchive`

## 🔐 Security Notes

### Android Keystore

The build script creates a default keystore with these credentials:
- **Password:** `evcharging123`
- **Alias:** `ev-charging-key`

**⚠️ IMPORTANT:** For production, change these credentials:
1. Generate a new keystore with a strong password
2. Update `android/keystore.properties`
3. Keep the keystore file secure (it's needed for updates)

### iOS Signing

- Use your Apple Developer account for signing
- For production, use App Store distribution profile
- Keep your certificates and provisioning profiles secure

## 🐛 Troubleshooting

### Android Build Issues

**Error: "SDK location not found"**
```bash
# Create local.properties in android/
echo "sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk" > android/local.properties
```

**Error: "Keystore not found"**
- The script will create one automatically
- Or create manually: `keytool -genkeypair -v -keystore android/app/ev-charging-release.keystore ...`

**Error: "Gradle build failed"**
```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

### iOS Build Issues

**Error: "No signing certificate"**
- Open Xcode → Preferences → Accounts
- Add your Apple ID
- Select your team in project settings

**Error: "Provisioning profile not found"**
- Xcode → Preferences → Accounts → Download Manual Profiles
- Or enable "Automatically manage signing"

**Error: "Archive failed"**
- Clean build folder: `rm -rf ios/build`
- Clean derived data in Xcode: Product → Clean Build Folder

## 📱 Testing the Builds

### Before Installing:

1. **Verify API Configuration:**
   - Check `src/config/api.config.ts`
   - Ensure URLs are correct for your environment

2. **Test on Simulator/Emulator First:**
   ```bash
   npm run ios      # iOS simulator
   npm run android  # Android emulator
   ```

3. **Check App Version:**
   - Update version in `app.json`:
     ```json
     {
       "version": "1.0.0",
       "ios": { "buildNumber": "1" },
       "android": { "versionCode": 1 }
     }
     ```

### After Installing:

1. **Test Authentication:**
   - Login/Register
   - Token persistence

2. **Test Core Features:**
   - Station discovery
   - Wallet balance
   - Charging sessions

3. **Test Real-time Updates:**
   - WebSocket connection
   - Live balance updates

## 📝 Version Management

Update version numbers before each build:

**`app.json`:**
```json
{
  "version": "1.0.1",  // User-facing version
  "ios": {
    "buildNumber": "2"  // Build number (increment for each build)
  },
  "android": {
    "versionCode": 2    // Version code (increment for each build)
  }
}
```

## 🎯 Next Steps After Testing

1. **Fix any bugs** found during testing
2. **Update version numbers** for next build
3. **Prepare app store assets:**
   - App icons (1024x1024)
   - Screenshots (various sizes)
   - App description
   - Privacy policy URL
4. **Submit to app stores:**
   - iOS: App Store Connect
   - Android: Google Play Console

## 📞 Need Help?

- Check React Native docs: https://reactnative.dev/docs/signed-apk-android
- iOS Distribution: https://developer.apple.com/documentation/xcode/distributing-your-app-for-beta-testing-and-releases
- Android Distribution: https://developer.android.com/studio/publish

---

**Ready to build?** Run `npm run build:android` or `npm run build:ios` to get started!




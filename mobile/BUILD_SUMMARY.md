# 🎉 Build System Complete - Ready for Testing!

## ✅ What's Been Set Up

### 1. **API Configuration System**
- ✅ Centralized API config in `src/config/api.config.ts`
- ✅ Easy to update URLs for different environments
- ✅ WebSocket configuration included

### 2. **Build Scripts Created**
- ✅ **Android:** `scripts/build-android.sh` - Creates APK and AAB files
- ✅ **iOS:** `scripts/build-ios.sh` - Creates IPA file
- ✅ **Both:** `scripts/build-all.sh` - Builds for both platforms

### 3. **NPM Scripts Added**
```bash
npm run build:android  # Build Android APK/AAB
npm run build:ios      # Build iOS IPA
npm run build:all      # Build both (if on macOS)
```

### 4. **Documentation Created**
- ✅ `BUILD_INSTRUCTIONS.md` - Detailed build guide
- ✅ `INSTALLATION_GUIDE.md` - How to install on devices
- ✅ `QUICK_START.md` - Fast track guide
- ✅ `NEXT_STEPS.md` - Development roadmap

## 🚀 Next Steps to Get Your Test Builds

### Step 1: Initialize Native Projects (REQUIRED)

The app structure is ready, but you need iOS/Android native folders:

```bash
cd mobile

# Initialize React Native project (creates ios/android folders)
npx react-native init EVCharging --template react-native-template-typescript --skip-install

# Copy ios and android folders to your mobile directory
# Then merge package.json dependencies
```

**OR** if you already have a React Native project, just ensure `ios/` and `android/` folders exist.

### Step 2: Configure API Endpoints

Edit `src/config/api.config.ts`:

```typescript
const API_CONFIG = {
  // Replace with your computer's IP address for device testing
  DEV_API_URL: 'http://192.168.1.XXX:3000/api',  // Your IP here
  DEV_WS_URL: 'http://192.168.1.XXX:8080',        // Your IP here
  
  PROD_API_URL: 'https://your-api-domain.com/api',
  PROD_WS_URL: 'https://your-api-domain.com',
};
```

**Find your IP:**
- macOS/Linux: `ifconfig | grep "inet " | grep -v 127.0.0.1`
- Windows: `ipconfig`

### Step 3: Install Dependencies

```bash
cd mobile
npm install
cd ios && pod install && cd ..
```

### Step 4: Build for Your Platform

#### Android (Easiest - Works on any OS):

```bash
npm run build:android
```

**Output:**
- `EVCharging-release.apk` - Install directly on Android device
- `EVCharging-release.aab` - For Play Store upload

**Install on Android:**
1. Transfer APK to device
2. Enable "Install from Unknown Sources"
3. Open APK and install

#### iOS (Requires macOS + Xcode):

```bash
# First, update ios/ExportOptions.plist with your Team ID
# Then build:
npm run build:ios
```

**Output:**
- `ios/build/export/EVCharging.ipa` - Install via Xcode

**Install on iOS:**
1. Connect iPhone via USB
2. Xcode → Window → Devices
3. Drag IPA into device

## 📱 Quick Test Build Commands

```bash
# 1. Configure API (edit src/config/api.config.ts)

# 2. Install dependencies
cd mobile && npm install && cd ios && pod install && cd ..

# 3. Build Android
npm run build:android

# 4. Build iOS (macOS only)
npm run build:ios
```

## 📦 Build Output Locations

### Android:
- **APK:** `mobile/EVCharging-release.apk`
- **AAB:** `mobile/EVCharging-release.aab`
- **Detailed:** `android/app/build/outputs/apk/release/`

### iOS:
- **IPA:** `ios/build/export/EVCharging.ipa`
- **Archive:** `ios/build/EVCharging.xcarchive`

## 🔧 Before Building - Checklist

- [ ] Native projects initialized (ios/ and android/ folders exist)
- [ ] Dependencies installed (`npm install` and `pod install`)
- [ ] API URLs configured in `src/config/api.config.ts`
- [ ] Backend server running and accessible
- [ ] WebSocket server running
- [ ] iOS: Xcode installed and configured (for iOS builds)
- [ ] iOS: Apple Developer account set up (for iOS builds)
- [ ] Android: Android Studio installed (for Android builds)

## 🎯 Testing Your Builds

After installing on your device:

1. **Test Authentication:**
   - Login/Register
   - Verify token persistence

2. **Test Core Features:**
   - Station discovery (needs location permission)
   - Wallet balance display
   - Top-up functionality
   - Charging session start/stop

3. **Test Real-time:**
   - WebSocket connection
   - Live balance updates
   - Transaction updates

## 📝 Important Notes

### Android Keystore:
- Default password: `evcharging123`
- **Change this for production!**
- Keystore file: `android/app/ev-charging-release.keystore`
- Keep this file secure - needed for app updates

### iOS Signing:
- Requires Apple Developer account
- Update Team ID in `ios/ExportOptions.plist`
- Configure signing in Xcode

### Version Management:
Update version in `app.json` before each build:
```json
{
  "version": "1.0.1",
  "ios": { "buildNumber": "2" },
  "android": { "versionCode": 2 }
}
```

## 🐛 Common Issues & Solutions

### "ios/ or android/ folder not found"
→ Initialize native projects first (Step 1)

### "Build failed - signing error"
→ Configure signing certificates in Xcode (iOS) or keystore (Android)

### "API calls not working"
→ Check API URLs in `src/config/api.config.ts` and ensure backend is running

### "WebSocket connection failed"
→ Verify WebSocket URL and ensure server is accessible from device

## 📚 Documentation Files

- **BUILD_INSTRUCTIONS.md** - Complete build guide
- **INSTALLATION_GUIDE.md** - Device installation steps
- **QUICK_START.md** - Fast track guide
- **NEXT_STEPS.md** - Development roadmap
- **README.md** - Project overview

## 🎉 You're Ready!

Everything is set up for building test versions. Follow the steps above to:

1. ✅ Initialize native projects
2. ✅ Configure API endpoints
3. ✅ Build APK/IPA
4. ✅ Install on your devices
5. ✅ Test before app store submission

**Need help?** Check the detailed guides in the documentation files!

---

**Status:** ✅ Build system ready | ⏳ Waiting for native project initialization




# Quick Start Guide - Get Your Test Builds Ready

## 🚀 Fast Track to Building

### Step 1: Configure API (2 minutes)

Edit `src/config/api.config.ts`:
```typescript
DEV_API_URL: 'http://YOUR_COMPUTER_IP:3000/api',
DEV_WS_URL: 'http://YOUR_COMPUTER_IP:8080',
```

Find your IP:
- macOS/Linux: `ifconfig | grep "inet " | grep -v 127.0.0.1`
- Windows: `ipconfig`

### Step 2: Install Dependencies (5 minutes)

```bash
cd mobile
npm install
cd ios && pod install && cd ..
```

### Step 3: Build for Your Platform

**Android:**
```bash
npm run build:android
```
Get: `EVCharging-release.apk` → Install on Android device

**iOS:**
```bash
npm run build:ios
```
Get: `ios/build/export/EVCharging.ipa` → Install via Xcode

## 📱 Install on Device

### Android:
1. Transfer APK to device
2. Enable "Install from Unknown Sources"
3. Open APK and install

### iOS:
1. Connect iPhone via USB
2. Xcode → Window → Devices
3. Drag IPA into device

## ✅ Done!

Your test build is ready. See `INSTALLATION_GUIDE.md` for detailed instructions.




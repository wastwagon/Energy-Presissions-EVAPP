# Installation Guide - Testing Builds on Your Devices

This guide will help you install the test builds on your iOS and Android devices.

## 📱 Android Installation

### Method 1: Direct APK Installation (Easiest)

1. **Build the APK:**
   ```bash
   cd mobile
   npm run build:android
   ```

2. **Transfer APK to your device:**
   - Email the APK to yourself
   - Use Google Drive/Dropbox
   - Use USB file transfer
   - Use ADB: `adb install EVCharging-release.apk`

3. **Enable Unknown Sources:**
   - Go to Settings → Security
   - Enable "Install from Unknown Sources" or "Install Unknown Apps"
   - Select the app you'll use to install (Email, Files, etc.)

4. **Install:**
   - Open the APK file
   - Tap "Install"
   - Wait for installation to complete
   - Tap "Open" to launch the app

### Method 2: Using ADB (For Developers)

```bash
# Connect device via USB
adb devices  # Verify device is listed

# Install APK
adb install EVCharging-release.apk

# If app is already installed, use:
adb install -r EVCharging-release.apk
```

### Method 3: Wireless ADB

```bash
# On device: Settings → Developer Options → Wireless debugging → Pair device
# Then connect wirelessly
adb connect DEVICE_IP:PORT
adb install EVCharging-release.apk
```

## 🍎 iOS Installation

### Method 1: Using Xcode (Easiest for Testing)

1. **Build the IPA:**
   ```bash
   cd mobile
   npm run build:ios
   ```

2. **Connect your iPhone via USB**

3. **Open Xcode:**
   - Xcode → Window → Devices and Simulators
   - Select your iPhone from the list

4. **Install:**
   - Drag and drop the IPA file into the "Installed Apps" section
   - Or click the "+" button and select the IPA file

5. **Trust the Developer:**
   - On iPhone: Settings → General → VPN & Device Management
   - Tap your developer certificate
   - Tap "Trust"

### Method 2: Using Apple Configurator 2

1. **Install Apple Configurator 2** from Mac App Store

2. **Connect iPhone via USB**

3. **Add App:**
   - Select your device
   - Click "Add" → "Apps"
   - Select the IPA file
   - Click "Add"

4. **Trust the Developer** (same as Method 1)

### Method 3: Using TestFlight (Best for Multiple Testers)

1. **Upload to App Store Connect:**
   - Use Xcode → Product → Archive → Distribute App
   - Upload to App Store Connect

2. **Add Testers:**
   - App Store Connect → TestFlight
   - Add internal/external testers
   - Send invitations

3. **Install TestFlight:**
   - Testers install TestFlight from App Store
   - Accept invitation email
   - Install app from TestFlight

### Method 4: Ad-Hoc Distribution (For Limited Devices)

1. **Register Device UDID:**
   - Get UDID: Settings → General → About → UDID
   - Add to Apple Developer Portal → Devices

2. **Create Ad-Hoc Provisioning Profile:**
   - Apple Developer Portal → Certificates, Identifiers & Profiles
   - Create new provisioning profile (Ad-Hoc)
   - Download and install

3. **Build with Ad-Hoc Profile:**
   - Xcode → Select Ad-Hoc profile
   - Archive and export as Ad-Hoc

4. **Distribute:**
   - Share IPA via AirDrop, email, or website
   - Installers need to trust your certificate

## 🔧 Pre-Installation Checklist

### Before Installing:

- [ ] API endpoints configured in `src/config/api.config.ts`
- [ ] Backend server is running and accessible
- [ ] WebSocket server is running
- [ ] Device is connected (for USB installation)
- [ ] Unknown Sources enabled (Android)
- [ ] Developer mode enabled (Android)

### After Installing:

- [ ] App launches without crashes
- [ ] Can login/register
- [ ] API calls work (check network tab)
- [ ] Location permissions requested (for station discovery)
- [ ] WebSocket connects (check console logs)

## 🐛 Troubleshooting Installation

### Android Issues

**"App not installed" error:**
- Uninstall previous version first
- Check if device has enough storage
- Try: `adb install -r EVCharging-release.apk`

**"Parse error" or "Corrupted file":**
- Rebuild the APK
- Check file transfer didn't corrupt it
- Try downloading again

**App crashes on launch:**
- Check API configuration
- Verify backend is running
- Check device logs: `adb logcat | grep ReactNativeJS`

### iOS Issues

**"Untrusted Developer" error:**
- Settings → General → VPN & Device Management
- Trust your developer certificate

**"Unable to install" error:**
- Check device storage
- Verify provisioning profile matches device UDID
- Try reinstalling Xcode certificates

**App crashes on launch:**
- Check device logs in Xcode → Window → Devices
- Verify API configuration
- Check backend connectivity

## 📊 Testing Checklist

After installation, test these features:

### Authentication
- [ ] Login works
- [ ] Registration works
- [ ] Logout works
- [ ] Token persists after app restart

### Station Discovery
- [ ] Location permission requested
- [ ] Nearby stations load
- [ ] Map displays stations
- [ ] Station details accessible

### Wallet
- [ ] Balance displays correctly
- [ ] Top-up works
- [ ] Transaction history loads

### Charging
- [ ] Can start charging session
- [ ] Can stop charging session
- [ ] Active sessions display
- [ ] Real-time updates work

## 🔄 Updating the App

### Android:
```bash
# Rebuild APK
npm run build:android

# Install update
adb install -r EVCharging-release.apk
```

### iOS:
```bash
# Rebuild IPA
npm run build:ios

# Install via Xcode or TestFlight
```

## 📝 Notes

- **Version Numbers:** Increment version in `app.json` before each build
- **API URLs:** Update `src/config/api.config.ts` for different environments
- **Signing:** Keep signing certificates secure
- **Testing:** Test on real devices, not just simulators
- **Backup:** Keep previous builds for rollback if needed

## 🎯 Next Steps

Once testing is complete:
1. Fix any bugs found
2. Update version numbers
3. Prepare app store assets
4. Submit to App Store/Play Store

---

**Need help?** Check the BUILD_INSTRUCTIONS.md for detailed build steps.




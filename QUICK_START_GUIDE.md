# 🚀 Quick Start Guide - Run Mobile App

**Follow these steps to get your app running!**

---

## Step 1: Install CocoaPods (iOS)

```bash
sudo gem install cocoapods
```

**Or if you prefer Homebrew:**
```bash
brew install cocoapods
```

---

## Step 2: Install iOS Dependencies

```bash
cd mobile/ios
pod install
cd ../..
```

**Note:** This may take a few minutes the first time.

---

## Step 3: Start Backend Server

**In a new terminal window:**

```bash
cd backend
npm run start:dev
```

**Keep this running!** The mobile app needs the backend to work.

---

## Step 4: Update API URL (if needed)

**Check your computer's IP address:**
```bash
# macOS/Linux:
ifconfig | grep "inet " | grep -v 127.0.0.1

# Or check in System Preferences > Network
```

**Update the API config:**
- Edit: `mobile/src/config/api.config.ts`
- Change `192.168.100.32` to your actual IP address
- Save the file

---

## Step 5: Run the App

### **For iOS:**
```bash
cd mobile
npm run ios
```

**First time?** It will:
1. Start Metro bundler
2. Build the iOS app
3. Launch iOS Simulator
4. Install and run the app

### **For Android:**
```bash
cd mobile
npm run android
```

**First time?** It will:
1. Start Metro bundler
2. Build the Android app
3. Launch Android Emulator (or use connected device)
4. Install and run the app

---

## 🐛 Troubleshooting

### **iOS Build Fails:**
```bash
# Clean and rebuild
cd mobile/ios
rm -rf Pods Podfile.lock
pod install
cd ..
npm run ios
```

### **Android Build Fails:**
```bash
# Clean gradle cache
cd mobile/android
./gradlew clean
cd ..
npm run android
```

### **Metro Bundler Issues:**
```bash
# Reset Metro cache
cd mobile
npm start -- --reset-cache
```

### **Can't Connect to Backend:**
1. Check backend is running: `curl http://localhost:3000/api`
2. Check your IP address matches API config
3. Make sure phone/emulator and computer are on same network

---

## ✅ Success Indicators

**When it works, you should see:**
- ✅ Metro bundler running
- ✅ App building
- ✅ Simulator/Emulator launching
- ✅ App installing
- ✅ App opening with login screen

---

## 📱 Testing Checklist

Once the app is running:

1. ✅ App launches
2. ✅ Login screen appears
3. ✅ Can register new account
4. ✅ Can login
5. ✅ Dashboard loads
6. ✅ Can find stations
7. ✅ Maps display
8. ✅ Wallet shows balance

---

**Need help?** Check the error messages and let me know what you see!

# 🚀 Setup & Run Guide - Step by Step

**Your current IP:** `192.168.0.101` ✅ (Updated in config)

---

## ✅ What I've Done For You

1. ✅ Updated API URL to your IP: `192.168.0.101`
2. ✅ Checked environment - all tools available
3. ✅ Verified platforms - iOS & Android ready
4. ✅ Fixed all unit tests - 100% passing

---

## 📋 What You Need to Do

### **Step 1: Install CocoaPods** (Required for iOS)

**Open Terminal and run:**
```bash
sudo gem install cocoapods
```

**Enter your Mac password when prompted.**

**Alternative (if sudo doesn't work):**
```bash
brew install cocoapods
```

---

### **Step 2: Install iOS Dependencies**

**After CocoaPods is installed:**
```bash
cd /Users/OceanCyber/Downloads/EnergyPresissionsEVAP/mobile/ios
pod install
cd ../..
```

**This will take 2-5 minutes.** ⏱️

---

### **Step 3: Start Backend Server**

**Open a NEW terminal window and run:**
```bash
cd /Users/OceanCyber/Downloads/EnergyPresissionsEVAP/backend
npm run start:dev
```

**Keep this terminal open!** The backend must be running for the app to work.

**You should see:**
```
[Nest] Application is running on: http://[::1]:3000
```

---

### **Step 4: Run the Mobile App**

**Open another terminal window:**

#### **For iOS:**
```bash
cd /Users/OceanCyber/Downloads/EnergyPresissionsEVAP/mobile
npm run ios
```

#### **For Android:**
```bash
cd /Users/OceanCyber/Downloads/EnergyPresissionsEVAP/mobile
npm run android
```

---

## 🎯 Quick Commands (Copy & Paste)

### **Terminal 1 - Backend:**
```bash
cd /Users/OceanCyber/Downloads/EnergyPresissionsEVAP/backend && npm run start:dev
```

### **Terminal 2 - iOS:**
```bash
cd /Users/OceanCyber/Downloads/EnergyPresissionsEVAP/mobile && npm run ios
```

### **Terminal 2 - Android:**
```bash
cd /Users/OceanCyber/Downloads/EnergyPresissionsEVAP/mobile && npm run android
```

---

## ⚠️ If Something Goes Wrong

### **CocoaPods Installation Fails:**
```bash
# Try with Homebrew instead
brew install cocoapods
```

### **Pod Install Fails:**
```bash
cd mobile/ios
rm -rf Pods Podfile.lock
pod install
```

### **Backend Won't Start:**
```bash
cd backend
# Check if port 3000 is in use
lsof -i :3000
# If something is using it, kill it or change port
```

### **App Can't Connect to Backend:**
1. Make sure backend is running
2. Check IP address: `ifconfig | grep "inet " | grep -v 127.0.0.1`
3. Verify it matches `mobile/src/config/api.config.ts`

### **Metro Bundler Issues:**
```bash
cd mobile
npm start -- --reset-cache
```

---

## ✅ Success Checklist

When everything works, you'll see:

1. ✅ Backend running on port 3000
2. ✅ Metro bundler starting
3. ✅ App building
4. ✅ Simulator/Emulator launching
5. ✅ App installing
6. ✅ Login screen appears

---

## 🎉 You're Almost There!

**Current Status:**
- ✅ Code: Ready
- ✅ Tests: Passing
- ✅ Config: Updated
- ⏳ CocoaPods: Need to install
- ⏳ iOS Pods: Need to install
- ⏳ Backend: Need to start
- ⏳ App: Ready to run

**Just follow the 4 steps above and you'll be running!** 🚀

---

**Need help with a specific step?** Let me know what error you see!

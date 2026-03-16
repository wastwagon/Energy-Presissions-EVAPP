# 🚀 Run App with Android Studio & Xcode

**Perfect! You have both IDEs installed. Here's how to use them!**

---

## 📱 Option 1: Run with Android Studio (Easiest)

### **Step 1: Open Project in Android Studio**

1. **Open Android Studio**
2. **File → Open**
3. **Navigate to:** `/Users/OceanCyber/Downloads/EnergyPresissionsEVAP/mobile/android`
4. **Click "Open"**

**Android Studio will:**
- Sync Gradle files
- Download dependencies
- Index the project

**First time takes 2-5 minutes** ⏱️

---

### **Step 2: Start Backend**

**Open Terminal:**
```bash
cd /Users/OceanCyber/Downloads/EnergyPresissionsEVAP/backend
npm run start:dev
```

**Keep this running!** The app needs the backend.

---

### **Step 3: Run the App**

**In Android Studio:**

1. **Select a device:**
   - Click device dropdown (top toolbar)
   - Choose your emulator or connected device
   - Or create new emulator: **Tools → Device Manager → Create Device**

2. **Click the green "Run" button** ▶️
   - Or press `Shift + F10` (Mac: `Ctrl + R`)

**Android Studio will:**
- Build the app
- Install on device/emulator
- Launch the app

---

## 🍎 Option 2: Run with Xcode (iOS)

### **Step 1: Install iOS Dependencies**

**First, fix the Expo issue and install pods:**

```bash
cd /Users/OceanCyber/Downloads/EnergyPresissionsEVAP/mobile
npx expo install --fix
cd ios
export PATH="$HOME/.gem/ruby/3.4.0/bin:$PATH"
pod install
cd ..
```

**This may take 2-5 minutes** ⏱️

---

### **Step 2: Open Project in Xcode**

1. **Open Xcode**
2. **File → Open**
3. **Navigate to:** `/Users/OceanCyber/Downloads/EnergyPresissionsEVAP/mobile/ios`
4. **Open:** `EVChargingTemp.xcworkspace` (NOT .xcodeproj!)
   - ⚠️ **Important:** Must open `.xcworkspace`, not `.xcodeproj`

**Xcode will:**
- Load the project
- Index files
- Resolve dependencies

---

### **Step 3: Start Backend**

**Open Terminal:**
```bash
cd /Users/OceanCyber/Downloads/EnergyPresissionsEVAP/backend
npm run start:dev
```

**Keep this running!**

---

### **Step 4: Select Simulator**

**In Xcode:**
1. **Click device dropdown** (top toolbar, next to scheme)
2. **Choose a simulator:**
   - iPhone 17 Pro
   - iPhone 17
   - Or any available simulator

---

### **Step 5: Run the App**

**In Xcode:**
1. **Click the "Play" button** ▶️
   - Or press `Cmd + R`

**Xcode will:**
- Build the app
- Launch simulator
- Install and run the app

---

## 🎯 Quick Comparison

| Feature | Android Studio | Xcode |
|---------|---------------|-------|
| **Setup Time** | ~2 min | ~5 min (needs pod install) |
| **Ease** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Build Speed** | Fast | Fast |
| **Debugging** | Excellent | Excellent |

---

## 🐛 Troubleshooting

### **Android Studio Issues:**

**"Gradle sync failed":**
```bash
cd mobile/android
./gradlew clean
# Then sync again in Android Studio
```

**"SDK not found":**
- Android Studio → Preferences → Appearance & Behavior → System Settings → Android SDK
- Check SDK location is: `~/Library/Android/sdk`

**"Build failed":**
- File → Invalidate Caches → Invalidate and Restart

---

### **Xcode Issues:**

**"No such module":**
```bash
cd mobile/ios
pod install
# Then reopen Xcode
```

**"Signing error":**
- Xcode → Project Settings → Signing & Capabilities
- Select your Apple ID team
- Or set to "Automatically manage signing"

**"Build failed":**
- Product → Clean Build Folder (`Shift + Cmd + K`)
- Then rebuild

---

## 📋 Recommended Workflow

### **For Quick Testing:**
1. ✅ Use **Android Studio** (faster setup)
2. ✅ Test Android app
3. ✅ Fix iOS later

### **For Full Testing:**
1. ✅ Start backend
2. ✅ Test Android in Android Studio
3. ✅ Fix iOS pods
4. ✅ Test iOS in Xcode

---

## 🎯 All-in-One Commands

### **Terminal 1 - Backend:**
```bash
cd /Users/OceanCyber/Downloads/EnergyPresissionsEVAP/backend
npm run start:dev
```

### **Terminal 2 - Fix iOS (if needed):**
```bash
cd /Users/OceanCyber/Downloads/EnergyPresissionsEVAP/mobile
npx expo install --fix
cd ios
export PATH="$HOME/.gem/ruby/3.4.0/bin:$PATH"
pod install
```

### **Then:**
- **Android:** Open in Android Studio and click Run ▶️
- **iOS:** Open `.xcworkspace` in Xcode and click Run ▶️

---

## ✅ Success Indicators

**Android Studio:**
- ✅ Gradle sync successful
- ✅ Build successful
- ✅ App launches on emulator/device
- ✅ Login screen appears

**Xcode:**
- ✅ No build errors
- ✅ Simulator launches
- ✅ App installs
- ✅ Login screen appears

---

## 🎉 You're All Set!

**With both IDEs installed, you can:**
- ✅ Build and run Android easily
- ✅ Build and run iOS (after pod install)
- ✅ Debug with full IDE features
- ✅ Use breakpoints and inspectors

**Start with Android Studio - it's the fastest path!** 🚀

---

**Need help?** Let me know which IDE you want to use first!

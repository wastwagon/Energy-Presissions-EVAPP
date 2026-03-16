# ⚡ Quick Start with Android Studio & Xcode

**You have both IDEs! Here's the fastest way to get running:**

---

## 🚀 Fastest Path: Android Studio (Recommended)

### **3 Simple Steps:**

#### **Step 1: Start Backend**
**Open Terminal:**
```bash
cd /Users/OceanCyber/Downloads/EnergyPresissionsEVAP/backend
npm run start:dev
```
**Keep this terminal open!**

---

#### **Step 2: Open in Android Studio**
1. **Launch Android Studio**
2. **File → Open**
3. **Navigate to:** `/Users/OceanCyber/Downloads/EnergyPresissionsEVAP/mobile/android`
4. **Click "Open"**

**Wait for Gradle sync** (2-3 minutes first time)

---

#### **Step 3: Run!**
1. **Select device** from dropdown (top toolbar)
   - Choose emulator or create one: **Tools → Device Manager**
2. **Click green Run button** ▶️ (or `Ctrl + R`)

**Done!** App will build and launch! 🎉

---

## 🍎 iOS with Xcode (After Android)

### **Step 1: Fix & Install iOS Dependencies**

**Open Terminal:**
```bash
cd /Users/OceanCyber/Downloads/EnergyPresissionsEVAP/mobile
npx expo install --fix
cd ios
export PATH="$HOME/.gem/ruby/3.4.0/bin:$PATH"
pod install
cd ..
```

**Wait 2-5 minutes** for pod install

---

### **Step 2: Start Backend**
**Open Terminal:**
```bash
cd /Users/OceanCyber/Downloads/EnergyPresissionsEVAP/backend
npm run start:dev
```

---

### **Step 3: Open in Xcode**
1. **Launch Xcode**
2. **File → Open**
3. **Navigate to:** `/Users/OceanCyber/Downloads/EnergyPresissionsEVAP/mobile/ios`
4. **Open:** `EVChargingTemp.xcworkspace` ⚠️ (NOT .xcodeproj!)

---

### **Step 4: Run!**
1. **Select simulator** from dropdown (top toolbar)
   - Choose: iPhone 17 Pro, iPhone 17, etc.
2. **Click Play button** ▶️ (or `Cmd + R`)

**Done!** App will build and launch! 🎉

---

## 📋 What You'll See

**When it works:**
- ✅ Backend running on port 3000
- ✅ IDE building the app
- ✅ Emulator/Simulator launching
- ✅ App installing
- ✅ Login screen appears

---

## 🐛 Quick Fixes

### **Android Studio:**
- **Gradle sync fails?** → File → Invalidate Caches → Restart
- **Build fails?** → Build → Clean Project, then rebuild
- **No device?** → Tools → Device Manager → Create Device

### **Xcode:**
- **Build fails?** → Product → Clean Build Folder (`Shift + Cmd + K`)
- **Signing error?** → Project Settings → Signing → Select your team
- **No workspace?** → Run `pod install` first

---

## ✅ Checklist

**Before Running:**
- [ ] Backend is running (`npm run start:dev`)
- [ ] Android: Project opened in Android Studio
- [ ] iOS: Pods installed (`pod install`)
- [ ] iOS: Workspace opened in Xcode (`.xcworkspace`)
- [ ] Device/Simulator selected

---

## 🎯 Recommended Order

1. ✅ **Start with Android Studio** (fastest)
2. ✅ **Test Android app**
3. ✅ **Fix iOS pods**
4. ✅ **Test iOS in Xcode**

---

## 💡 Pro Tips

**Android Studio:**
- Use **Layout Inspector** to debug UI
- Use **Logcat** to see console logs
- Use **Breakpoints** for debugging

**Xcode:**
- Use **Debug Navigator** to see app state
- Use **Console** to see logs
- Use **View Debugger** for UI debugging

---

**You're all set! Start with Android Studio - it's the fastest!** 🚀

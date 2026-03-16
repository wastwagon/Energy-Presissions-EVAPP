# Google Maps API - Quick Guide for Both Apps

**Based on Your Google Cloud Console Search**

---

## 🎯 What to Enable (From Your Search Results)

### ✅ Required for Mobile App

**From "Marketplace" section:**
1. ✅ **"Maps SDK for Android"**
   - Click on it
   - Click "Enable"
   - This is for your Android mobile app

**Search separately:**
2. ✅ **"Maps SDK for iOS"**
   - Search for: "Maps SDK for iOS"
   - Click "Enable"
   - This is for your iOS mobile app

### ⚠️ Optional for Web App

**From "Documentation & tutorials" section:**
3. ⚠️ **"Maps JavaScript API"**
   - Only enable if you want maps on web frontend
   - Currently your web app shows list view (no maps)
   - Can add later if needed

---

## 🔑 Create API Key

### Step 1: Go to Credentials
1. Click **"APIs & Services"** (from "Top results")
2. Click **"Credentials"** (from "Products & pages")
3. Click **"Create Credentials"** → **"API Key"**
4. Copy the API key

### Step 2: Restrict API Key (IMPORTANT!)

**Click on your API key, then:**

**Application Restrictions:**
- ✅ **Android apps**: Add `com.cleanmotionghana.app`
- ✅ **iOS apps**: Add `com.cleanmotionghana.app`
- ⚠️ **HTTP referrers**: Add your web domain (if using Maps JS API)

**API Restrictions:**
- ✅ Restrict to:
  - Maps SDK for Android
  - Maps SDK for iOS
  - Maps JavaScript API (if enabled)

---

## 📱 Current App Status

### Mobile App
- ✅ Uses `react-native-maps`
- ✅ Shows maps in StationsScreen
- ✅ **Needs**: Maps SDK for Android + iOS

### Web App
- ✅ Shows station list (no maps currently)
- ⚠️ Could add Maps JavaScript API later
- ✅ Works fine without maps

---

## ✅ Recommended: Enable These 2

**For Mobile App (Required):**
1. ✅ **Maps SDK for Android** (from Marketplace)
2. ✅ **Maps SDK for iOS** (search for it)

**For Web App (Optional):**
3. ⚠️ **Maps JavaScript API** (only if you want maps on web)

---

## 🎯 Quick Answer

**From your search results, click on:**

1. ✅ **"Maps SDK for Android"** (Marketplace section)
   - Enable this
   - For Android mobile app

2. ✅ **Search for "Maps SDK for iOS"**
   - Enable this
   - For iOS mobile app

3. ⚠️ **"Maps JavaScript API"** (optional)
   - Only if you want maps on web
   - Can skip for now

**Then create one API key for all three!**

---

## 💰 Cost

**All APIs share same pricing:**
- $200/month free credit
- Then ~$7 per 1,000 requests
- **One API key = One billing**

**Estimated: $0-50/month** (stays in free tier for most apps)

---

## 📋 After You Enable APIs

1. ✅ Create API key
2. ✅ Restrict to your apps
3. ✅ Share the key with me
4. ✅ I'll integrate into both apps

---

**Status**: ✅ Ready to integrate!

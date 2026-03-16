# Google Maps API - Recommendation for Both Apps

**Which APIs to Enable for Web + Mobile**

---

## 🎯 Recommended APIs to Enable

### For Mobile App (React Native)

**Required:**
1. ✅ **Maps SDK for Android**
   - For Android mobile app
   - Package: `com.cleanmotionghana.app`

2. ✅ **Maps SDK for iOS**
   - For iOS mobile app
   - Bundle ID: `com.cleanmotionghana.app`

**These are the ones you need from the search results!**

### For Web App (React)

**Optional but Recommended:**
3. ⚠️ **Maps JavaScript API**
   - If you want maps on the web frontend
   - For station finder on web
   - Not required if web doesn't show maps

---

## 📋 What to Enable in Google Cloud Console

### Step 1: Enable These APIs

From your search results, enable:

1. **Maps SDK for Android** ✅ (Required for mobile Android)
   - Found in: "Marketplace" section
   - Description: "Maps for your native Android app"

2. **Maps SDK for iOS** ✅ (Required for mobile iOS)
   - Search for: "Maps SDK for iOS"
   - Description: "Maps for your native iOS app"

3. **Maps JavaScript API** ⚠️ (Optional for web)
   - Found in: "Documentation & tutorials" → "Intro to Maps JavaScript API"
   - Only if you want maps on web frontend

### Step 2: Create API Key

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"API Key"**
3. Copy the API key

### Step 3: Restrict API Key

**Important for Security:**

1. Click on your API key
2. **Application restrictions**:
   - **Android apps**: Add package name `com.cleanmotionghana.app`
   - **iOS apps**: Add bundle ID `com.cleanmotionghana.app`
   - **HTTP referrers** (for web): Add your web domain if using Maps JavaScript API

3. **API restrictions**:
   - Restrict to only:
     - ✅ Maps SDK for Android
     - ✅ Maps SDK for iOS
     - ⚠️ Maps JavaScript API (if using on web)

---

## 🎯 Best Choice for Your Setup

### Recommended: Enable Both SDKs

**For Mobile App (Required):**
- ✅ **Maps SDK for Android** - From "Marketplace" section
- ✅ **Maps SDK for iOS** - Search for it separately

**For Web App (Optional):**
- ⚠️ **Maps JavaScript API** - Only if you want maps on web

### Why This Setup?

1. **Mobile App** uses `react-native-maps` which requires:
   - Maps SDK for Android (Android devices)
   - Maps SDK for iOS (iOS devices)

2. **Web App** can use:
   - Maps JavaScript API (if you want maps)
   - Or just show list view (no maps needed)

---

## 📱 Current Implementation

### Mobile App
- ✅ Uses `react-native-maps`
- ✅ Shows maps in StationsScreen
- ✅ Shows maps in StationDetailScreen
- ✅ **Needs**: Maps SDK for Android + iOS

### Web App
- ⚠️ Currently shows station list (no maps visible)
- ⚠️ Could add Maps JavaScript API later if needed

---

## 🔑 Single API Key for Both?

**Yes!** You can use **one API key** for:
- ✅ Android mobile app
- ✅ iOS mobile app
- ⚠️ Web app (if using Maps JavaScript API)

**How:**
- Restrict the key to all three platforms
- Same key works for all
- Easier to manage

---

## 📋 Step-by-Step from Your Screenshot

### From the Search Results You See:

1. **Click on "Maps SDK for Android"** (Marketplace section)
   - Enable this API
   - This is for your Android mobile app

2. **Search for "Maps SDK for iOS"**
   - Enable this API
   - This is for your iOS mobile app

3. **Optional: "Maps JavaScript API"**
   - Only if you want maps on web
   - Can add later

4. **Go to "APIs & Services" → "Credentials"**
   - Create API key
   - Restrict to your apps

---

## ✅ Recommended Configuration

### Enable These APIs:

```
✅ Maps SDK for Android     → For mobile Android
✅ Maps SDK for iOS         → For mobile iOS
⚠️ Maps JavaScript API     → For web (optional)
```

### Create One API Key:

```
API Key Restrictions:
├── Android: com.cleanmotionghana.app
├── iOS: com.cleanmotionghana.app
└── Web: your-domain.com (if using Maps JS API)
```

---

## 💰 Cost

**All three APIs share the same pricing:**
- $200/month free credit
- Then ~$7 per 1,000 requests
- **One API key = One billing account**

**Estimated Cost:**
- Small app: **$0-50/month** (stays in free tier)
- Medium app: **$50-200/month**

---

## 🎯 Quick Answer

**From your search results, enable:**

1. ✅ **"Maps SDK for Android"** (from Marketplace)
   - For Android mobile app

2. ✅ **"Maps SDK for iOS"** (search for it)
   - For iOS mobile app

3. ⚠️ **"Maps JavaScript API"** (optional)
   - Only if you want maps on web frontend

**Then create one API key restricted to all three!**

---

## 📝 Next Steps

1. **Enable the APIs** from your search results
2. **Create API key** in Credentials
3. **Restrict the key** to your apps
4. **Share the key** with me
5. **I'll integrate** it into both apps

---

**Status**: ✅ Ready to integrate once you provide the API key!

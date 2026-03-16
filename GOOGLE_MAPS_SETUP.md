# Google Maps API Integration Guide

**Preparing for Google Maps API Key**

---

## 📍 Current Maps Implementation

### Current Status
- ✅ `react-native-maps` installed
- ✅ Maps displaying in StationsScreen
- ✅ Maps displaying in StationDetailScreen
- ⚠️ **No Google Maps API key configured yet**

### Current Behavior
- Maps work but may show watermarks
- Limited features without API key
- Basic map functionality available

---

## 🔑 Google Maps API Setup

### Step 1: Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable these APIs:
   - **Maps SDK for Android**
   - **Maps SDK for iOS**
   - **Places API** (optional, for search)
   - **Directions API** (optional, for navigation)
   - **Geocoding API** (optional, for address lookup)

4. Create API Key:
   - Go to "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the API key

### Step 2: Restrict API Key (Security)

**Important**: Restrict your API key for security!

1. Click on your API key
2. **Application restrictions**:
   - Android: Add package name: `com.cleanmotionghana.app`
   - iOS: Add bundle ID: `com.cleanmotionghana.app`
3. **API restrictions**:
   - Restrict to only the APIs you enabled

---

## 📱 Android Configuration

### Step 1: Update AndroidManifest.xml

**File**: `mobile/android/app/src/main/AndroidManifest.xml`

```xml
<application>
  <!-- Add this inside <application> tag -->
  <meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="YOUR_GOOGLE_MAPS_API_KEY"/>
</application>
```

### Step 2: Update build.gradle (if needed)

The current setup should work, but verify:
- Google Play Services is included
- Maps dependency is correct

---

## 🍎 iOS Configuration

### Step 1: Update AppDelegate

**File**: `mobile/ios/EVChargingTemp/AppDelegate.mm` or `AppDelegate.swift`

**For Objective-C (AppDelegate.mm)**:
```objc
#import <GoogleMaps/GoogleMaps.h>

- (BOOL)application:(UIApplication *)application 
didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
  [GMSServices provideAPIKey:@"YOUR_GOOGLE_MAPS_API_KEY"];
  // ... rest of code
}
```

**For Swift (AppDelegate.swift)**:
```swift
import GoogleMaps

func application(_ application: UIApplication, 
                 didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
  GMSServices.provideAPIKey("YOUR_GOOGLE_MAPS_API_KEY")
  // ... rest of code
}
```

### Step 2: Update Info.plist

**File**: `mobile/ios/EVChargingTemp/Info.plist`

Add location usage description (already present):
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to find nearby charging stations</string>
```

---

## 🔧 Configuration Files to Create

### Environment Configuration

Create these files to store API keys securely:

**File**: `mobile/.env` (for development)
```
GOOGLE_MAPS_API_KEY=your_api_key_here
```

**File**: `mobile/.env.production` (for production)
```
GOOGLE_MAPS_API_KEY=your_production_api_key_here
```

**Note**: Add `.env` to `.gitignore` to keep keys secure!

---

## 📝 Code Updates Needed

### 1. Create Maps Configuration File

**File**: `mobile/src/config/maps.config.ts`

```typescript
/**
 * Google Maps Configuration
 */

// For development, you can use a placeholder
// In production, use environment variables
const getGoogleMapsApiKey = (): string => {
  // Check environment variable first
  if (process.env.GOOGLE_MAPS_API_KEY) {
    return process.env.GOOGLE_MAPS_API_KEY;
  }
  
  // Fallback to config (you'll set this)
  return 'YOUR_GOOGLE_MAPS_API_KEY_HERE';
};

export const MAPS_CONFIG = {
  apiKey: getGoogleMapsApiKey(),
  defaultRegion: {
    latitude: 5.6037, // Accra, Ghana
    longitude: -0.1870,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  },
  defaultZoom: 13,
};

export default MAPS_CONFIG;
```

### 2. Update StationsScreen to Use API Key

The current implementation should work, but we can enhance it with:
- Custom map styling
- Better markers
- Directions integration

---

## 🎨 Enhanced Maps Features (After API Key)

### Features to Add:

1. **Custom Map Styling**
   - Brand colors
   - Custom markers
   - Themed map style

2. **Directions Integration**
   - "Get Directions" button
   - Navigation integration
   - Route display

3. **Places API** (Optional)
   - Search nearby places
   - Address autocomplete
   - Place details

4. **Clustering** (For many stations)
   - Cluster markers when zoomed out
   - Better performance
   - Cleaner map

---

## 🔒 Security Best Practices

### 1. **Never Commit API Keys**
- Add `.env` to `.gitignore`
- Use environment variables
- Use different keys for dev/prod

### 2. **Restrict API Keys**
- Restrict by application (Android/iOS)
- Restrict by API
- Set usage quotas

### 3. **Monitor Usage**
- Set up billing alerts
- Monitor API usage
- Review access logs

---

## 📋 Setup Checklist

### Before You Provide API Key:
- [ ] Google Cloud project created
- [ ] Required APIs enabled
- [ ] API key created
- [ ] API key restricted (Android package + iOS bundle ID)
- [ ] Billing enabled (if required)

### After You Provide API Key:
- [ ] Update AndroidManifest.xml
- [ ] Update iOS AppDelegate
- [ ] Create maps.config.ts
- [ ] Test on Android device
- [ ] Test on iOS device
- [ ] Verify no watermarks
- [ ] Test map features

---

## 🚀 Quick Start (When You Have API Key)

1. **Provide API Key**: Share your Google Maps API key
2. **I'll Update**: Configuration files
3. **Test**: On both Android and iOS
4. **Verify**: Maps work without watermarks

---

## 💰 Cost Considerations

### Google Maps Pricing (Approximate)

**Maps SDK for Android/iOS:**
- First $200/month free
- Then $7 per 1,000 requests

**Places API** (if used):
- First $200/month free
- Then varies by request type

**Estimated Monthly Cost:**
- Small app (< 1,000 users): **$0-50/month**
- Medium app (1,000-10,000 users): **$50-200/month**
- Large app (10,000+ users): **$200-1000/month**

**Note**: Google provides $200/month free credit!

---

## ✅ Current Status

**Ready for Google Maps API Integration:**
- ✅ Maps library installed
- ✅ Maps displaying (basic)
- ✅ Configuration structure ready
- ⏳ Waiting for API key to enable full features

**Once you provide the API key, I'll:**
1. Update all configuration files
2. Enable full Google Maps features
3. Add custom styling
4. Test on both platforms
5. Add directions integration (optional)

---

**Status**: ✅ Ready for Google Maps API key integration!

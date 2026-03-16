# Mobile App Setup Guide

## Initial Setup Steps

### 1. Install React Native CLI (if not already installed)

```bash
npm install -g react-native-cli
```

### 2. Initialize React Native Project

**Note:** The project structure has been created, but you need to initialize the native iOS and Android projects.

#### Option A: Use React Native CLI (Recommended)

```bash
cd mobile
npx react-native init EVCharging --template react-native-template-typescript --skip-install
```

Then copy the `ios` and `android` folders to the mobile directory, and merge the `package.json` dependencies.

#### Option B: Manual Setup

1. **Create iOS project:**
   ```bash
   cd mobile
   npx pod-install ios
   ```

2. **Create Android project:**
   ```bash
   cd android
   ./gradlew clean
   ```

### 3. Install Dependencies

```bash
cd mobile
npm install
```

### 4. iOS Setup

```bash
cd ios
pod install
cd ..
```

### 5. Configure Vector Icons

#### iOS (`ios/EVCharging/Info.plist`):
Add fonts to `Info.plist`:
```xml
<key>UIAppFonts</key>
<array>
  <string>MaterialIcons.ttf</string>
</array>
```

#### Android (`android/app/build.gradle`):
Add to `android/app/build.gradle`:
```gradle
apply from: "../../node_modules/react-native-vector-icons/fonts.gradle"
```

### 6. Configure API URLs

Update these files with your API endpoints:

**`src/services/api.ts`:**
```typescript
const getApiUrl = () => {
  return __DEV__
    ? 'http://YOUR_LOCAL_IP:3000/api' // e.g., 'http://192.168.1.100:3000/api'
    : 'https://your-api-domain.com/api';
};
```

**`src/services/websocket.ts`:**
```typescript
this.wsUrl = __DEV__
  ? 'http://YOUR_LOCAL_IP:8080' // e.g., 'http://192.168.1.100:8080'
  : 'https://your-api-domain.com';
```

### 7. Run the App

#### iOS Simulator:
```bash
npm run ios
```

#### Android Emulator:
```bash
npm run android
```

#### Physical Device:

1. **iOS:**
   - Connect iPhone via USB
   - Trust computer on iPhone
   - Run: `npm run ios --device`

2. **Android:**
   - Enable USB debugging on Android device
   - Connect via USB
   - Run: `npm run android`

### 8. Troubleshooting

#### Metro Bundler Issues:
```bash
npm start -- --reset-cache
```

#### iOS Build Issues:
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

#### Android Build Issues:
```bash
cd android
./gradlew clean
cd ..
```

#### Clear All Caches:
```bash
# iOS
cd ios
rm -rf build Pods Podfile.lock
pod install
cd ..

# Android
cd android
./gradlew clean
rm -rf .gradle build app/build
cd ..

# Node modules
rm -rf node_modules
npm install
```

## Next Steps

1. Test authentication flow
2. Test station discovery with location permissions
3. Test wallet top-up functionality
4. Test charging session start/stop
5. Configure push notifications (optional)
6. Set up app icons and splash screens
7. Prepare for app store submission

## Development Tips

- Use React Native Debugger for debugging
- Enable "Debug JS Remotely" in Dev Menu (Cmd+D / Cmd+M)
- Use Flipper for network inspection
- Test on both iOS and Android regularly
- Use TypeScript for type safety

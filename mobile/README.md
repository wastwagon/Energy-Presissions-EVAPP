# EV Charging Mobile App

React Native mobile application for iOS and Android, built for the EV Charging Station Management System.

## 📱 Features

- **Authentication**: Login and registration
- **Station Discovery**: Find nearby charging stations using GPS
- **Wallet Management**: View balance, top-up, and transaction history
- **Charging Sessions**: Start/stop charging, view active sessions
- **Real-time Updates**: WebSocket integration for live data
- **Maps Integration**: Google Maps for station locations and directions

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- React Native CLI
- Xcode (for iOS development)
- Android Studio (for Android development)
- CocoaPods (for iOS dependencies)

### Installation

1. **Install dependencies:**
   ```bash
   cd mobile
   npm install
   ```

2. **iOS Setup:**
   ```bash
   cd ios
   pod install
   cd ..
   ```

3. **Configure API URLs:**
   
   Update the API base URL in `src/services/api.ts`:
   ```typescript
   const getApiUrl = () => {
     return __DEV__
       ? 'http://YOUR_LOCAL_IP:3000/api' // Change to your local IP
       : 'https://your-api-domain.com/api';
   };
   ```

   Update WebSocket URL in `src/services/websocket.ts`:
   ```typescript
   this.wsUrl = __DEV__
     ? 'http://YOUR_LOCAL_IP:8080'
     : 'https://your-api-domain.com';
   ```

4. **Run the app:**
   
   iOS:
   ```bash
   npm run ios
   ```
   
   Android:
   ```bash
   npm run android
   ```

## 📁 Project Structure

```
mobile/
├── src/
│   ├── screens/          # Screen components
│   │   ├── auth/        # Login, Register
│   │   ├── DashboardScreen.tsx
│   │   ├── StationsScreen.tsx
│   │   ├── WalletScreen.tsx
│   │   └── ...
│   ├── components/      # Reusable components
│   ├── services/        # API services
│   │   ├── api.ts
│   │   ├── authApi.ts
│   │   ├── stationsApi.ts
│   │   ├── walletApi.ts
│   │   └── websocket.ts
│   ├── navigation/     # Navigation setup
│   ├── store/          # Redux store and slices
│   ├── types/          # TypeScript types
│   └── utils/          # Utility functions
├── assets/             # Images, fonts, etc.
├── ios/                # iOS native code
├── android/            # Android native code
└── package.json
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `mobile` directory:

```env
API_URL=http://localhost:3000/api
WS_URL=http://localhost:8080
```

### iOS Configuration

1. Update `ios/EVCharging/Info.plist` with location permissions
2. Configure bundle identifier in `app.json`

### Android Configuration

1. Update `android/app/build.gradle` with package name
2. Configure permissions in `android/app/src/main/AndroidManifest.xml`

## 📦 Dependencies

### Core
- `react-native`: ^0.73.0
- `react`: ^18.2.0
- `typescript`: ^5.3.3

### Navigation
- `@react-navigation/native`: ^6.1.9
- `@react-navigation/stack`: ^6.3.20
- `@react-navigation/bottom-tabs`: ^6.5.11

### State Management
- `@reduxjs/toolkit`: ^2.0.1
- `react-redux`: ^9.0.4

### API & Networking
- `axios`: ^1.6.2
- `socket.io-client`: ^4.8.1

### Storage
- `@react-native-async-storage/async-storage`: ^1.21.0

### Maps & Location
- `react-native-maps`: ^1.8.0
- `react-native-geolocation-service`: ^5.3.1

### UI
- `react-native-paper`: ^5.11.6
- `react-native-vector-icons`: (via react-native-paper)

## 🏗️ Building for Production

### iOS

1. **Update version in `app.json`:**
   ```json
   {
     "ios": {
       "buildNumber": "2"
     }
   }
   ```

2. **Build:**
   ```bash
   cd ios
   xcodebuild -workspace EVCharging.xcworkspace -scheme EVCharging -configuration Release
   ```

3. **Archive in Xcode** for App Store submission

### Android

1. **Generate keystore:**
   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore ev-charging-release.keystore -alias ev-charging-key -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Update `android/app/build.gradle`:**
   ```gradle
   android {
     signingConfigs {
       release {
         storeFile file('ev-charging-release.keystore')
         storePassword 'your-password'
         keyAlias 'ev-charging-key'
         keyPassword 'your-password'
       }
     }
     buildTypes {
       release {
         signingConfig signingConfigs.release
       }
     }
   }
   ```

3. **Build APK:**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

4. **Build AAB (for Play Store):**
   ```bash
   ./gradlew bundleRelease
   ```

## 📱 App Store Submission

### iOS (App Store)

1. **Requirements:**
   - Apple Developer Account ($99/year)
   - App Store Connect account
   - Privacy policy URL
   - App icons and screenshots

2. **Steps:**
   - Archive app in Xcode
   - Upload to App Store Connect
   - Complete app information
   - Submit for review

### Android (Google Play)

1. **Requirements:**
   - Google Play Developer Account ($25 one-time)
   - Privacy policy URL
   - App icons and screenshots

2. **Steps:**
   - Create app in Google Play Console
   - Upload AAB file
   - Complete store listing
   - Submit for review

## 🔐 Security Considerations

- API tokens stored securely using `@react-native-async-storage/async-storage`
- HTTPS required for production API calls
- Certificate pinning recommended for production
- Biometric authentication (Face ID/Touch ID) for sensitive actions

## 🐛 Troubleshooting

### Common Issues

1. **Metro bundler not starting:**
   ```bash
   npm start -- --reset-cache
   ```

2. **iOS build errors:**
   ```bash
   cd ios
   pod deintegrate
   pod install
   ```

3. **Android build errors:**
   ```bash
   cd android
   ./gradlew clean
   ```

4. **Location permissions not working:**
   - Check `Info.plist` (iOS) or `AndroidManifest.xml` (Android)
   - Verify permissions are requested at runtime

## 📝 Notes

- This app requires the backend API to be running
- WebSocket connection is required for real-time updates
- Location services must be enabled for station discovery
- Internet connection required for all API calls

## 🤝 Contributing

1. Follow the existing code structure
2. Use TypeScript for all new files
3. Follow React Native best practices
4. Test on both iOS and Android before submitting

## 📄 License

[Your License Here]

/**
 * Google Maps Configuration
 * 
 * TODO: Add your Google Maps API key when provided
 * 
 * Steps:
 * 1. Get API key from Google Cloud Console
 * 2. Enable Maps SDK for Android and iOS
 * 3. Restrict API key to your app package/bundle ID
 * 4. Replace 'YOUR_GOOGLE_MAPS_API_KEY_HERE' below
 */

// Get API key from environment or use placeholder
const getGoogleMapsApiKey = (): string => {
  // Check for environment variable (for CI/CD)
  if (process.env.GOOGLE_MAPS_API_KEY) {
    return process.env.GOOGLE_MAPS_API_KEY;
  }
  
  // API key is configured in:
  // - Android: android/app/src/main/AndroidManifest.xml
  // - iOS: app.json (ios.config.googleMapsApiKey)
  // This is for reference only - the actual key is set in native configs
  return 'AIzaSyAcCmdSBYOsaljSD0lC1dIXzx7P812Y2z4';
};

export const MAPS_CONFIG = {
  // API key - will be set in native config files
  // This is for reference only
  apiKey: getGoogleMapsApiKey(),
  
  // Default map region (Accra, Ghana)
  defaultRegion: {
    latitude: 5.6037,
    longitude: -0.1870,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  },
  
  // Default zoom level
  defaultZoom: 13,
  
  // Map styling (optional - can customize later)
  mapStyle: null, // Can add custom map style JSON here
  
  // Marker configuration
  marker: {
    defaultColor: '#0A3D62', // Primary brand color
    selectedColor: '#1A5F7A', // Accent color
  },
  
  // Directions (optional - requires Directions API)
  directions: {
    enabled: false, // Enable when Directions API is set up
  },
};

export default MAPS_CONFIG;

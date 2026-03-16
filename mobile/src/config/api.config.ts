/**
 * API Configuration
 * Update these values for your environment
 */

// For development, use your computer's IP address (not localhost)
// Find your IP: macOS/Linux: ifconfig | grep "inet " | grep -v 127.0.0.1
// Windows: ipconfig

const API_CONFIG = {
  // Development API URL (change to your local IP for device testing)
  DEV_API_URL: 'http://192.168.0.101:3000/api',
  
  // Development WebSocket URL
  DEV_WS_URL: 'http://192.168.0.101:8080',
  
  // Production API URL (update when deploying)
  PROD_API_URL: 'https://your-api-domain.com/api',
  
  // Production WebSocket URL
  PROD_WS_URL: 'https://your-api-domain.com',
};

export const getApiUrl = (): string => {
  if (__DEV__) {
    return API_CONFIG.DEV_API_URL;
  }
  return API_CONFIG.PROD_API_URL;
};

export const getWebSocketUrl = (): string => {
  if (__DEV__) {
    return API_CONFIG.DEV_WS_URL;
  }
  return API_CONFIG.PROD_WS_URL;
};

// Helper to update API URLs dynamically
export const updateApiConfig = (apiUrl: string, wsUrl: string) => {
  if (__DEV__) {
    API_CONFIG.DEV_API_URL = apiUrl;
    API_CONFIG.DEV_WS_URL = wsUrl;
  } else {
    API_CONFIG.PROD_API_URL = apiUrl;
    API_CONFIG.PROD_WS_URL = wsUrl;
  }
};

export default API_CONFIG;




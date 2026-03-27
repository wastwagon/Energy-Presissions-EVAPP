import axios from 'axios';

// Use environment variable or default to NGINX proxy URL
// When running in browser, use relative URL to go through NGINX proxy
// When running standalone, use the full URL
const getApiUrl = () => {
  // Check for explicit VITE_API_URL (production)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // If running in browser, determine API URL based on current location (development)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const port = window.location.port;
    const host = window.location.host;
    
    // If accessing via NGINX proxy (port 8080), use relative path
    if (port === '8080' || host.includes(':8080')) {
      return '/api'; // Relative path goes through NGINX
    }
    
    // If accessing directly on port 3001, connect to backend on port 3000
    if (port === '3001' || host.includes(':3001')) {
      return `http://${hostname}:3000/api`;
    }
    
    // If no port specified but on localhost, check if it's likely port 3001
    if (!port && hostname === 'localhost') {
      // Default to direct backend connection for localhost without port
      return 'http://localhost:3000/api';
    }
  }
  
  // Default fallback - use NGINX proxy (relative path)
  return '/api';
};

// Create axios instance with dynamic baseURL
export const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token and vendor context
api.interceptors.request.use(
  (config) => {
    // Re-evaluate API URL on each request to handle dynamic port changes
    config.baseURL = getApiUrl();
    
    // Only add auth token if not a public endpoint
    // Public endpoints: /stations/nearby, /stations/map, /stations/search
    const isPublicEndpoint = config.url?.includes('/stations/nearby') || 
                           config.url?.includes('/stations/map') || 
                           config.url?.includes('/stations/search');
    
    const token = localStorage.getItem('token');
    if (token && !isPublicEndpoint) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add vendor context header if impersonating
    const vendorId = localStorage.getItem('currentVendorId');
    if (vendorId) {
      config.headers['X-Vendor-Id'] = vendorId;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const loginPath = '/login';
      
      // Clear auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('currentVendorId');
      localStorage.removeItem('currentVendorName');
      localStorage.removeItem('isImpersonating');
      
      // Only redirect if not already on a login page
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/login')) {
        window.location.href = loginPath;
      }
    }
    return Promise.reject(error);
  }
);


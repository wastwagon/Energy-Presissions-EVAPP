import axios from 'axios';
import { clearSession } from '../utils/authSession';

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
    
    // Vite dev server (port 3001): use same-origin /api — vite.config.ts proxies to the Nest API :3000
    if (port === '3001' || host.includes(':3001')) {
      return '/api';
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
    const isPublicEndpoint =
      config.url?.includes('/stations/nearby') ||
      config.url?.includes('/stations/map') ||
      config.url?.includes('/stations/search') ||
      config.url?.includes('/utils/reverse-geocode');
    
    const token = localStorage.getItem('token');
    if (token && !isPublicEndpoint) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Vendor scope: backend filters /charge-points (and similar) by X-Vendor-Id.
    // Super Admin Ops should list all charge points unless they are actively impersonating;
    // otherwise a stale currentVendorId (e.g. from vendor management) yields an empty list.
    const vendorId = localStorage.getItem('currentVendorId');
    const pathname =
      typeof window !== 'undefined' ? window.location.pathname : '';
    const isSuperAdminOps = pathname.startsWith('/superadmin/ops');
    const isImpersonating = localStorage.getItem('isImpersonating') === 'true';
    if (vendorId && !(isSuperAdminOps && !isImpersonating)) {
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
      
      clearSession();
      
      // Only redirect if not already on a login page
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/login')) {
        window.location.href = loginPath;
      }
    }
    return Promise.reject(error);
  }
);


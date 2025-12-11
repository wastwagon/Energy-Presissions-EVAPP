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

// Request interceptor for adding auth token and tenant context
api.interceptors.request.use(
  (config) => {
    // Re-evaluate API URL on each request to handle dynamic port changes
    config.baseURL = getApiUrl();
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add tenant context header if impersonating
    const tenantId = localStorage.getItem('currentTenantId');
    if (tenantId) {
      config.headers['X-Tenant-Id'] = tenantId;
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
      // Handle unauthorized - redirect to appropriate login page
      const userStr = localStorage.getItem('user');
      let loginPath = '/login/user';
      
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          if (userData.accountType === 'SuperAdmin') {
            loginPath = '/login/super-admin';
          } else if (userData.accountType === 'Admin') {
            loginPath = '/login/admin';
          }
        } catch (e) {
          // If parsing fails, use default
        }
      }
      
      // Clear auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('currentTenantId');
      localStorage.removeItem('currentTenantName');
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


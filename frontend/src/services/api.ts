import axios from 'axios';
import { clearSession, isAccessTokenExpired } from '../utils/authSession';

// Use environment variable or default to NGINX proxy URL
// When running in browser, use relative URL to go through NGINX proxy
// When running standalone, use the full URL
const getApiUrl = () => {
  // Same-origin through nginx (:8080) or Vite (:3001) wins over VITE_API_URL.
  // Compose sets VITE_API_URL=http://localhost/api which hits port 80 and fails in the browser.
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const port = window.location.port;
    const host = window.location.host;

    if (port === '8080' || host.includes(':8080')) {
      return '/api';
    }

    if (port === '3001' || host.includes(':3001')) {
      return '/api';
    }

    if (!port && hostname === 'localhost') {
      return 'http://localhost:3000/api';
    }
  }

  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

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
    if (token && isAccessTokenExpired(token)) {
      clearSession();
      if (!isPublicEndpoint && typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
        return Promise.reject(new Error('Session expired'));
      }
    } else if (token && !isPublicEndpoint) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Vendor scope: backend filters /charge-points (and similar) by X-Vendor-Id.
    // Super Admin Ops should list all charge points unless they are actively impersonating;
    // otherwise a stale currentVendorId (e.g. from vendor management) yields an empty list.
    let vendorId: string | null = localStorage.getItem('currentVendorId');
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr) as { accountType?: string; vendorId?: number };
        if (user.accountType === 'Admin' && user.vendorId != null) {
          vendorId = String(user.vendorId);
        }
      } catch {
        /* ignore malformed session user */
      }
    }
    const pathname =
      typeof window !== 'undefined' ? window.location.pathname : '';
    const isSuperAdminOps = pathname.startsWith('/superadmin/ops');
    const isImpersonating = localStorage.getItem('isImpersonating') === 'true';
    const parsedVendorId = vendorId ? Number.parseInt(vendorId, 10) : NaN;
    if (
      Number.isFinite(parsedVendorId) &&
      parsedVendorId > 0 &&
      !(isSuperAdminOps && !isImpersonating)
    ) {
      config.headers['X-Vendor-Id'] = String(parsedVendorId);
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


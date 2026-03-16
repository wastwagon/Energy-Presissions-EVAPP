/**
 * Shared Constants
 * Used by both web frontend and mobile app
 */

// App Configuration
export const APP_NAME = 'Clean Motion Ghana';
export const APP_VERSION = '1.0.0';

// API Configuration
export const API_TIMEOUT = 30000; // 30 seconds
export const WS_RECONNECT_INTERVAL = 5000; // 5 seconds
export const WS_MAX_RECONNECT_ATTEMPTS = 5;

// Currency
export const DEFAULT_CURRENCY = 'GHS';
export const CURRENCY_SYMBOL = '₵';

// Station Status
export const STATION_STATUS = {
  AVAILABLE: 'Available',
  CHARGING: 'Charging',
  OFFLINE: 'Offline',
  FAULTED: 'Faulted',
  UNAVAILABLE: 'Unavailable',
} as const;

// Transaction Status
export const TRANSACTION_STATUS = {
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  STOPPED: 'Stopped',
  FAILED: 'Failed',
} as const;

// User Account Types
export const ACCOUNT_TYPES = {
  SUPER_ADMIN: 'SuperAdmin',
  ADMIN: 'Admin',
  CUSTOMER: 'Customer',
  WALK_IN: 'WalkIn',
} as const;

// Colors (Clean Motion Ghana brand - matching theme)
export const COLORS = {
  PRIMARY: '#0A3D62',
  ACCENT: '#1A5F7A',
  BACKGROUND: '#f8fafc',
  SURFACE: '#ffffff',
  TEXT: '#1e293b',
  TEXT_SECONDARY: '#64748b',
  ERROR: '#dc2626',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  INFO: '#3b82f6',
} as const;

// Validation
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 6,
  MAX_PASSWORD_LENGTH: 128,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// Location
export const LOCATION = {
  DEFAULT_RADIUS_KM: 10,
  MAX_RADIUS_KM: 50,
  DEFAULT_LATITUDE: 5.6037, // Accra, Ghana
  DEFAULT_LONGITUDE: -0.1870,
} as const;

// Charging
export const CHARGING = {
  MIN_AMOUNT: 1.0,
  MAX_AMOUNT: 10000.0,
  DEFAULT_CONNECTOR_ID: 1,
} as const;

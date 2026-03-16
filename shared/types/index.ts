/**
 * Shared TypeScript Types
 * Used by both web frontend and mobile app
 */

// User Types
export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  accountType: 'SuperAdmin' | 'Admin' | 'Customer' | 'WalkIn';
  status?: string;
  emailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Auth Types
export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

// Station Types
export interface Station {
  id: number;
  chargePointId: string;
  locationName?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  status: 'Available' | 'Charging' | 'Offline' | 'Faulted' | 'Unavailable';
  pricePerKwh?: number;
  currency?: string;
  totalCapacityKw?: number;
  distance?: number;
  vendorId?: number;
  vendorName?: string;
}

// Transaction Types
export interface Transaction {
  id: number;
  chargePointId: string;
  connectorId?: number;
  userId: number;
  startTime: string;
  stopTime?: string;
  totalEnergyKwh?: number;
  totalCost?: number;
  currency?: string;
  status: 'Active' | 'Completed' | 'Stopped' | 'Failed';
  meterStart?: number;
  meterStop?: number;
}

// Wallet Types
export interface WalletBalance {
  total: number;
  available: number;
  reserved: number;
  currency: string;
}

export interface WalletTransaction {
  id: number;
  userId: number;
  type: 'TopUp' | 'Charge' | 'Refund' | 'Withdrawal';
  amount: number;
  currency: string;
  description?: string;
  createdAt: string;
}

// API Error Types
export interface ApiError {
  message: string;
  statusCode?: number;
  error?: string;
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Location Types
export interface Location {
  latitude: number;
  longitude: number;
}

export interface NearbyStationsParams extends Location {
  radiusKm?: number;
}

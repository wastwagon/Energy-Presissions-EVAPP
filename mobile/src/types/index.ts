/**
 * Shared TypeScript types for mobile app
 * Can be extended from web app types
 */

export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  accountType: 'Customer' | 'Admin' | 'SuperAdmin' | 'WalkIn';
  balance?: number;
  currency?: string;
  status: string;
  emailVerified?: boolean;
  vendorId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChargePoint {
  id: string;
  chargePointId: string;
  locationName?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  totalCapacityKw?: number;
  pricePerKwh?: number;
  currency?: string;
  vendorId?: number;
  status?: string;
  lastHeartbeat?: string;
  lastSeen?: string;
}

export interface StationWithDistance extends ChargePoint {
  distance?: number;
}

export interface Transaction {
  id: number;
  transactionId: number;
  chargePointId: string;
  connectorId?: number;
  idTag?: string;
  userId?: number;
  vendorId?: number;
  startTime: Date;
  stopTime?: Date;
  meterStart?: number;
  meterStop?: number;
  totalEnergyKwh?: number;
  totalCost?: number;
  walletReservedAmount?: number;
  status: string;
}

export interface WalletTransaction {
  id: number;
  userId: number;
  type: string;
  amount: number;
  currency: string;
  status: string;
  balanceBefore: number;
  balanceAfter: number;
  description?: string;
  reference?: string;
  createdAt: string;
}

export interface WalletBalance {
  balance: number;
  currency: string;
}

export interface ApiError {
  message: string;
  statusCode?: number;
  error?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

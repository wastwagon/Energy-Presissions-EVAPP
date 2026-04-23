import { CUSTOMER_ROUTES } from '../config/customerNav.paths';
import { ADMIN_ROUTES, SUPERADMIN_ROUTES } from '../config/staffNav.paths';

export interface SessionUser {
  id?: number;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  accountType?: string;
  vendorId?: number;
  createdAt?: string;
}

export function getStoredUser(): SessionUser | null {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as SessionUser;
  } catch {
    return null;
  }
}

export function hasValidSession(): boolean {
  const token = localStorage.getItem('token');
  return Boolean(token && getStoredUser());
}

export function clearSession(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('currentVendorId');
  localStorage.removeItem('currentVendorName');
  localStorage.removeItem('isImpersonating');
}

export function getDashboardPathForAccountType(accountType?: string): string {
  if (accountType === 'SuperAdmin') return SUPERADMIN_ROUTES.dashboard;
  if (accountType === 'Admin') return ADMIN_ROUTES.dashboard;
  /** Customer/Walk-In: map & search first (Find stations). */
  return CUSTOMER_ROUTES.stations;
}

export function getStoredAccountType(): string | undefined {
  return getStoredUser()?.accountType;
}

/** Web app (non-staff) accounts that use the customer layout and /user routes. */
export function isCustomerOrWalkInAccount(user?: SessionUser | null): boolean {
  const t = user?.accountType;
  return t === 'Customer' || t === 'WalkIn';
}

export function getStoredUserId(): number | null {
  const user = getStoredUser();
  return typeof user?.id === 'number' ? user.id : null;
}

export function requireStoredUserId(): number {
  const userId = getStoredUserId();
  if (!userId) {
    throw new Error('User not logged in');
  }
  return userId;
}

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
  if (accountType === 'SuperAdmin') return '/superadmin/dashboard';
  if (accountType === 'Admin') return '/admin/dashboard';
  return '/user/dashboard';
}

export function getStoredAccountType(): string | undefined {
  return getStoredUser()?.accountType;
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

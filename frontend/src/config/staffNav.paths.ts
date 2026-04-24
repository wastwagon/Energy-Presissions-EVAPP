/**
 * Admin and superadmin SPA routes (dashboards, ops, common staff screens).
 */
export const ADMIN_ROUTES = {
  dashboard: '/admin/dashboard',
  ops: '/admin/ops',
  opsSessions: '/admin/ops/sessions',
  opsDevices: '/admin/ops/devices',
  wallets: '/admin/wallets',
  reports: '/admin/reports',
  users: '/admin/users',
  vendorPortal: '/vendor',
  tariffs: '/admin/tariffs',
  payments: '/admin/payments',
} as const;

export const SUPERADMIN_ROUTES = {
  dashboard: '/superadmin/dashboard',
  ops: '/superadmin/ops',
  opsSessions: '/superadmin/ops/sessions',
  opsDevices: '/superadmin/ops/devices',
  wallets: '/superadmin/wallets',
  settings: '/superadmin/settings',
  vendors: '/superadmin/vendors',
  vendor: '/superadmin/vendor',
  users: '/superadmin/users',
  reports: '/superadmin/reports',
  analytics: '/superadmin/analytics',
  connectionLogs: '/superadmin/connection-logs',
  payments: '/superadmin/payments',
  billing: '/superadmin/billing',
  security: '/superadmin/security',
  health: '/superadmin/health',
  tariffs: '/superadmin/tariffs',
  reservations: '/superadmin/reservations',
  firmware: '/superadmin/firmware',
  diagnostics: '/superadmin/diagnostics',
  smartCharging: '/superadmin/smart-charging',
  localAuth: '/superadmin/local-auth',
} as const;

/** When URL is not under /admin or /superadmin (e.g. legacy /ops). */
export const LEGACY_OPS_BASE = '/ops';

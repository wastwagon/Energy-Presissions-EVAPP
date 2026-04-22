/**
 * Canonical customer-facing route strings (bottom nav, quick actions, deep links).
 */
export const CUSTOMER_ROUTES = {
  dashboard: '/user/dashboard',
  /** Premium hub: find chargers, sessions, wallet (Tesla-style entry). */
  charging: '/user/charging',
  stations: '/stations',
  favorites: '/user/favorites',
  /** Prefix for `/user/sessions/:transactionId` (detail under sessions tab). */
  sessionsRoot: '/user/sessions',
  sessionsActive: '/user/sessions/active',
  sessionsHistory: '/user/sessions/history',
  wallet: '/user/wallet',
  walletTopUp: '/user/wallet/top-up',
  payments: '/user/payments',
  paymentMethods: '/user/payment-methods',
  profile: '/user/profile',
  preferences: '/user/preferences',
  help: '/user/help',
} as const;

/** Path prefixes for BottomNav tab highlighting (matchPaths). */
export const CUSTOMER_BOTTOM_NAV_PREFIXES = {
  stations: [CUSTOMER_ROUTES.stations],
  sessions: [CUSTOMER_ROUTES.sessionsRoot, CUSTOMER_ROUTES.charging],
  wallet: [CUSTOMER_ROUTES.wallet, CUSTOMER_ROUTES.payments],
  profile: [CUSTOMER_ROUTES.profile, CUSTOMER_ROUTES.preferences, CUSTOMER_ROUTES.help],
} as const;

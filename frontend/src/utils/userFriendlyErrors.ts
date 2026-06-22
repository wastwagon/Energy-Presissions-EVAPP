import { CUSTOMER_ROUTES } from '../config/customerNav.paths';
import { MIN_WALLET_START_BALANCE } from '../constants/chargingWallet';

export type UserErrorContext =
  | 'charging'
  | 'wallet'
  | 'stations'
  | 'auth'
  | 'payments'
  | 'profile'
  | 'sessions'
  | 'general';

export type UserErrorAction = 'topUp' | 'login' | 'retry' | 'plugIn' | 'contactSupport';

export type FormattedUserError = {
  message: string;
  action?: UserErrorAction;
  actionLabel?: string;
};

type ErrLike = {
  message?: string;
  code?: string;
  response?: { data?: { message?: string | string[]; error?: string } };
};

type ErrorRule = {
  match: RegExp;
  message: string | ((raw: string, match: RegExpMatchArray) => string);
  action?: UserErrorAction;
  actionLabel?: string;
};

const ACTION_LABELS: Record<UserErrorAction, string> = {
  topUp: 'Top up wallet',
  login: 'Sign in',
  retry: 'Try again',
  plugIn: 'Got it',
  contactSupport: 'Get help',
};

const CONTEXT_FALLBACKS: Record<UserErrorContext, FormattedUserError> = {
  charging: {
    message: 'Something went wrong with charging. Check your connection and try again.',
    action: 'retry',
  },
  wallet: {
    message: 'We could not load your wallet right now. Pull down to refresh or try again shortly.',
    action: 'retry',
  },
  stations: {
    message: 'We could not load stations. Check your connection and try again.',
    action: 'retry',
  },
  auth: {
    message: 'Sign-in did not work. Check your details and try again.',
    action: 'retry',
  },
  payments: {
    message: 'Payment could not be completed. Check your details and try again.',
    action: 'retry',
  },
  profile: {
    message: 'We could not update your profile. Please try again.',
    action: 'retry',
  },
  sessions: {
    message: 'We could not load your sessions. Pull down to refresh or try again.',
    action: 'retry',
  },
  general: {
    message: 'Something went wrong. Please try again.',
    action: 'retry',
  },
};

const ERROR_RULES: ErrorRule[] = [
  {
    match: /insufficient wallet balance.*at least\s*(\d+(?:\.\d+)?)\s*ghs/i,
    message: (_raw, m) =>
      `Add at least GHS ${m[1]} to your wallet before you can start charging.`,
    action: 'topUp',
  },
  {
    match: /insufficient wallet balance/i,
    message:
      'Your wallet balance is too low for this action. Top up your wallet to continue.',
    action: 'topUp',
  },
  {
    match: /user not logged in|authorization header missing|jwt validation failed/i,
    message: 'Your session expired. Please sign in again.',
    action: 'login',
  },
  {
    match: /you cannot access this (wallet|transaction|payment)/i,
    message: 'You do not have access to this. Sign in with the account that owns it.',
    action: 'login',
  },
  {
    match: /transaction .* not found|transaction not found/i,
    message: 'We could not find that charging session. It may have already ended.',
  },
  {
    match: /charge point is not connected.*wait for reconnect|webSocket is closed/i,
    message:
      'This charger was online recently but is not responding. Wait a minute and try again, or pick another station.',
    action: 'retry',
  },
  {
    match: /charge point is not connected|not connected to the ocpp gateway/i,
    message:
      'This charger is offline or not connected. Try another station or check back later.',
    action: 'retry',
  },
  {
    match: /rejected remote start|plug in the connector cable|plug.*cable.*try again/i,
    message:
      'The charger could not start your session. Plug the cable into your vehicle firmly, then try again.',
    action: 'plugIn',
  },
  {
    match: /remote start was not accepted/i,
    message:
      'The charger did not accept the start request. Plug in your vehicle and try again.',
    action: 'plugIn',
  },
  {
    match: /connector .* is .*remote start is only offered/i,
    message: (raw) => {
      const statusMatch = raw.match(/Connector \d+ is (\w+)/i);
      const status = statusMatch?.[1]?.toLowerCase() ?? 'in use';
      return `This connector is ${status}. Wait until it is available, or choose another charger.`;
    },
    action: 'retry',
  },
  {
    match: /command timeout|did not respond in time/i,
    message:
      'The charger took too long to respond. Make sure it is powered on and online, then try again.',
    action: 'retry',
  },
  {
    match: /failed to start charging|failed to stop charging/i,
    message: 'We could not complete that charging action. Try again, or unplug the cable to stop.',
    action: 'retry',
  },
  {
    match: /failed to load wallet|failed to load wallet balance/i,
    message: 'We could not load your wallet balance. Check your connection and try again.',
    action: 'retry',
  },
  {
    match: /either invoiceid or transactionid is required/i,
    message: 'We could not start the payment. Go back to Wallet → Top Up and try again.',
    action: 'retry',
  },
  {
    match: /payment url not received/i,
    message: 'Payment could not be opened. Try again or use a different payment method.',
    action: 'retry',
  },
  {
    match: /invalid email.*password|invalid email, phone/i,
    message: 'Email, phone, or password is incorrect. Check your details and try again.',
    action: 'retry',
  },
  {
    match: /user account is not active|vendor account is (disabled|suspended)/i,
    message:
      'Your account cannot be used right now. Contact support if you need help restoring access.',
    action: 'contactSupport',
  },
  {
    match: /email.*already exists|phone number already exists/i,
    message: 'An account with this email or phone already exists. Try signing in instead.',
    action: 'login',
  },
  {
    match: /passwords do not match/i,
    message: 'The passwords you entered do not match. Type the same password in both fields.',
  },
  {
    match: /password must be at least/i,
    message: 'Choose a password with at least 6 characters.',
  },
  {
    match: /valid phone number/i,
    message: 'Enter a valid phone number with at least 8 digits.',
  },
  {
    match: /valid email|email is required/i,
    message: 'Enter a valid email address.',
  },
  {
    match: /valid ghana phone|mobile money phone/i,
    message: 'Enter a valid Ghana mobile number (for example 024XXXXXXX or +233XXXXXXXXX).',
  },
  {
    match: /minimum top-up|valid amount|amount must be greater than 0/i,
    message: 'Enter a valid top-up amount (minimum GHS 1.00).',
  },
  {
    match: /location access denied|geolocation/i,
    message:
      'Location access is off. Enable location in your browser settings to find nearby chargers, or search by name.',
  },
  {
    match: /cannot reach the (server|api)/i,
    message:
      'Cannot reach our servers. Check your internet connection, turn off VPN if you use one, and try again.',
    action: 'retry',
  },
  {
    match: /network error|err_network/i,
    message:
      'Connection problem. Check your internet and try again.',
    action: 'retry',
  },
  {
    match: /invalid charge point|charge point .* not found|station not found/i,
    message: 'This charger could not be found. Go back and pick a station from the list.',
  },
  {
    match: /invoice is already paid/i,
    message: 'This invoice is already paid. No further payment is needed.',
  },
  {
    match: /failed to send command|command failed|ocpp gateway rejected/i,
    message: 'The charger could not be reached. Try again in a moment or use another station.',
    action: 'retry',
  },
];

function extractRawMessage(err: unknown): string {
  const e = err as ErrLike;
  const data = e.response?.data;
  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message.trim();
  }
  if (Array.isArray(data?.message) && data.message.length > 0) {
    return data.message.join(', ').trim();
  }
  if (typeof data?.error === 'string' && data.error.trim()) {
    return data.error.trim();
  }
  if (typeof e.message === 'string' && e.message.trim()) {
    return e.message.trim();
  }
  return '';
}

function isTechnicalMessage(text: string): boolean {
  return (
    /\[object Object\]|axios|nestjs|typeorm|sql|undefined|null|500|401|403|504|503/i.test(text) ||
    /^Request failed$/i.test(text) ||
    text.length > 280
  );
}

function withActionLabels(result: FormattedUserError): FormattedUserError {
  if (result.action && !result.actionLabel) {
    return { ...result, actionLabel: ACTION_LABELS[result.action] };
  }
  return result;
}

/** Map API / thrown errors to plain-language copy with optional next-step action. */
export function formatUserFacingError(
  err: unknown,
  context: UserErrorContext = 'general',
): FormattedUserError {
  const raw = extractRawMessage(err);
  if (!raw) {
    return withActionLabels({ ...CONTEXT_FALLBACKS[context] });
  }

  const normalized = raw.toLowerCase();

  for (const rule of ERROR_RULES) {
    const match = normalized.match(rule.match) ?? raw.match(rule.match);
    if (match) {
      const message =
        typeof rule.message === 'function' ? rule.message(raw, match) : rule.message;
      return withActionLabels({ message, action: rule.action, actionLabel: rule.actionLabel });
    }
  }

  if (!isTechnicalMessage(raw)) {
    return withActionLabels({ message: raw });
  }

  return withActionLabels({ ...CONTEXT_FALLBACKS[context] });
}

/** Convenience: message string only. */
export function formatUserFacingErrorMessage(
  err: unknown,
  context: UserErrorContext = 'general',
): string {
  return formatUserFacingError(err, context).message;
}

export function userErrorActionRoute(action: UserErrorAction | undefined): string | null {
  switch (action) {
    case 'topUp':
      return CUSTOMER_ROUTES.walletTopUp;
    case 'login':
      return '/login';
    case 'contactSupport':
      return CUSTOMER_ROUTES.help ?? CUSTOMER_ROUTES.wallet;
    default:
      return null;
  }
}

/** Client-side validation messages (no API round-trip). */
export const UserMessages = {
  walletMinToStart: `Add at least GHS ${MIN_WALLET_START_BALANCE.toFixed(2)} to your wallet before starting a charge.`,
  invalidChargePoint: 'This charger is not valid. Go back and select a station from the map or list.',
  sessionExpired: 'Your session expired. Please sign in again.',
  notSignedIn: 'Please sign in to continue.',
  loadWalletFailed: 'We could not load your wallet balance. Check your connection and try again.',
  loadSessionsFailed: 'We could not load your charging sessions. Pull down to refresh or try again.',
  stopChargingFailed:
    'We could not stop charging remotely. Unplug the cable from your vehicle to end the session safely.',
  loadStationsFailed: 'We could not load nearby chargers. Check your connection and try again.',
  stationNotFound: 'This station could not be found. It may have been removed or is temporarily unavailable.',
  loadTransactionFailed: 'We could not load this session. It may have ended or been removed.',
  favoritesFailed: 'Could not update favorites. Try again in a moment.',
  topUpInvalidAmount: 'Enter a valid amount (minimum GHS 1.00).',
} as const;

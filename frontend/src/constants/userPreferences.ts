export const USER_PREF_KEYS = {
  currency: 'user_pref_currency',
  notifications: 'user_pref_notifications',
} as const;

/** WebView / status-bar chrome — always light shell. */
export function getAppChromeBackground(): string {
  return '#f4f7f9';
}

/** Remove legacy dark-mode preference from older app versions. */
export function clearLegacyDarkModePreference(): void {
  try {
    localStorage.removeItem('user_pref_dark_mode');
  } catch {
    /* ignore */
  }
}

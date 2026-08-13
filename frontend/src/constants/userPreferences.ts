import { iosSemanticColors } from '../theme/iosMobileTokens';

export const USER_PREF_KEYS = {
  currency: 'user_pref_currency',
  notifications: 'user_pref_notifications',
} as const;

/** WebView / status-bar chrome — matches grouped page + AppBar so the notch strip is painted. */
export function getAppChromeBackground(): string {
  return iosSemanticColors.groupingBackground;
}

/** Remove legacy dark-mode preference from older app versions. */
export function clearLegacyDarkModePreference(): void {
  try {
    localStorage.removeItem('user_pref_dark_mode');
  } catch {
    /* ignore */
  }
}

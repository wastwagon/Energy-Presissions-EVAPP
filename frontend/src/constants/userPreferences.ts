export const USER_PREF_KEYS = {
  currency: 'user_pref_currency',
  notifications: 'user_pref_notifications',
  darkMode: 'user_pref_dark_mode',
} as const;

export function readDarkModePreference(): boolean {
  try {
    return localStorage.getItem(USER_PREF_KEYS.darkMode) === 'true';
  } catch {
    return false;
  }
}

export function writeDarkModePreference(enabled: boolean): void {
  localStorage.setItem(USER_PREF_KEYS.darkMode, String(enabled));
}

export function getAppChromeBackground(dark: boolean): string {
  return dark ? '#000000' : '#f4f7f9';
}

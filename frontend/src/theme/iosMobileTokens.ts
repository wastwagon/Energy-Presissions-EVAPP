/**
 * Canonical iOS-native-inspired design tokens for the web app (MUI + Emotion).
 * Use these for spacing rhythm, typography, motion, surfaces, and touch targets.
 *
 * Typography: system UI stack mimics SF on Apple platforms.
 */

/** Dark / light for sheet chrome helpers */
export type IosPaletteMode = 'light' | 'dark';

/** 4pt grid (HIG-aligned rhythm) — use multiples in `spacing` Theme unit (8): prefer 1, 1.5, 2, 2.5, 3 … */
export const IOS_GRID_PT = 4;

/** Minimum tappable dimension (Human Interface Guidelines) */
export const IOS_TOUCH_TARGET_PX = 44;

/** Type scale supports “Dynamic Type-like” bumps on larger breakpoints via MUI Typography overrides */
export const iosFontStacks = {
  /** Body & UI — system first for native feel */
  ui: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  /** Headings — same system stack as UI (SF on iOS, Segoe on Windows). No webfont round-trip. */
  display: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
} as const;

export const iosBrandColors = {
  primary: '#0a6570',
  secondary: '#127a87',
  background: '#f4f7f9',
  paper: '#ffffff',
  primaryDark: '#074854',
} as const;

export const iosSemanticColors = {
  separatorLight: 'rgba(60, 60, 67, 0.29)',
  separatorOnLight: 'rgba(60, 60, 67, 0.12)',
  groupingBackground: '#f2f2f7',
  labelSecondary: '#3c3c43',
} as const;

export const iosRadii = {
  /** Buttons, inputs — snug iOS-ish */
  sm: 10,
  /** Cards, grouped lists */
  md: 12,
  /** Modals / sheets feel */
  lg: 16,
  /** Bottom bar / full-bleed */
  flat: 0,
} as const;

export const iosMotion = {
  /** Standard UI transitions (ms) */
  fast: 160,
  standard: 220,
  expressive: 320,
} as const;

export const iosElevations = {
  /** Hairline separators + soft card borders on light backgrounds */
  cardBorder: (foregroundRgb = '60, 60, 67') => `1px solid rgba(${foregroundRgb}, 0.12)`,
};

export const iosTabBar = {
  /** Content row above the home indicator (HIG tab bar). */
  rowHeightPx: 49,
  iconSizePx: 26,
  labelSizePx: 10,
  unselected: 'rgba(60, 60, 67, 0.60)',
  /** Light tab bar fill (ultra-thin material). */
  blurBg: 'rgba(249, 249, 249, 0.92)',
  separator: 'rgba(60, 60, 67, 0.29)',
} as const;

export function iosSheetBlurBg(mode: IosPaletteMode): string {
  return mode === 'light' ? 'rgba(255, 255, 255, 0.96)' : 'rgba(28, 28, 30, 0.94)';
}

/** Page background — single source (replaces scattered hex literals) */
export const IOS_PAGE_BACKGROUND = iosBrandColors.background;

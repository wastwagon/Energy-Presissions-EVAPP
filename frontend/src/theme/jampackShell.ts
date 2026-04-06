import type { Theme } from '@mui/material/styles';
import type { SystemStyleObject } from '@mui/system';
import { alpha } from '@mui/material/styles';

/**
 * Layout tokens aligned with `next-jampack/classic` (vertical menu, light shell).
 * Keeps Clean Motion branding via theme.palette; shell = spacing, surfaces, borders.
 */
export const JAMPACK_DRAWER_WIDTH = 270;

/** Shared KPI / widget card surface (Jampack-style white tiles). */
export const jampackKpiCardBaseSx: SystemStyleObject<Theme> = {
  borderRadius: '10px',
  bgcolor: '#ffffff',
  border: '1px solid rgba(47, 52, 58, 0.09)',
  boxShadow: 'none',
};

/** Optional hover lift for dashboard metric cards. */
export const jampackKpiCardHoverSx: SystemStyleObject<Theme> = {
  transition: 'box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
  '@media (hover: hover) and (pointer: fine)': {
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 14px rgba(47, 52, 58, 0.1)',
      borderColor: (theme) => alpha(theme.palette.primary.main, 0.4),
    },
  },
};

/** hk-pg-wrapper style page background */
export const JAMPACK_PAGE_BG = '#f4f7f9';

/** Drawer paper shared by mobile + desktop */
export const jampackDrawerPaper = {
  boxSizing: 'border-box' as const,
  width: JAMPACK_DRAWER_WIDTH,
  borderRight: '1px solid rgba(47, 52, 58, 0.09)',
  bgcolor: '#ffffff',
  boxShadow: 'none',
};

/** Top navbar: light, minimal separation like hk-navbar */
export const jampackAppBarSx = {
  background: '#ffffff',
  borderBottom: '1px solid rgba(47, 52, 58, 0.09)',
  boxShadow: '0 1px 0 rgba(47, 52, 58, 0.04)',
};

/** Menu list inner padding — matches .menu-content-wrap 1.5rem */
export const jampackMenuListSx = {
  flex: 1,
  pt: 1.5,
  pb: 2,
  px: 1.5,
};

/** Compact dashboard page title (main h1 in content — avoids oversized h4 blocks). */
export const dashboardPageTitleSx: SystemStyleObject<Theme> = {
  fontWeight: 600,
  color: 'text.primary',
  mb: 0.375,
  fontSize: { xs: '1.125rem', sm: '1.3125rem' },
  letterSpacing: '-0.022em',
  lineHeight: 1.35,
};

export const dashboardPageSubtitleSx: SystemStyleObject<Theme> = {
  color: 'text.secondary',
  fontSize: '0.8125rem',
  lineHeight: 1.5,
  maxWidth: '44rem',
};

/** Home / landing feature tiles — white tile + hover lift (mobile-first padding). */
export const premiumFeatureCardSx: SystemStyleObject<Theme> = {
  ...jampackKpiCardBaseSx,
  p: { xs: 2.5, sm: 3 },
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  textAlign: 'center',
  transition: 'transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease',
  '@media (hover: hover) and (pointer: fine)': {
    '&:hover': {
      transform: 'translateY(-3px)',
      boxShadow: '0 16px 40px rgba(15, 23, 42, 0.1)',
      borderColor: (theme) => alpha(theme.palette.primary.main, 0.28),
    },
  },
};

/** Detail / settings section panel — soft shadow, readable on page bg. */
export const premiumPanelCardSx: SystemStyleObject<Theme> = {
  ...jampackKpiCardBaseSx,
  p: { xs: 2, sm: 2.5 },
  borderRadius: '12px',
  boxShadow: '0 8px 28px rgba(15, 23, 42, 0.06)',
};

/** Centered empty state (lists, history) — same surface as panel cards. */
export const premiumEmptyStatePaperSx: SystemStyleObject<Theme> = {
  ...premiumPanelCardSx,
  py: { xs: 3.5, sm: 4 },
  textAlign: 'center',
};

/** Tables and dense list cards: elevated surface, no default padding (use header + body). */
export const premiumTableSurfaceSx: SystemStyleObject<Theme> = {
  ...jampackKpiCardBaseSx,
  borderRadius: '12px',
  boxShadow: '0 8px 28px rgba(15, 23, 42, 0.06)',
  overflow: 'hidden',
};

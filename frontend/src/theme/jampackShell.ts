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

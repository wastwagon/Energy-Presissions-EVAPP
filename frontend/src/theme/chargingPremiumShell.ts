import type { Theme } from '@mui/material/styles';
import type { SystemStyleObject } from '@mui/system';
import { alpha } from '@mui/material/styles';

/**
 * Tesla-style “charging” surface tokens: dark, high-contrast, mobile-first.
 * Used for the Charging hub, promos, and map chrome; keeps the rest of the app on the light Jampack shell.
 */

const ink = '#0a0a0b';
const ink2 = '#121214';
const stroke = 'rgba(255, 255, 255, 0.08)';

/** Dark app bar (mobile) — pairs with `CustomerAppNavDrawer` for signed-in customers. */
export const customerPremiumMobileAppBarSx: SystemStyleObject<Theme> = {
  background: `linear-gradient(180deg, ${ink} 0%, #131316 100%)`,
  color: 'common.white',
  boxShadow: '0 2px 16px rgba(0, 0, 0, 0.2)',
  borderBottom: '1px solid',
  borderColor: stroke,
};

export const customerPremiumAppBarActionIconSx: SystemStyleObject<Theme> = {
  color: 'common.white',
  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' },
};

export const chargingHeroShellSx: SystemStyleObject<Theme> = {
  background: `linear-gradient(160deg, ${ink} 0%, ${ink2} 55%, #16161a 100%)`,
  color: 'common.white',
  borderRadius: { xs: 2.5, sm: 2 },
  p: { xs: 2.5, sm: 3 },
  mb: 2,
  boxShadow: '0 20px 48px rgba(0, 0, 0, 0.32)',
  border: '1px solid',
  borderColor: stroke,
  position: 'relative',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    right: { xs: -20, sm: 8 },
    top: '50%',
    transform: 'translateY(-50%)',
    width: 120,
    height: 120,
    borderRadius: '50%',
    background: (t) => alpha(t.palette.primary.main, 0.12),
    pointerEvents: 'none',
  },
};

export const chargingSubtleTextSx: SystemStyleObject<Theme> = {
  color: 'rgba(255, 255, 255, 0.6)',
  fontSize: '0.8125rem',
  lineHeight: 1.5,
  position: 'relative',
  zIndex: 1,
};

export const chargingTitleSx: SystemStyleObject<Theme> = {
  fontWeight: 700,
  letterSpacing: '-0.03em',
  lineHeight: 1.2,
  fontSize: { xs: '1.5rem', sm: '1.75rem' },
  position: 'relative',
  zIndex: 1,
};

export const chargingNavListPaperSx: SystemStyleObject<Theme> = {
  borderRadius: 2.5,
  overflow: 'hidden',
  border: '1px solid',
  borderColor: stroke,
  background: `linear-gradient(180deg, ${ink2} 0%, #0a0a0a 100%)`,
  color: 'common.white',
  mb: 2,
  boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
};

export const chargingListRowButtonSx: SystemStyleObject<Theme> = {
  py: 1.75,
  px: 2,
  minHeight: 56,
  color: 'common.white',
  borderRadius: 0,
  '&:hover': {
    bgcolor: 'rgba(255, 255, 255, 0.05)',
  },
};

export const chargingListIconBoxSx: SystemStyleObject<Theme> = {
  width: 40,
  height: 40,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  bgcolor: 'rgba(255, 255, 255, 0.08)',
  color: 'rgba(255, 255, 255, 0.9)',
  mr: 1.5,
  flexShrink: 0,
};

export const chargingLastSessionCardSx: SystemStyleObject<Theme> = {
  borderRadius: 2.5,
  p: { xs: 2, sm: 2.25 },
  background: `linear-gradient(180deg, #101012 0%, #080809 100%)`,
  color: 'common.white',
  border: '1px solid',
  borderColor: stroke,
  boxShadow: '0 16px 36px rgba(0,0,0,0.25)',
  mb: 2,
};

/** Compact one-line “last charge” on home dashboard (tappable) */
export const chargingDashboardLastChargeStripSx: SystemStyleObject<Theme> = {
  textDecoration: 'none',
  color: 'inherit',
  display: 'block',
  borderRadius: 2.5,
  p: { xs: 1.5, sm: 1.75 },
  mb: 2.5,
  background: `linear-gradient(100deg, #0e0e10 0%, #141416 50%, #101012 100%)`,
  border: '1px solid',
  borderColor: stroke,
  boxShadow: '0 10px 28px rgba(0,0,0,0.2)',
  transition: 'box-shadow 0.2s ease, transform 0.2s ease',
  position: 'relative',
  overflow: 'hidden',
  '@media (hover: hover) and (pointer: fine)': {
    '&:hover': {
      boxShadow: '0 14px 36px rgba(0,0,0,0.28)',
      transform: 'translateY(-1px)',
    },
  },
  '&:focus-visible': {
    outline: '2px solid',
    outlineColor: (t) => t.palette.primary.main,
    outlineOffset: 2,
  },
};

/** Subtle “pro” frame around the stations map (signed-in) */
export const chargingMapChromeSx: SystemStyleObject<Theme> = {
  borderRadius: { xs: 0, sm: 1.5 },
  boxShadow: '0 8px 28px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0,0,0,0.1) inset',
};

export const chargingBottomSheetPremiumSx: SystemStyleObject<Theme> = {
  background: (t) =>
    t.palette.mode === 'dark'
      ? t.palette.background.paper
      : 'linear-gradient(180deg, #f8f9fc 0%, #ffffff 100%)',
  border: '1px solid',
  borderColor: (t) => alpha(t.palette.divider, 0.9),
};

export const chargingHubPromoCardSx: SystemStyleObject<Theme> = {
  ...chargingHeroShellSx,
  textDecoration: 'none',
  color: 'inherit',
  display: 'block',
  cursor: 'pointer',
  mb: 2.5,
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  '@media (hover: hover) and (pointer: fine)': {
    '&:hover': {
      boxShadow: '0 24px 56px rgba(0, 0, 0, 0.38)',
      transform: 'translateY(-1px)',
    },
  },
  '&:focus-visible': {
    outline: '2px solid',
    outlineColor: (t) => t.palette.primary.main,
    outlineOffset: 2,
  },
};

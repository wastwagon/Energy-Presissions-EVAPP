import type { Theme } from '@mui/material/styles';
import type { SystemStyleObject } from '@mui/system';
import { alpha } from '@mui/material/styles';
import { IOS_TOUCH_TARGET_PX, iosMotion, iosRadii } from './iosMobileTokens';

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
  transition: `transform ${iosMotion.standard}ms ease, box-shadow ${iosMotion.standard}ms ease`,
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

/** Right-edge app drawer (`CustomerAppNavDrawer`) — same ink language as premium app bar. */
export const customerNavDrawerPaperSx: SystemStyleObject<Theme> = {
  width: { xs: 'min(100%, 320px)', sm: 320 },
  maxWidth: '100vw',
  background: `linear-gradient(180deg, ${ink} 0%, ${ink2} 100%)`,
  color: 'common.white',
  borderLeft: '1px solid',
  borderColor: stroke,
  borderTopLeftRadius: `${iosRadii.md}px`,
  borderBottomLeftRadius: `${iosRadii.md}px`,
  boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.35)',
  pt: 'max(12px, env(safe-area-inset-top, 0px))',
  pb: 'env(safe-area-inset-bottom, 0px)',
};

export const customerNavDrawerHeaderRowSx: SystemStyleObject<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 1,
  px: 2,
  py: 1.5,
  borderBottom: '1px solid',
  borderColor: stroke,
};

export const customerNavDrawerListRowSx: SystemStyleObject<Theme> = {
  borderRadius: `${iosRadii.sm}px`,
  mx: 0.5,
  mb: 0.5,
  py: 1.25,
  minHeight: IOS_TOUCH_TARGET_PX,
  color: 'common.white',
  transition: `background-color ${iosMotion.fast}ms ease`,
  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' },
  '&:focus-visible': {
    outline: '2px solid rgba(255, 255, 255, 0.45)',
    outlineOffset: 2,
  },
};

export const customerNavDrawerCloseIconButtonSx: SystemStyleObject<Theme> = {
  color: 'rgba(255, 255, 255, 0.7)',
  minWidth: IOS_TOUCH_TARGET_PX,
  minHeight: IOS_TOUCH_TARGET_PX,
  transition: `background-color ${iosMotion.fast}ms ease`,
  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' },
};

/** Light drawer — matches Jampack / customer page shell so menu + pages share one vocabulary. */
export const customerNavDrawerLightPaperSx: SystemStyleObject<Theme> = {
  width: { xs: 'min(100%, 320px)', sm: 320 },
  maxWidth: '100vw',
  bgcolor: '#ffffff',
  color: 'text.primary',
  borderLeft: '1px solid rgba(47, 52, 58, 0.09)',
  borderTopLeftRadius: `${iosRadii.md}px`,
  borderBottomLeftRadius: `${iosRadii.md}px`,
  boxShadow: '-8px 0 24px rgba(47, 52, 58, 0.08)',
  pt: 'max(12px, env(safe-area-inset-top, 0px))',
  pb: 'env(safe-area-inset-bottom, 0px)',
};

export const customerNavDrawerLightHeaderRowSx: SystemStyleObject<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 1,
  px: 2,
  py: 1.5,
  borderBottom: '1px solid rgba(47, 52, 58, 0.09)',
};

export const customerNavDrawerLightListRowSx: SystemStyleObject<Theme> = {
  borderRadius: `${iosRadii.sm}px`,
  mx: 0.5,
  mb: 0.5,
  py: 1.25,
  minHeight: IOS_TOUCH_TARGET_PX,
  color: 'text.primary',
  transition: `background-color ${iosMotion.fast}ms ease`,
  '&:hover': { bgcolor: 'action.hover' },
  '&:focus-visible': {
    outline: '2px solid',
    outlineColor: (t) => alpha(t.palette.primary.main, 0.45),
    outlineOffset: 2,
  },
};

export const customerNavDrawerLightCloseIconButtonSx: SystemStyleObject<Theme> = {
  color: 'text.secondary',
  minWidth: IOS_TOUCH_TARGET_PX,
  minHeight: IOS_TOUCH_TARGET_PX,
  transition: `background-color ${iosMotion.fast}ms ease`,
  '&:hover': { bgcolor: 'action.hover' },
};

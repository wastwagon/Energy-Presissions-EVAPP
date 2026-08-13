import type { Theme } from '@mui/material/styles';
import type { SystemStyleObject } from '@mui/system';
import { iosFontStacks, iosSemanticColors } from './iosMobileTokens';

/**
 * Opaque navigation chrome. Translucent frost left the status-bar / notch region
 * unpainted in WebViewGold; a solid grouping fill matches the page and native bar.
 */
export const customerFrostedChromeSx: SystemStyleObject<Theme> = {
  backgroundColor: iosSemanticColors.groupingBackground,
  background: iosSemanticColors.groupingBackground,
  backdropFilter: 'none',
  WebkitBackdropFilter: 'none',
  borderColor: 'rgba(60, 60, 67, 0.12)',
  boxShadow: 'none',
};

export const customerFrostedAppBarSx: SystemStyleObject<Theme> = {
  ...customerFrostedChromeSx,
  borderBottom: '0.5px solid rgba(60, 60, 67, 0.12)',
};

/** iOS navigation bar content height (44pt) under the status-bar inset. */
export const CUSTOMER_NAV_BAR_HEIGHT_PX = 44;

export const customerFixedNavBarGapSx: SystemStyleObject<Theme> = {
  height: `calc(${CUSTOMER_NAV_BAR_HEIGHT_PX}px + var(--app-sat, env(safe-area-inset-top, 0px)))`,
  flexShrink: 0,
};

export const customerToolbarSx: SystemStyleObject<Theme> = {
  px: { xs: 1.5, sm: 2 },
  minHeight: `${CUSTOMER_NAV_BAR_HEIGHT_PX}px !important`,
  height: CUSTOMER_NAV_BAR_HEIGHT_PX,
  gap: 0.5,
  position: 'relative',
};

/** Large navigation title (mobile); compacts on md+ via LivePageHeader. */
export const customerLargeTitleSx: SystemStyleObject<Theme> = {
  fontFamily: iosFontStacks.ui,
  fontWeight: 700,
  color: 'text.primary',
  letterSpacing: '-0.026em',
  lineHeight: 1.12,
  fontSize: { xs: '2.125rem', md: '1.3125rem' },
  mb: { xs: 0.5, md: 0.375 },
};

export const customerLargeSubtitleSx: SystemStyleObject<Theme> = {
  fontFamily: iosFontStacks.ui,
  color: 'text.secondary',
  fontSize: { xs: '0.9375rem', md: '0.8125rem' },
  lineHeight: 1.45,
  maxWidth: '44rem',
};

/** Centered page title in the app bar when the large in-page title scrolls away. */
export const customerCompactNavTitleSx: SystemStyleObject<Theme> = {
  position: 'absolute',
  left: 16,
  right: 16,
  textAlign: 'center',
  fontWeight: 600,
  letterSpacing: '-0.02em',
  color: 'text.primary',
  pointerEvents: 'none',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

export const customerCompactNavTitleWithBackSx: SystemStyleObject<Theme> = {
  ...customerCompactNavTitleSx,
  left: 52,
  right: 52,
};

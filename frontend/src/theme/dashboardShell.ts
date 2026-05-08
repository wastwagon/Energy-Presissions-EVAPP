import type { Theme } from '@mui/material/styles';
import type { SystemStyleObject } from '@mui/system';
import {
  JAMPACK_PAGE_BG,
  jampackFixedAppBarMainGapSx,
  mainLayoutFixedHeaderGapSx,
} from './jampackShell';

/**
 * Unified scrollable main region for dashboard-style layouts (mobile-first).
 * Parent must be a column flex with `minHeight: 0` so overflow scroll works in WebView / iOS.
 *
 * Place a spacer as the first child:
 * `<Box {...fixedHeaderSpacerProps} />`
 */
export function dashboardScrollMainSx(options: {
  /** Staff/admin/customer app bars use 64px toolbar + safe area */
  headerVariant: 'appBar' | 'mainLayoutTall';
  /** Match existing `pb` when bottom navigation is shown */
  reserveBottomNav: boolean;
}): SystemStyleObject<Theme> {
  const headerSpacer =
    options.headerVariant === 'mainLayoutTall' ? mainLayoutFixedHeaderGapSx : jampackFixedAppBarMainGapSx;
  return {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    overscrollBehaviorY: 'contain',
    overflowX: 'hidden',
    p: { xs: 2, sm: 3 },
    pb: options.reserveBottomNav ? { xs: 2, sm: 2 } : 3,
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    bgcolor: JAMPACK_PAGE_BG,
    [`& > [data-fixed-header-spacer="true"]`]: {
      ...headerSpacer,
    },
  };
}

/** Non-scrolling root column for full-viewport dashboard shells */
export const dashboardViewportColumnSx: SystemStyleObject<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  height: '100dvh',
  maxHeight: '100dvh',
  minHeight: '100dvh',
  overflow: 'hidden',
  bgcolor: JAMPACK_PAGE_BG,
};

export const fixedHeaderSpacerProps = {
  'data-fixed-header-spacer': 'true' as const,
  'aria-hidden': true as const,
};

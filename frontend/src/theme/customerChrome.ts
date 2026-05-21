import type { Theme } from '@mui/material/styles';
import type { SystemStyleObject } from '@mui/system';
import { iosFontStacks, iosSheetBlurBg } from './iosMobileTokens';

/** Frosted navigation chrome (AppBar / tab bar) — iOS ultra-thin material. */
export const customerFrostedChromeSx: SystemStyleObject<Theme> = {
  background: (theme) => iosSheetBlurBg(theme.palette.mode),
  backdropFilter: 'saturate(180%) blur(20px)',
  WebkitBackdropFilter: 'saturate(180%) blur(20px)',
  borderColor: 'rgba(60, 60, 67, 0.12)',
  boxShadow: 'none',
};

export const customerFrostedAppBarSx: SystemStyleObject<Theme> = {
  ...customerFrostedChromeSx,
  borderBottom: '0.5px solid rgba(60, 60, 67, 0.12)',
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
  left: { xs: 52, sm: 56 },
  right: { xs: 52, sm: 56 },
  textAlign: 'center',
  fontWeight: 600,
  letterSpacing: '-0.02em',
  color: 'text.primary',
  pointerEvents: 'none',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

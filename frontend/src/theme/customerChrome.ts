import type { Theme } from '@mui/material/styles';
import type { SystemStyleObject } from '@mui/system';
import { iosFontStacks, iosSheetBlurBg } from './iosMobileTokens';

/** Frosted navigation chrome (AppBar / tab bar) — iOS ultra-thin material. */
export const customerFrostedChromeSx: SystemStyleObject<Theme> = {
  background: (theme) => iosSheetBlurBg(theme.palette.mode),
  backdropFilter: 'saturate(180%) blur(20px)',
  WebkitBackdropFilter: 'saturate(180%) blur(20px)',
  borderColor: (theme) =>
    theme.palette.mode === 'dark' ? 'rgba(84, 84, 88, 0.65)' : 'rgba(60, 60, 67, 0.12)',
  boxShadow: 'none',
};

export const customerFrostedAppBarSx: SystemStyleObject<Theme> = {
  ...customerFrostedChromeSx,
  borderBottom: (theme) =>
    `0.5px solid ${
      theme.palette.mode === 'dark' ? 'rgba(84, 84, 88, 0.65)' : 'rgba(60, 60, 67, 0.12)'
    }`,
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

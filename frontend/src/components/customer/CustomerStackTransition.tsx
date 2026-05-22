import { Box } from '@mui/material';
import { useTheme, useMediaQuery } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import { useCustomerPageChrome } from '../../contexts/CustomerPageChromeContext';
import { usePrefersReducedMotion } from '../../utils/motionPreference';
import { iosMotion } from '../../theme/iosMobileTokens';

/** Subtle push animation when entering stack detail routes (navBack active). */
export const customerStackPushInSx = {
  '@keyframes customerStackPushIn': {
    from: { opacity: 0, transform: 'translate3d(18px, 0, 0)' },
    to: { opacity: 1, transform: 'translate3d(0, 0, 0)' },
  },
  animation: `customerStackPushIn ${iosMotion.expressive}ms cubic-bezier(0.32, 0.72, 0, 1) both`,
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
  },
};

/**
 * Wraps customer route outlet with a light push transition on phones when
 * `useCustomerNavBack` is active (detail / stack screens).
 */
export function CustomerStackTransition() {
  const location = useLocation();
  const chrome = useCustomerPageChrome();
  const reducedMotion = usePrefersReducedMotion();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const animate = isMobile && !reducedMotion && Boolean(chrome?.navBack);

  return (
    <Box
      key={location.pathname}
      sx={{
        width: '100%',
        minWidth: 0,
        ...(animate ? customerStackPushInSx : {}),
      }}
    >
      <Outlet />
    </Box>
  );
}

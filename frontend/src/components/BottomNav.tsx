import { useNavigate, useLocation } from 'react-router-dom';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import type { ReactNode } from 'react';
import { alpha } from '@mui/material/styles';
import { brandColors } from '../theme';
import { iosMotion, iosRadii, iosSheetBlurBg } from '../theme/iosMobileTokens';
import { triggerHaptic } from '../utils/haptics';

/** Tab that navigates to a route */
export type BottomNavRouteItem = {
  id: string;
  label: string;
  icon: ReactNode;
  path: string;
  matchPaths?: string[];
};

/** Tab that runs a handler (e.g. “More” opening the drawer) */
export type BottomNavActionItem = {
  id: string;
  label: string;
  icon: ReactNode;
  onSelect: () => void;
  /** Defaults to `label` */
  ariaLabel?: string;
};

export type BottomNavItem = BottomNavRouteItem | BottomNavActionItem;

export function isBottomNavRouteItem(item: BottomNavItem): item is BottomNavRouteItem {
  return 'path' in item;
}

export function isBottomNavItemActive(pathname: string, item: BottomNavItem): boolean {
  if (!isBottomNavRouteItem(item)) return false;
  if (pathname === item.path) return true;
  return item.matchPaths?.some((p) => pathname.startsWith(p)) ?? false;
}

interface BottomNavProps {
  items: BottomNavItem[];
  /** Accent color for active state (default / staff shells) */
  accentColor?: string;
  /**
   * `customer`: light chrome aligned with `#f4f7f9` page shell — pill active chip, separators match Jampack.
   * `default`: legacy frosted bar (staff / MainLayout).
   */
  variant?: 'default' | 'customer';
}

export function BottomNav({ items, accentColor = brandColors.primary, variant = 'default' }: BottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const activeIndex = items.findIndex((item) => isBottomNavItemActive(location.pathname, item));

  return (
    <Paper
      component="nav"
      aria-label="Primary navigation"
      elevation={8}
      sx={{
        /**
         * Docked in a column flex layout (not position:fixed) so WebView / iOS rubber-band
         * scroll does not drag the bar with the document. Parent supplies viewport height + scroll.
         */
        flexShrink: 0,
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        zIndex: theme.zIndex.appBar,
        borderTop: '1px solid',
        borderColor: 'divider',
        borderRadius: iosRadii.flat,
        pb: 'max(env(safe-area-inset-bottom, 0px), 0px)',
        pt: variant === 'customer' ? 0.5 : 0,
        background: (_t) =>
          _t.palette.mode === 'light' ? iosSheetBlurBg('light') : iosSheetBlurBg('dark'),
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        boxShadow: (t) =>
          t.palette.mode === 'dark'
            ? 'none'
            : '0 -0.5px 0 rgba(60, 60, 67, 0.12)',
      }}
    >
      <BottomNavigation
        value={activeIndex >= 0 ? activeIndex : false}
        onChange={(_, newValue) => {
          const item = items[newValue as number];
          if (!item) return;
          triggerHaptic('light');
          if (isBottomNavRouteItem(item)) {
            navigate(item.path);
            return;
          }
          item.onSelect();
        }}
        showLabels
        sx={{
          height: 'auto',
          minHeight: 64,
          py: variant === 'customer' ? 0.75 : 0.5,
          px: variant === 'customer' ? { xs: 0.75, sm: 1 } : 0,
          boxSizing: 'border-box',
          bgcolor: variant === 'customer' ? 'transparent' : undefined,
          gap: variant === 'customer' ? { xs: 0.25, sm: 0.5 } : 0,
          '& .MuiBottomNavigationAction-root': {
            minWidth: isMobile ? 56 : 72,
            minHeight: isMobile ? 44 : undefined,
            maxWidth: 'none',
            flex: '1 1 0',
            py: variant === 'customer' ? 0.75 : 0.5,
            pt: variant === 'customer' ? 1 : 0.75,
            pb: variant === 'customer' ? 0.5 : 0.25,
            px: variant === 'customer' ? 0.35 : 0,
            borderRadius: variant === 'customer' ? 999 : 0,
            color: variant === 'customer' ? 'text.secondary' : undefined,
            transition: `color ${iosMotion.standard}ms ease, transform ${iosMotion.standard}ms ease, background-color ${iosMotion.standard}ms ease`,
          },
          '& .MuiBottomNavigationAction-root.Mui-selected': {
            color: variant === 'customer' ? 'primary.main' : accentColor,
            bgcolor: variant === 'customer' ? (t) => alpha(t.palette.primary.main, 0.12) : undefined,
            '& .MuiSvgIcon-root': {
              transform: 'scale(1.06)',
            },
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: isMobile ? '0.6875rem' : '0.8rem',
            fontWeight: variant === 'customer' ? 600 : 500,
            lineHeight: 1.2,
            opacity: 1,
            whiteSpace: 'nowrap',
            '&.Mui-selected': {
              fontSize: isMobile ? '0.6875rem' : '0.8rem',
            },
          },
        }}
      >
        {items.map((item) => (
          <BottomNavigationAction
            key={item.id}
            label={item.label}
            icon={item.icon}
            aria-label={isBottomNavRouteItem(item) ? item.label : item.ariaLabel ?? item.label}
            sx={{
              transition: 'color 0.2s, transform 0.2s',
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}

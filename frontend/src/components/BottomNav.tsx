import { useNavigate, useLocation } from 'react-router-dom';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import type { ReactNode } from 'react';
import { brandColors } from '../theme';

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
  /** Accent color for active state */
  accentColor?: string;
}

export function BottomNav({ items, accentColor = brandColors.primary }: BottomNavProps) {
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
        borderRadius: 0,
        pb: 'max(env(safe-area-inset-bottom, 0px), 0px)',
        pt: 0,
        background: 'rgba(255, 255, 255, 0.97)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <BottomNavigation
        value={activeIndex >= 0 ? activeIndex : false}
        onChange={(_, newValue) => {
          const item = items[newValue as number];
          if (!item) return;
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
          py: 0.5,
          boxSizing: 'border-box',
          '& .MuiBottomNavigationAction-root': {
            minWidth: isMobile ? 52 : 72,
            maxWidth: 'none',
            flex: '1 1 0',
            py: 0.5,
            pt: 0.75,
            pb: 0.25,
          },
          '& .MuiBottomNavigationAction-root.Mui-selected': {
            color: accentColor,
            '& .MuiSvgIcon-root': {
              transform: 'scale(1.08)',
            },
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: isMobile ? '0.6875rem' : '0.8rem',
            fontWeight: 500,
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

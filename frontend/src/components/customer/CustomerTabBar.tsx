import { cloneElement, isValidElement, type ReactElement } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { iosFontStacks, iosMotion, iosTabBar } from '../../theme/iosMobileTokens';
import { APP_MAIN_CONTENT_ID } from '../../constants/a11y';
import { triggerHaptic } from '../../utils/haptics';
import { useCustomerLiveSessionCount } from '../../hooks/useCustomerLiveSessionCount';
import {
  isBottomNavItemActive,
  isBottomNavRouteItem,
  type BottomNavItem,
} from '../BottomNav';

type CustomerTabBarProps = {
  items: BottomNavItem[];
};

/**
 * iOS UITabBar for the customer app (WebViewGold). Outline icons at rest, filled when selected,
 * hairline separator, ultra-thin material, home-indicator inset. Re-tapping the active tab
 * pops to that tab’s root (or scrolls to top).
 */
export function CustomerTabBar({ items }: CustomerTabBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const liveCount = useCustomerLiveSessionCount();

  const selectItem = (item: BottomNavItem) => {
    triggerHaptic('light');
    if (!isBottomNavRouteItem(item)) {
      item.onSelect();
      return;
    }
    if (location.pathname === item.path) {
      document.getElementById(APP_MAIN_CONTENT_ID)?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    navigate(item.path);
  };

  return (
    <Box
      component="nav"
      aria-label="Primary"
      sx={{
        flexShrink: 0,
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        bgcolor: iosTabBar.blurBg,
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderTop: `0.5px solid ${iosTabBar.separator}`,
        pb: 'max(12px, env(safe-area-inset-bottom, 0px))',
        boxShadow: 'none',
        zIndex: (t) => t.zIndex.appBar,
      }}
    >
      <Box
        role="tablist"
        sx={{
          display: 'flex',
          alignItems: 'stretch',
          height: iosTabBar.rowHeightPx,
          px: 0.5,
        }}
      >
        {items.map((item) => {
          const selected = isBottomNavItemActive(location.pathname, item);
          const badge =
            item.id === 'charging' && liveCount > 0 ? (liveCount > 9 ? '9+' : String(liveCount)) : null;
          const glyph = selected && isBottomNavRouteItem(item) && item.activeIcon ? item.activeIcon : item.icon;
          const label = isBottomNavRouteItem(item) ? item.label : item.label;
          const aria = isBottomNavRouteItem(item)
            ? selected
              ? `${item.label}, current page`
              : item.label
            : item.ariaLabel ?? item.label;

          return (
            <Box
              key={item.id}
              component="button"
              type="button"
              role="tab"
              aria-label={aria}
              aria-selected={selected}
              onClick={() => selectItem(item)}
              sx={{
                flex: '1 1 0',
                minWidth: 0,
                minHeight: 44,
                m: 0,
                p: 0,
                border: 0,
                bgcolor: 'transparent',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.25,
                color: selected ? 'primary.main' : iosTabBar.unselected,
                transition: `color ${iosMotion.fast}ms ease, opacity ${iosMotion.fast}ms ease`,
                '&:active': { opacity: 0.45 },
                '&:focus-visible': {
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: -4,
                  borderRadius: 1,
                },
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  width: iosTabBar.iconSizePx,
                  height: iosTabBar.iconSizePx,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '& .MuiSvgIcon-root': {
                    fontSize: iosTabBar.iconSizePx,
                  },
                }}
              >
                {isValidElement(glyph)
                  ? cloneElement(glyph as ReactElement<{ fontSize?: string }>, { fontSize: 'inherit' })
                  : glyph}
                {badge ? (
                  <Box
                    aria-hidden
                    sx={{
                      position: 'absolute',
                      top: -5,
                      right: -8,
                      minWidth: 16,
                      height: 16,
                      px: 0.4,
                      borderRadius: 8,
                      bgcolor: 'error.main',
                      color: '#fff',
                      fontFamily: iosFontStacks.ui,
                      fontSize: 10,
                      fontWeight: 700,
                      lineHeight: '16px',
                      textAlign: 'center',
                    }}
                  >
                    {badge}
                  </Box>
                ) : null}
              </Box>
              <Typography
                component="span"
                sx={{
                  fontFamily: iosFontStacks.ui,
                  fontSize: iosTabBar.labelSizePx,
                  fontWeight: selected ? 600 : 500,
                  lineHeight: 1.15,
                  letterSpacing: '-0.01em',
                  color: 'inherit',
                  maxWidth: '100%',
                  px: 0.25,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

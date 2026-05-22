import { cloneElement, isValidElement, type ReactElement } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Grid, Paper, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { premiumPanelCardSx } from '../../theme/jampackShell';
import { triggerHaptic } from '../../utils/haptics';
import {
  isBottomNavItemActive,
  isBottomNavRouteItem,
  type BottomNavItem,
} from '../BottomNav';

type CustomerDesktopNavCardsProps = {
  items: BottomNavItem[];
};

/**
 * Desktop customer primary nav — shortcut cards below the AppBar (replaces in-header tabs).
 */
export function CustomerDesktopNavCards({ items }: CustomerDesktopNavCardsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const routeItems = items.filter(isBottomNavRouteItem);

  if (routeItems.length === 0) {
    return null;
  }

  return (
    <Box component="nav" aria-label="Primary" sx={{ mb: 1.5 }}>
      <Grid container spacing={{ xs: 1.25, sm: 1.5 }}>
        {routeItems.map((item) => {
          const active = isBottomNavItemActive(location.pathname, item);
          return (
            <Grid item xs={6} sm={3} key={item.id}>
              <Paper
                component="button"
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  navigate(item.path);
                }}
                aria-label={active ? `${item.label}, current page` : `Go to ${item.label}`}
                aria-current={active ? 'page' : undefined}
                elevation={0}
                sx={(theme) => ({
                  ...premiumPanelCardSx,
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.75,
                  py: { xs: 1.75, sm: 2 },
                  px: 1.5,
                  minHeight: 88,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: active
                    ? theme.palette.primary.main
                    : theme.palette.divider,
                  bgcolor: active
                    ? alpha(theme.palette.primary.main, 0.06)
                    : theme.palette.background.paper,
                  transition: `border-color ${theme.transitions.duration.short}ms ease, background-color ${theme.transitions.duration.short}ms ease`,
                  '@media (hover: hover) and (pointer: fine)': {
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      bgcolor: alpha(theme.palette.primary.main, 0.04),
                    },
                  },
                  '&:focus-visible': {
                    outline: `2px solid ${theme.palette.primary.main}`,
                    outlineOffset: 2,
                  },
                })}
              >
                <Box
                  sx={{
                    color: active ? 'primary.main' : 'text.secondary',
                    display: 'flex',
                    '& .MuiSvgIcon-root': { fontSize: { xs: 26, sm: 28 } },
                  }}
                >
                  {isValidElement(item.icon)
                    ? cloneElement(item.icon as ReactElement<{ fontSize?: string }>, {
                        fontSize: 'inherit',
                      })
                    : item.icon}
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: active ? 700 : 600,
                    color: active ? 'primary.main' : 'text.primary',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {item.label}
                </Typography>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

import { Outlet, useNavigate } from 'react-router-dom';
import { Container, AppBar, Toolbar, Typography, Box, Button, IconButton, useTheme, useMediaQuery } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useEffect, useState } from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { BottomNav } from '../components/BottomNav';
import { mainLayoutBottomNavItems } from '../config/menu.config';
import { brandColors } from '../theme';
import {
  jampackAppBarSx,
  jampackAppBarSafeAreaTopSx,
  jampackFixedAppBarZIndexSx,
  mainLayoutFixedHeaderGapSx,
} from '../theme/jampackShell';
import { premiumIconButtonTouchSx, sxObject } from '../styles/authShell';
import { LOGO_PUBLIC_URL } from '../config/branding';
import { clearSession, getDashboardPathForAccountType, getStoredUser, hasValidSession } from '../utils/authSession';

export function MainLayout() {
  const navigate = useNavigate();
  const theme = useTheme();
  const showBottomNav = useMediaQuery(theme.breakpoints.down('lg'));
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const userData = getStoredUser();
    const authenticated = hasValidSession();
    setUser(userData);
    setIsAuthenticated(authenticated);
  }, []);

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  const getDashboardPath = () => {
    return getDashboardPathForAccountType(user?.accountType);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        maxHeight: '100dvh',
        minHeight: '100dvh',
        overflow: 'hidden',
      }}
    >
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: '100%',
          left: 0,
          ...jampackFixedAppBarZIndexSx,
          ...jampackAppBarSafeAreaTopSx,
          ...jampackAppBarSx,
          color: 'text.primary',
        }}
      >
        <Toolbar
          sx={{
            flexWrap: 'wrap',
            gap: 1,
            py: { xs: 1, sm: 0.75 },
            px: { xs: 2, sm: 3 },
            minHeight: { xs: 60, sm: 68 },
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexGrow: 1, minWidth: 0 }}>
            <Box
              component="img"
              src={LOGO_PUBLIC_URL}
              alt="Clean Motion Ghana"
              draggable={false}
              sx={{
                height: { xs: 'clamp(48px, 14vw, 58px)', sm: 56, md: 60 },
                width: 'auto',
                maxWidth: { xs: 'min(280px, 72vw)', sm: 320 },
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </Box>
          {isAuthenticated && user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                noWrap
                sx={{
                  maxWidth: { xs: 100, sm: 180 },
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: 'text.primary',
                }}
              >
                {user.name || user.email}
              </Typography>
              <IconButton
                color="inherit"
                onClick={handleLogout}
                title="Logout"
                aria-label="Logout"
                sx={{
                  ...sxObject(theme, premiumIconButtonTouchSx),
                  color: 'text.primary',
                }}
              >
                <LogoutIcon />
              </IconButton>
            </Box>
          )}
          {!isAuthenticated && (
            <Button color="primary" variant="text" onClick={() => navigate('/login')}>
              Login
            </Button>
          )}
        </Toolbar>
      </AppBar>
      <Box sx={mainLayoutFixedHeaderGapSx} aria-hidden />
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            overscrollBehaviorY: 'contain',
            mt: { xs: 1, sm: 2 },
            px: { xs: 2, sm: 3 },
            pb: showBottomNav ? 2 : 4,
            width: '100%',
          }}
        >
          <Outlet />
        </Container>
        {showBottomNav && (
          <BottomNav
            items={
              isAuthenticated
                ? [
                    ...mainLayoutBottomNavItems.slice(0, 2),
                    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, path: getDashboardPath() },
                  ]
                : mainLayoutBottomNavItems
            }
            accentColor={brandColors.primary}
          />
        )}
      </Box>
    </Box>
  );
}




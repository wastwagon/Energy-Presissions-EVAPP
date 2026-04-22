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
import { LOGO_PUBLIC_URL } from '../config/branding';
import {
  clearSession,
  getDashboardPathForAccountType,
  getStoredUser,
  hasValidSession,
  isCustomerOrWalkInAccount,
} from '../utils/authSession';
import MenuIcon from '@mui/icons-material/Menu';
import { CustomerAppNavDrawer } from '../components/customer/CustomerAppNavDrawer';
import {
  customerPremiumAppBarActionIconSx,
  customerPremiumMobileAppBarSx,
} from '../theme/chargingPremiumShell';
import { premiumIconButtonTouchSx, sxObject } from '../styles/authShell';

export function MainLayout() {
  const navigate = useNavigate();
  const theme = useTheme();
  const showBottomNav = useMediaQuery(theme.breakpoints.down('lg'));
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);

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

  const isCustomer = isCustomerOrWalkInAccount(user);
  const usePremiumCustomerHeader = isAuthenticated && isCustomer && showBottomNav;

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
          ...(usePremiumCustomerHeader
            ? customerPremiumMobileAppBarSx
            : { ...jampackAppBarSx, color: 'text.primary' }),
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
          {usePremiumCustomerHeader && (
            <IconButton
              onClick={() => setNavDrawerOpen(true)}
              aria-label="Open app menu"
              aria-expanded={navDrawerOpen}
              aria-controls="customer-app-nav-drawer-main"
              edge="start"
              sx={customerPremiumAppBarActionIconSx}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 1, sm: 2 },
              flexGrow: 1,
              minWidth: 0,
            }}
          >
            {usePremiumCustomerHeader && (
              <Typography
                component="div"
                variant="h6"
                sx={{
                  display: { xs: 'block', sm: 'none' },
                  fontWeight: 700,
                  color: 'common.white',
                  letterSpacing: '-0.02em',
                  fontSize: '0.95rem',
                  mr: 0.5,
                }}
              >
                CleanMotion
              </Typography>
            )}
            <Box
              component="img"
              src={LOGO_PUBLIC_URL}
              alt="Clean Motion Ghana"
              draggable={false}
              sx={{
                height: { xs: 'clamp(40px, 12vw, 50px)', sm: 56, md: 60 },
                width: 'auto',
                maxWidth: { xs: 'min(220px, 58vw)', sm: 320 },
                objectFit: 'contain',
                display: 'block',
                ...(usePremiumCustomerHeader
                  ? {
                      filter: 'brightness(0) invert(1)',
                    }
                  : {}),
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
                  color: usePremiumCustomerHeader ? 'common.white' : 'text.primary',
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
                  color: usePremiumCustomerHeader ? 'common.white' : 'text.primary',
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
      {usePremiumCustomerHeader && (
        <CustomerAppNavDrawer
          id="customer-app-nav-drawer-main"
          open={navDrawerOpen}
          onClose={() => setNavDrawerOpen(false)}
        />
      )}
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




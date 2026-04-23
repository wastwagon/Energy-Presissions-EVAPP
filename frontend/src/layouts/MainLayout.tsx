import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Container, AppBar, Toolbar, Typography, Box, Button, IconButton, useTheme, useMediaQuery } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useEffect, useMemo, useState } from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HomeIcon from '@mui/icons-material/Home';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { BottomNav, isBottomNavItemActive, type BottomNavItem } from '../components/BottomNav';
import { customerBottomNavItems, mainLayoutBottomNavItems } from '../config/menu.config';
import { CUSTOMER_BOTTOM_NAV_PREFIXES, CUSTOMER_ROUTES } from '../config/customerNav.paths';
import { brandColors } from '../theme';
import {
  jampackAppBarSx,
  jampackAppBarSafeAreaTopSx,
  jampackFixedAppBarZIndexSx,
  mainLayoutFixedHeaderGapSx,
} from '../theme/jampackShell';
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
  const location = useLocation();
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

  const desktopHeaderNavItems: BottomNavItem[] = useMemo(() => {
    if (!isAuthenticated || !user) return [];
    if (isCustomer) return customerBottomNavItems;
    return [
      { id: 'home', label: 'Home', icon: <HomeIcon />, path: '/' },
      {
        id: 'stations',
        label: 'Find Stations',
        icon: <LocationOnIcon />,
        path: CUSTOMER_ROUTES.stations,
        matchPaths: [...CUSTOMER_BOTTOM_NAV_PREFIXES.stations],
      },
      { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, path: getDashboardPath() },
    ];
  }, [isAuthenticated, user, isCustomer]);

  const showDesktopHeaderNav = !showBottomNav && isAuthenticated && desktopHeaderNavItems.length > 0;

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
          {usePremiumCustomerHeader && (
            <Typography
              component="div"
              variant="h6"
              sx={{
                fontWeight: 700,
                color: 'common.white',
                letterSpacing: '-0.02em',
                fontSize: '0.95rem',
                mr: 0.5,
                flexShrink: 0,
              }}
            >
              CleanMotion
            </Typography>
          )}
          {showDesktopHeaderNav && (
            <Box
              component="nav"
              aria-label="Primary"
              sx={{
                flex: 1,
                display: { xs: 'none', lg: 'flex' },
                alignItems: 'center',
                gap: 0.25,
                overflowX: 'auto',
                overflowY: 'hidden',
                minWidth: 0,
                py: 0.5,
                mr: 1,
                WebkitOverflowScrolling: 'touch',
                '&::-webkit-scrollbar': { height: 4 },
              }}
            >
              {desktopHeaderNavItems.map((item) => {
                const active = isBottomNavItemActive(location.pathname, item);
                return (
                  <Button
                    key={item.id}
                    color="inherit"
                    onClick={() => navigate(item.path)}
                    startIcon={item.icon}
                    aria-current={active ? 'page' : undefined}
                    sx={{
                      flexShrink: 0,
                      minHeight: 44,
                      px: { lg: 1.25, xl: 1.5 },
                      py: 0.75,
                      color: active ? 'primary.main' : 'text.secondary',
                      fontWeight: active ? 600 : 500,
                      fontSize: { lg: '0.8125rem', xl: '0.875rem' },
                      borderRadius: 1,
                      borderBottom: '2px solid',
                      borderColor: active ? 'primary.main' : 'transparent',
                      '& .MuiButton-startIcon': { mr: 0.75 },
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Box>
          )}
          <Box
            sx={{
              flexGrow: 1,
              display: showDesktopHeaderNav ? { xs: 'flex', lg: 'none' } : 'flex',
              minWidth: 0,
            }}
          />
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




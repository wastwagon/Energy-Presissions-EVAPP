import { Outlet, useNavigate } from 'react-router-dom';
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useEffect, useState } from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { BottomNav } from '../components/BottomNav';
import { CustomerTabBar } from '../components/customer/CustomerTabBar';
import { customerBottomNavItems, mainLayoutBottomNavItems } from '../config/menu.config';
import { brandColors } from '../theme';
import {
  jampackAppBarSx,
  jampackAppBarSafeAreaTopSx,
  jampackFixedAppBarZIndexSx,
  mainLayoutFixedHeaderGapSx,
} from '../theme/jampackShell';
import {
  customerFixedNavBarGapSx,
  customerFrostedAppBarSx,
  customerToolbarSx,
} from '../theme/customerChrome';
import { CustomerPageChromeProvider, useCustomerPageChrome } from '../contexts/CustomerPageChromeContext';
import { CustomerScrollProviders } from '../components/customer/CustomerShellProviders';
import { CustomerStackTransition } from '../components/customer/CustomerStackTransition';
import { dashboardViewportColumnSx } from '../theme/dashboardShell';
import {
  clearSession,
  getDashboardPathForAccountType,
  getStoredUser,
  hasValidSession,
  isCustomerOrWalkInAccount,
} from '../utils/authSession';
import { CustomerToolbarLeading } from '../components/customer/CustomerToolbarLeading';
import { CustomerDesktopNavCards } from '../components/customer/CustomerDesktopNavCards';
import { premiumIconButtonTouchSx, sxObject } from '../styles/authShell';
import { SkipToMain } from '../components/SkipToMain';
import { APP_MAIN_CONTENT_ID } from '../constants/a11y';

function MainLayoutChrome() {
  const navigate = useNavigate();
  const theme = useTheme();
  const pageChrome = useCustomerPageChrome();
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

  const isCustomer = isCustomerOrWalkInAccount(user);
  const showDockedBottomNav = showBottomNav && !(isCustomer && pageChrome?.navBack);
  const usePremiumCustomerHeader = isAuthenticated && isCustomer && showBottomNav;
  const showCompactNavTitle = Boolean(
    usePremiumCustomerHeader && pageChrome?.showCompactNavTitle && pageChrome.pageTitle,
  );

  const showCustomerDesktopNav =
    !showBottomNav && isAuthenticated && isCustomer && usePremiumCustomerHeader;

  return (
    <Box sx={dashboardViewportColumnSx}>
      <SkipToMain />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: '100%',
          left: 0,
          ...jampackFixedAppBarZIndexSx,
          ...jampackAppBarSafeAreaTopSx,
          ...(usePremiumCustomerHeader ? customerFrostedAppBarSx : jampackAppBarSx),
          color: 'text.primary',
        }}
      >
        <Toolbar
          sx={
            usePremiumCustomerHeader
              ? customerToolbarSx
              : {
                  flexWrap: 'wrap',
                  gap: 1,
                  py: { xs: 1, sm: 0.75 },
                  px: { xs: 2, sm: 3 },
                  minHeight: { xs: 60, sm: 68 },
                  alignItems: 'center',
                  position: 'relative',
                }
          }
        >
          {usePremiumCustomerHeader && (
            <CustomerToolbarLeading
              showBottomNav={showBottomNav}
              isCustomer={isCustomer}
              showCompactNavTitle={showCompactNavTitle}
            />
          )}
          <Box sx={{ flexGrow: 1, minWidth: 0 }} />
          {isAuthenticated && user && !usePremiumCustomerHeader ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flexShrink: 0 }}>
              <Typography
                variant="body2"
                noWrap
                sx={{
                  display: { xs: 'none', md: 'block' },
                  maxWidth: 180,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: 'text.primary',
                }}
              >
                {user.name || user.firstName || 'Account'}
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
          ) : null}
          {!isAuthenticated && (
            <Button color="primary" variant="text" onClick={() => navigate('/login')}>
              Login
            </Button>
          )}
        </Toolbar>
      </AppBar>
      <Box sx={usePremiumCustomerHeader ? customerFixedNavBarGapSx : mainLayoutFixedHeaderGapSx} aria-hidden />
      {showCustomerDesktopNav && (
        <Container
          maxWidth="lg"
          sx={{
            flexShrink: 0,
            px: { xs: 2, sm: 3 },
            width: '100%',
          }}
        >
          <CustomerDesktopNavCards items={customerBottomNavItems} />
        </Container>
      )}
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
          component="main"
          id={APP_MAIN_CONTENT_ID}
          tabIndex={-1}
          maxWidth="lg"
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            overscrollBehaviorY: 'contain',
            mt: { xs: 0.5, sm: 2 },
            px: { xs: 2, sm: 3 },
            pb: showDockedBottomNav ? 1.5 : 4,
            width: '100%',
          }}
        >
          {isCustomer && isAuthenticated ? (
            <CustomerScrollProviders scrollTargetId={APP_MAIN_CONTENT_ID}>
              <CustomerStackTransition />
            </CustomerScrollProviders>
          ) : (
            <Outlet />
          )}
        </Container>
        {showDockedBottomNav &&
          (isAuthenticated && isCustomer ? (
            <CustomerTabBar items={customerBottomNavItems} />
          ) : (
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
          ))}
      </Box>
    </Box>
  );
}

export function MainLayout() {
  return (
    <CustomerPageChromeProvider>
      <MainLayoutChrome />
    </CustomerPageChromeProvider>
  );
}




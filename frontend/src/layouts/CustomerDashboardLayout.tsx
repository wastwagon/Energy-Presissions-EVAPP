import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem as MuiMenuItem,
  IconButton,
  Divider,
  Container,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import HelpIcon from '@mui/icons-material/Help';
import SettingsIcon from '@mui/icons-material/Settings';
import { CustomerTabBar } from '../components/customer/CustomerTabBar';
import { customerBottomNavItems } from '../config/menu.config';
import { CustomerDesktopNavCards } from '../components/customer/CustomerDesktopNavCards';
import { CUSTOMER_ROUTES } from '../config/customerNav.paths';
import { getPrivacyPolicyLink, getTermsOfServiceLink } from '../config/legal.config';
import { clearSession, getStoredUser, isCustomerOrWalkInAccount } from '../utils/authSession';
import { CustomerToolbarLeading } from '../components/customer/CustomerToolbarLeading';
import {
  jampackAppBarSafeAreaTopSx,
  jampackFixedAppBarMainGapSx,
  jampackFixedAppBarZIndexSx,
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
import { iosGroupedPageBgSx } from '../theme/iosGroupedList';
import { premiumIconButtonTouchSx, premiumMenuItemSx, premiumMenuPaperSx, sxObject } from '../styles/authShell';
import { SkipToMain } from '../components/SkipToMain';
import { APP_MAIN_CONTENT_ID } from '../constants/a11y';

function CustomerDashboardChrome() {
  const navigate = useNavigate();
  const theme = useTheme();
  const pageChrome = useCustomerPageChrome();
  const showBottomNav = useMediaQuery(theme.breakpoints.down('lg'));
  /** Tab bar stays on stacked screens (Top up, session detail) so primary nav is always reachable. */
  const showDockedBottomNav = showBottomNav;
  const showCompactNavTitle = Boolean(
    pageChrome?.showCompactNavTitle && pageChrome.pageTitle && showBottomNav,
  );
  const [user, setUser] = useState<any>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const isCustomer = isCustomerOrWalkInAccount(user);
  const showCustomerDesktopNav = !showBottomNav && isCustomer;

  useEffect(() => {
    const userData = getStoredUser();
    if (!userData) {
      navigate('/login', { replace: true });
      return;
    }
    setUser(userData);
  }, [navigate]);

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const openLegal = (href: string, external: boolean) => {
    handleMenuClose();
    if (external) {
      window.open(href, '_blank', 'noopener,noreferrer');
    } else {
      navigate(href);
    }
  };

  return (
    <Box sx={{ ...dashboardViewportColumnSx, ...iosGroupedPageBgSx }}>
      <SkipToMain />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: '100%',
          left: 0,
          ...jampackFixedAppBarZIndexSx,
          ...jampackAppBarSafeAreaTopSx,
          ...customerFrostedAppBarSx,
          color: 'text.primary',
        }}
      >
        <Toolbar sx={showBottomNav ? customerToolbarSx : { px: { xs: 2, sm: 3 }, minHeight: '64px !important', gap: 1, position: 'relative' }}>
          <CustomerToolbarLeading
            showBottomNav={showBottomNav}
            isCustomer={isCustomer}
            showCompactNavTitle={showCompactNavTitle}
          />
          <Box sx={{ flexGrow: 1, minWidth: 0 }} />
          <Box sx={{ flexShrink: 0, display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                textAlign: 'right',
                display: showCompactNavTitle ? 'none' : { xs: 'none', lg: 'block' },
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                }}
              >
                {user?.firstName} {user?.lastName}
              </Typography>
            </Box>
            <IconButton
              onClick={handleMenuOpen}
              aria-label="User menu"
              sx={{
                ...sxObject(theme, premiumIconButtonTouchSx),
                p: 0,
                border: '2px solid',
                borderColor: 'divider',
                '&:hover': { borderColor: 'primary.main' },
              }}
            >
              <Avatar
                alt={user?.firstName || 'User'}
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: 'primary.main',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                {user?.firstName ? user.firstName[0] : 'U'}
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={open}
              onClose={handleMenuClose}
              disableScrollLock
              PaperProps={{
                elevation: 0,
                sx: (th) => ({
                  ...sxObject(th, premiumMenuPaperSx),
                  zIndex: th.zIndex.snackbar,
                  maxHeight: 'min(75dvh, 420px)',
                  overflowY: 'auto',
                }),
              }}
            >
              <MuiMenuItem
                onClick={() => {
                  handleMenuClose();
                  navigate(CUSTOMER_ROUTES.profile);
                }}
                sx={premiumMenuItemSx}
              >
                <AccountCircleIcon sx={{ mr: 1.5, fontSize: 20 }} />
                <Typography>Profile</Typography>
              </MuiMenuItem>
              <MuiMenuItem
                onClick={() => {
                  handleMenuClose();
                  navigate(CUSTOMER_ROUTES.preferences);
                }}
                sx={premiumMenuItemSx}
              >
                <SettingsIcon sx={{ mr: 1.5, fontSize: 20 }} />
                <Typography>Preferences</Typography>
              </MuiMenuItem>
              <MuiMenuItem
                onClick={() => {
                  handleMenuClose();
                  navigate(CUSTOMER_ROUTES.help);
                }}
                sx={premiumMenuItemSx}
              >
                <HelpIcon sx={{ mr: 1.5, fontSize: 20 }} />
                <Typography>Help</Typography>
              </MuiMenuItem>
              <Divider sx={{ my: 0.5 }} />
              <MuiMenuItem
                onClick={() => {
                  const p = getPrivacyPolicyLink();
                  openLegal(p.href, p.external);
                }}
                sx={premiumMenuItemSx}
              >
                <Typography sx={{ pl: 0.5 }}>Privacy Policy</Typography>
              </MuiMenuItem>
              <MuiMenuItem
                onClick={() => {
                  const t = getTermsOfServiceLink();
                  openLegal(t.href, t.external);
                }}
                sx={premiumMenuItemSx}
              >
                <Typography sx={{ pl: 0.5 }}>Terms of Service</Typography>
              </MuiMenuItem>
              <Divider sx={{ my: 0.5 }} />
              <MuiMenuItem onClick={handleLogout} sx={premiumMenuItemSx}>
                <LogoutIcon sx={{ mr: 1.5, fontSize: 20 }} />
                <Typography>Logout</Typography>
              </MuiMenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box sx={showBottomNav ? customerFixedNavBarGapSx : jampackFixedAppBarMainGapSx} aria-hidden />
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
            overflowX: 'hidden',
            mt: { xs: 0.5, sm: 2 },
            px: { xs: 2, sm: 3 },
            pb: showDockedBottomNav ? 1.5 : 4,
            width: '100%',
            minWidth: 0,
          }}
        >
          <CustomerScrollProviders scrollTargetId={APP_MAIN_CONTENT_ID}>
            <CustomerStackTransition />
          </CustomerScrollProviders>
        </Container>
        {showDockedBottomNav && <CustomerTabBar items={customerBottomNavItems} />}
      </Box>
    </Box>
  );
}

export function CustomerDashboardLayout() {
  return (
    <CustomerPageChromeProvider>
      <CustomerDashboardChrome />
    </CustomerPageChromeProvider>
  );
}

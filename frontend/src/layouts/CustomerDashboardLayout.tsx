import { Outlet, useNavigate, useLocation } from 'react-router-dom';
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
  Button,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import HelpIcon from '@mui/icons-material/Help';
import SettingsIcon from '@mui/icons-material/Settings';
import { BottomNav, isBottomNavItemActive } from '../components/BottomNav';
import { customerBottomNavItems } from '../config/menu.config';
import { CUSTOMER_ROUTES } from '../config/customerNav.paths';
import { getPrivacyPolicyLink, getTermsOfServiceLink } from '../config/legal.config';
import { brandColors } from '../theme';
import { clearSession, getStoredUser, isCustomerOrWalkInAccount } from '../utils/authSession';
import MenuIcon from '@mui/icons-material/Menu';
import { CustomerAppNavDrawer } from '../components/customer/CustomerAppNavDrawer';
import {
  customerPremiumAppBarActionIconSx,
  customerPremiumMobileAppBarSx,
} from '../theme/chargingPremiumShell';
import {
  JAMPACK_PAGE_BG,
  jampackAppBarSx,
  jampackAppBarSafeAreaTopSx,
  jampackFixedAppBarMainGapSx,
  jampackFixedAppBarZIndexSx,
} from '../theme/jampackShell';
import { premiumIconButtonTouchSx, premiumMenuPaperSx, sxObject } from '../styles/authShell';

export function CustomerDashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const showBottomNav = useMediaQuery(theme.breakpoints.down('lg'));
  const [user, setUser] = useState<any>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);
  const open = Boolean(anchorEl);
  const isCustomer = isCustomerOrWalkInAccount(user);

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
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        maxHeight: '100dvh',
        minHeight: '100dvh',
        overflow: 'hidden',
        bgcolor: JAMPACK_PAGE_BG,
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
          ...(showBottomNav && isCustomer
            ? customerPremiumMobileAppBarSx
            : { ...jampackAppBarSx, color: 'text.primary' }),
        }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 3 }, minHeight: '64px !important', gap: 1 }}>
          {showBottomNav && isCustomer && (
            <IconButton
              onClick={() => setNavDrawerOpen(true)}
              aria-label="Open app menu"
              aria-expanded={navDrawerOpen}
              aria-controls="customer-app-nav-drawer"
              edge="start"
              sx={customerPremiumAppBarActionIconSx}
            >
              <MenuIcon />
            </IconButton>
          )}
          {showBottomNav && isCustomer && (
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 700,
                letterSpacing: '-0.02em',
                fontSize: { xs: '1rem', sm: '1.0625rem' },
                color: 'common.white',
                minWidth: 0,
                flex: '0 1 auto',
                mr: 1,
              }}
            >
              CleanMotion
            </Typography>
          )}
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
            {customerBottomNavItems.map((item) => {
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
          <Box
            sx={{
              flexGrow: 1,
              display: { xs: 'flex', lg: 'none' },
              minWidth: 0,
            }}
          />
          <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: showBottomNav && isCustomer ? 'common.white' : 'text.primary',
                }}
              >
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: showBottomNav && isCustomer ? 'rgba(255,255,255,0.65)' : 'text.secondary',
                }}
              >
                {user?.email}
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
                sx={{ py: 1.5 }}
              >
                <AccountCircleIcon sx={{ mr: 1.5, fontSize: 20 }} />
                <Typography>Profile</Typography>
              </MuiMenuItem>
              <MuiMenuItem
                onClick={() => {
                  handleMenuClose();
                  navigate(CUSTOMER_ROUTES.preferences);
                }}
                sx={{ py: 1.5 }}
              >
                <SettingsIcon sx={{ mr: 1.5, fontSize: 20 }} />
                <Typography>Preferences</Typography>
              </MuiMenuItem>
              <MuiMenuItem
                onClick={() => {
                  handleMenuClose();
                  navigate(CUSTOMER_ROUTES.help);
                }}
                sx={{ py: 1.5 }}
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
                sx={{ py: 1.5 }}
              >
                <Typography sx={{ pl: 0.5 }}>Privacy Policy</Typography>
              </MuiMenuItem>
              <MuiMenuItem
                onClick={() => {
                  const t = getTermsOfServiceLink();
                  openLegal(t.href, t.external);
                }}
                sx={{ py: 1.5 }}
              >
                <Typography sx={{ pl: 0.5 }}>Terms of Service</Typography>
              </MuiMenuItem>
              <Divider sx={{ my: 0.5 }} />
              <MuiMenuItem onClick={handleLogout} sx={{ py: 1.5 }}>
                <LogoutIcon sx={{ mr: 1.5, fontSize: 20 }} />
                <Typography>Logout</Typography>
              </MuiMenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      {showBottomNav && isCustomer && (
        <CustomerAppNavDrawer open={navDrawerOpen} onClose={() => setNavDrawerOpen(false)} />
      )}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          bgcolor: JAMPACK_PAGE_BG,
        }}
      >
        <Box
          component="main"
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            overscrollBehaviorY: 'contain',
            overflowX: 'hidden',
            p: { xs: 2, sm: 3 },
            pb: showBottomNav ? { xs: 2, sm: 2 } : 3,
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
          }}
        >
          <Box sx={jampackFixedAppBarMainGapSx} aria-hidden />
          <Outlet />
        </Box>
        {showBottomNav && (
          <BottomNav items={customerBottomNavItems} accentColor={brandColors.primary} />
        )}
      </Box>
    </Box>
  );
}

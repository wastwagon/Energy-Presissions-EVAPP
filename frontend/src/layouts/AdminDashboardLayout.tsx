import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem as MuiMenuItem,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import { AdminMenu } from '../components/menus/AdminMenu';
import { BottomNav, type BottomNavItem } from '../components/BottomNav';
import { DrawerBrandHeader } from '../components/DrawerBrandHeader';
import { adminBottomNavItems, vendorBottomNavItems } from '../config/menu.config';
import { ADMIN_ROUTES } from '../config/staffNav.paths';
import { brandColors } from '../theme';
import { clearSession, getStoredUser } from '../utils/authSession';
import {
  JAMPACK_DRAWER_WIDTH,
  JAMPACK_PAGE_BG,
  jampackAppBarSafeAreaTopSx,
  jampackFixedAppBarZIndexSx,
  jampackDrawerPaper,
} from '../theme/jampackShell';
import { staffFrostedAppBarSx } from '../theme/staffChrome';
import { dashboardViewportColumnSx, dashboardScrollMainSx, fixedHeaderSpacerProps } from '../theme/dashboardShell';
import { premiumIconButtonTouchSx, premiumMenuItemSx, premiumMenuPaperSx, sxObject } from '../styles/authShell';
import { SkipToMain } from '../components/SkipToMain';
import { APP_MAIN_CONTENT_ID } from '../constants/a11y';
import { StaffPageChromeProvider, useStaffPageChrome } from '../contexts/StaffPageChromeContext';
import { StaffToolbarLeading } from '../components/staff/StaffToolbarLeading';
import { StaffScrollProviders } from '../components/staff/StaffScrollProviders';

const drawerWidth = JAMPACK_DRAWER_WIDTH;

function AdminDashboardChrome() {
  const location = useLocation();
  const navigate = useNavigate();
  const portalSubtitle = location.pathname.startsWith('/vendor') ? 'Vendor Portal' : 'Admin Portal';
  const theme = useTheme();
  const pageChrome = useStaffPageChrome();
  const showBottomNav = useMediaQuery(theme.breakpoints.down('sm'));
  const showDockedBottomNav = showBottomNav && !pageChrome?.navBack;
  const showCompactNavTitle = Boolean(
    showBottomNav && pageChrome?.showCompactNavTitle && pageChrome.pageTitle,
  );
  const [user, setUser] = useState<any>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const open = Boolean(anchorEl);

  const staffMobileNavItems = useMemo((): BottomNavItem[] => {
    const base = location.pathname.startsWith('/vendor') ? vendorBottomNavItems : adminBottomNavItems;
    return [
      ...base,
      {
        id: 'more-menu',
        label: 'More',
        icon: <MoreHorizIcon />,
        onSelect: () => setMobileOpen(true),
        ariaLabel: 'Open full navigation menu',
      },
    ];
  }, [location.pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

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

  const drawer = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
      }}
    >
      <DrawerBrandHeader subtitle={portalSubtitle} />
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <AdminMenu onItemClick={() => setMobileOpen(false)} />
      </Box>
    </Box>
  );

  const navDrawerId = 'admin-staff-nav-drawer';

  return (
    <Box sx={dashboardViewportColumnSx}>
      <SkipToMain />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          ...jampackFixedAppBarZIndexSx,
          ...jampackAppBarSafeAreaTopSx,
          ...staffFrostedAppBarSx,
          color: 'text.primary',
        }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 3 }, minHeight: '64px !important' }}>
          <StaffToolbarLeading
            navDrawerOpen={mobileOpen}
            onOpenNavDrawer={() => setMobileOpen(true)}
            navDrawerId={navDrawerId}
            showPhoneChrome={showBottomNav}
            showCompactNavTitle={showCompactNavTitle}
          />
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ flexGrow: 0, ml: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
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
                '&:hover': { borderColor: 'secondary.main' },
              }}
            >
              <Avatar
                alt={user?.firstName || 'Admin'}
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: 'secondary.main',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                {user?.firstName ? user.firstName[0] : 'A'}
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
                  navigate(ADMIN_ROUTES.dashboard);
                }}
                sx={premiumMenuItemSx}
              >
                <AccountCircleIcon sx={{ mr: 1.5, fontSize: 20 }} />
                <Typography>Dashboard</Typography>
              </MuiMenuItem>
              <MuiMenuItem onClick={handleLogout} sx={premiumMenuItemSx}>
                <LogoutIcon sx={{ mr: 1.5, fontSize: 20 }} />
                <Typography>Logout</Typography>
              </MuiMenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        <Box
          component="nav"
          sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
          aria-label="navigation"
        >
          <Drawer
            id={navDrawerId}
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { ...jampackDrawerPaper },
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': { ...jampackDrawerPaper },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: JAMPACK_PAGE_BG,
          }}
        >
          <Box
            component="main"
            id={APP_MAIN_CONTENT_ID}
            tabIndex={-1}
            sx={dashboardScrollMainSx({ headerVariant: 'appBar', reserveBottomNav: showDockedBottomNav })}
          >
            <StaffScrollProviders scrollTargetId={APP_MAIN_CONTENT_ID}>
              <Box {...fixedHeaderSpacerProps} />
              <Outlet />
            </StaffScrollProviders>
          </Box>
          {showDockedBottomNav && (
            <BottomNav items={staffMobileNavItems} accentColor={brandColors.secondary} />
          )}
        </Box>
      </Box>
    </Box>
  );
}

export function AdminDashboardLayout() {
  return (
    <StaffPageChromeProvider>
      <AdminDashboardChrome />
    </StaffPageChromeProvider>
  );
}


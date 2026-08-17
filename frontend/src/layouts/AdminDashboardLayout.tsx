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
  Button,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/Search';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { AdminMenu } from '../components/menus/AdminMenu';
import { BottomNav, type BottomNavItem } from '../components/BottomNav';
import { DrawerBrandHeader } from '../components/DrawerBrandHeader';
import { AppBadge } from '../components/ui/AppBadge';
import { adminBottomNavItems, vendorBottomNavItems } from '../config/menu.config';
import { ADMIN_ROUTES, SUPERADMIN_ROUTES, staffHelpPath } from '../config/staffNav.paths';
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
import { premiumIconButtonTouchSx, premiumMenuItemSx, premiumMenuPaperSx, compactOutlinedCtaSx, compactErrorContainedCtaSx, premiumDialogPaperSx, sxObject } from '../styles/authShell';
import { SkipToMain } from '../components/SkipToMain';
import { APP_MAIN_CONTENT_ID } from '../constants/a11y';
import { StaffPageChromeProvider, useStaffPageChrome } from '../contexts/StaffPageChromeContext';
import { StaffToolbarLeading } from '../components/staff/StaffToolbarLeading';
import { StaffScrollProviders } from '../components/staff/StaffScrollProviders';
import {
  StaffCommandPalette,
  staffModifierKeyLabel,
  useStaffCommandPalette,
  useStaffGoShortcuts,
} from '../components/staff/StaffCommandPalette';

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
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [vendorName, setVendorName] = useState<string | null>(null);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const open = Boolean(anchorEl);
  const commandPalette = useStaffCommandPalette();
  useStaffGoShortcuts('admin');
  const jumpShortcut = `${staffModifierKeyLabel()}K`;

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
    setIsImpersonating(localStorage.getItem('isImpersonating') === 'true');
    setVendorName(localStorage.getItem('currentVendorName'));
  }, [navigate]);

  const handleExitImpersonation = () => {
    setExitDialogOpen(true);
  };

  const confirmExitImpersonation = () => {
    localStorage.removeItem('currentVendorId');
    localStorage.removeItem('currentVendorName');
    localStorage.removeItem('isImpersonating');
    setExitDialogOpen(false);
    const accountType = getStoredUser()?.accountType;
    navigate(accountType === 'SuperAdmin' ? SUPERADMIN_ROUTES.vendors : ADMIN_ROUTES.dashboard);
  };

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
          <Box
            sx={{
              flexGrow: 1,
              display: 'flex',
              alignItems: 'center',
              minWidth: 0,
              px: 1,
            }}
          >
            {isImpersonating && vendorName ? (
              <AppBadge
                label={`Viewing: ${vendorName}`}
                tone="error"
                size="small"
                sx={{ fontWeight: 600, flexShrink: 1, maxWidth: { xs: '36vw', sm: 'none' } }}
              />
            ) : null}
          </Box>
          {isImpersonating ? (
            <Button
              variant="outlined"
              startIcon={<ExitToAppIcon />}
              onClick={handleExitImpersonation}
              sx={(th) => ({
                ...sxObject(th, compactOutlinedCtaSx),
                display: { xs: 'none', sm: 'inline-flex' },
                mr: 1,
                borderColor: alpha(th.palette.error.main, 0.45),
                color: 'error.main',
                '&:hover': {
                  borderColor: 'error.main',
                  bgcolor: alpha(th.palette.error.main, 0.06),
                },
              })}
            >
              Exit vendor view
            </Button>
          ) : null}
          <Box sx={{ flexGrow: 0, display: 'flex', alignItems: 'center', gap: 2 }}>
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
                '&:hover': { borderColor: 'primary.main' },
              }}
            >
              <Avatar
                alt={user?.firstName || 'Admin'}
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: 'primary.main',
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
              <MuiMenuItem
                onClick={() => {
                  handleMenuClose();
                  commandPalette.setOpen(true);
                }}
                sx={premiumMenuItemSx}
              >
                <SearchIcon sx={{ mr: 1.5, fontSize: 20 }} />
                <Typography sx={{ flex: 1 }}>Jump to</Typography>
                <Typography variant="caption" color="text.secondary">
                  {jumpShortcut}
                </Typography>
              </MuiMenuItem>
              <MuiMenuItem
                onClick={() => {
                  handleMenuClose();
                  navigate(staffHelpPath(location.pathname));
                }}
                sx={premiumMenuItemSx}
              >
                <HelpOutlineIcon sx={{ mr: 1.5, fontSize: 20 }} />
                <Typography>Operator guide</Typography>
              </MuiMenuItem>
              <MuiMenuItem
                onClick={() => {
                  handleMenuClose();
                  navigate(ADMIN_ROUTES.vendorSettings);
                }}
                sx={premiumMenuItemSx}
              >
                <SettingsIcon sx={{ mr: 1.5, fontSize: 20 }} />
                <Typography>Vendor settings</Typography>
              </MuiMenuItem>
              {isImpersonating ? (
                <MuiMenuItem
                  onClick={() => {
                    handleMenuClose();
                    handleExitImpersonation();
                  }}
                  sx={premiumMenuItemSx}
                >
                  <ExitToAppIcon sx={{ mr: 1.5, fontSize: 20 }} />
                  <Typography>Exit vendor view</Typography>
                </MuiMenuItem>
              ) : null}
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
            <Box {...fixedHeaderSpacerProps} />
            <StaffScrollProviders scrollTargetId={APP_MAIN_CONTENT_ID}>
              <Outlet />
            </StaffScrollProviders>
          </Box>
          {showDockedBottomNav && (
            <BottomNav items={staffMobileNavItems} accentColor={brandColors.secondary} />
          )}
        </Box>
      </Box>
      <Dialog
        open={exitDialogOpen}
        onClose={() => setExitDialogOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: (th) => sxObject(th, premiumDialogPaperSx) }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem' }}>Exit vendor view?</DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            You will leave this vendor context
            {user?.accountType === 'SuperAdmin' ? ' and return to All Vendors.' : '.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, flexWrap: 'wrap', gap: 1 }}>
          <Button onClick={() => setExitDialogOpen(false)} sx={(th) => sxObject(th, compactOutlinedCtaSx)}>
            Cancel
          </Button>
          <Button
            onClick={confirmExitImpersonation}
            variant="contained"
            disableElevation
            sx={(th) => sxObject(th, compactErrorContainedCtaSx)}
          >
            Exit
          </Button>
        </DialogActions>
      </Dialog>
      <StaffCommandPalette
        open={commandPalette.open}
        onClose={() => commandPalette.setOpen(false)}
        variant="admin"
      />
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


import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
  Chip,
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
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { SuperAdminMenu } from '../components/menus/SuperAdminMenu';
import { BottomNav } from '../components/BottomNav';
import { DrawerBrandHeader } from '../components/DrawerBrandHeader';
import { superAdminBottomNavItems } from '../config/menu.config';
import { SUPERADMIN_ROUTES } from '../config/staffNav.paths';
import { brandColors } from '../theme';
import { clearSession, getStoredUser } from '../utils/authSession';
import {
  JAMPACK_DRAWER_WIDTH,
  JAMPACK_PAGE_BG,
  jampackAppBarSx,
  jampackAppBarSafeAreaTopSx,
  jampackFixedAppBarMainGapSx,
  jampackFixedAppBarZIndexSx,
  jampackDrawerPaper,
} from '../theme/jampackShell';
import {
  compactErrorContainedCtaSx,
  compactOutlinedCtaSx,
  premiumDialogPaperSx,
  premiumIconButtonTouchSx,
  premiumMenuPaperSx,
  sxObject,
} from '../styles/authShell';

const drawerWidth = JAMPACK_DRAWER_WIDTH;

export function SuperAdminDashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const showBottomNav = useMediaQuery(theme.breakpoints.down('sm'));
  const [user, setUser] = useState<any>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [vendorName, setVendorName] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const open = Boolean(anchorEl);

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

    // Check if impersonating
    const impersonating = localStorage.getItem('isImpersonating') === 'true';
    const vendor = localStorage.getItem('currentVendorName');
    setIsImpersonating(impersonating);
    setVendorName(vendor);
  }, [navigate]);

  const handleExitImpersonation = () => {
    setExitDialogOpen(true);
  };

  const confirmExitImpersonation = () => {
    localStorage.removeItem('currentVendorId');
    localStorage.removeItem('currentVendorName');
    localStorage.removeItem('isImpersonating');
    setExitDialogOpen(false);
    navigate('/superadmin/vendors');
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
      <DrawerBrandHeader subtitle="Super Admin Portal" />
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <SuperAdminMenu />
      </Box>
    </Box>
  );

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
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          ...jampackFixedAppBarZIndexSx,
          ...jampackAppBarSafeAreaTopSx,
          ...jampackAppBarSx,
        }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 3 }, minHeight: '64px !important' }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{
              ...sxObject(theme, premiumIconButtonTouchSx),
              mr: 2,
              display: { sm: 'none' },
              color: 'text.primary',
            }}
            aria-label="open menu"
          >
            <MenuIcon />
          </IconButton>
          <Box
            sx={{
              flexGrow: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              minWidth: 0,
            }}
          >
            {isImpersonating && vendorName && (
              <Chip
                label={`Viewing: ${vendorName}`}
                color="error"
                size="small"
                sx={{ fontWeight: 600, flexShrink: 0, maxWidth: { xs: '40vw', sm: 'none' } }}
              />
            )}
          </Box>
          {isImpersonating && (
            <Button
              variant="outlined"
              startIcon={<ExitToAppIcon />}
              onClick={handleExitImpersonation}
              sx={(th) => ({
                ...sxObject(th, compactOutlinedCtaSx),
                mr: 2,
                borderColor: alpha(th.palette.error.main, 0.45),
                color: 'error.main',
                '&:hover': {
                  borderColor: 'error.main',
                  bgcolor: alpha(th.palette.error.main, 0.06),
                },
              })}
            >
              Exit Vendor View
            </Button>
          )}
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
                '&:hover': { borderColor: 'error.main' },
              }}
            >
              <Avatar
                alt={user?.firstName || 'SuperAdmin'}
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: 'error.main',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                {user?.firstName ? user.firstName[0] : 'S'}
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
                  navigate(SUPERADMIN_ROUTES.dashboard);
                }}
                sx={{ py: 1.5 }}
              >
                <AccountCircleIcon sx={{ mr: 1.5, fontSize: 20 }} />
                <Typography>Dashboard</Typography>
              </MuiMenuItem>
              <MuiMenuItem onClick={handleLogout} sx={{ py: 1.5 }}>
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
            }}
          >
            <Box sx={jampackFixedAppBarMainGapSx} aria-hidden />
            <Outlet />
          </Box>
          {showBottomNav && (
            <BottomNav items={superAdminBottomNavItems} accentColor={brandColors.primary} />
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
            You will leave this vendor context and return to the Super Admin vendors page.
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
    </Box>
  );
}


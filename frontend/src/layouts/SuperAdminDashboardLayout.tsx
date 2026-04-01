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
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { SuperAdminMenu } from '../components/menus/SuperAdminMenu';
import { BottomNav } from '../components/BottomNav';
import { DrawerBrandHeader } from '../components/DrawerBrandHeader';
import { superAdminBottomNavItems } from '../config/menu.config';
import { brandColors } from '../theme';
import { clearSession, getStoredUser } from '../utils/authSession';
import {
  JAMPACK_DRAWER_WIDTH,
  JAMPACK_PAGE_BG,
  jampackAppBarSx,
  jampackDrawerPaper,
} from '../theme/jampackShell';

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
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: JAMPACK_PAGE_BG }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          zIndex: (t) => t.zIndex.drawer + 1,
          ...jampackAppBarSx,
        }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 3 }, minHeight: '64px !important' }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{
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
              color="error"
              startIcon={<ExitToAppIcon />}
              onClick={handleExitImpersonation}
              sx={{ mr: 2, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
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
              sx={{ mt: '50px' }}
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={open}
              onClose={handleMenuClose}
              PaperProps={{
                elevation: 8,
                sx: {
                  mt: 1.5,
                  minWidth: 200,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                },
              }}
            >
              <MuiMenuItem
                onClick={() => {
                  handleMenuClose();
                  navigate('/superadmin/dashboard');
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
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          bgcolor: JAMPACK_PAGE_BG,
          pb: showBottomNav ? 10 : 3,
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
      {showBottomNav && (
        <BottomNav items={superAdminBottomNavItems} accentColor={brandColors.primary} />
      )}
      <Dialog open={exitDialogOpen} onClose={() => setExitDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Exit Vendor View?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You will leave this vendor context and return to the Super Admin vendors page.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExitDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmExitImpersonation} color="error" variant="contained">
            Exit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


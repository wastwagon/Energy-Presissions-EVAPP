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
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { SuperAdminMenu } from '../components/menus/SuperAdminMenu';
import { BottomNav } from '../components/BottomNav';
import { superAdminBottomNavItems } from '../config/menu.config';

const drawerWidth = 280;

export function SuperAdminDashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const showBottomNav = useMediaQuery(theme.breakpoints.down('lg'));
  const [user, setUser] = useState<any>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [vendorName, setVendorName] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const open = Boolean(anchorEl);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        
        // Redirect if not SuperAdmin
        if (userData.accountType !== 'SuperAdmin') {
          if (userData.accountType === 'Admin') {
            window.location.href = '/admin/dashboard';
          } else if (userData.accountType === 'Customer') {
            window.location.href = '/user/dashboard';
          } else {
            window.location.href = '/login/super-admin';
          }
        }
      } catch (e) {
        window.location.href = '/login/super-admin';
      }
    } else {
      window.location.href = '/login/super-admin';
    }

    // Check if impersonating
    const impersonating = localStorage.getItem('isImpersonating') === 'true';
    const vendor = localStorage.getItem('currentVendorName');
    setIsImpersonating(impersonating);
    setVendorName(vendor);
  }, []);

  const handleExitImpersonation = () => {
      if (window.confirm('Exit vendor view and return to Super Admin dashboard?')) {
        localStorage.removeItem('currentVendorId');
        localStorage.removeItem('currentVendorName');
        localStorage.removeItem('isImpersonating');
        window.location.href = '/superadmin/vendors';
      }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('currentVendorId');
    localStorage.removeItem('currentVendorName');
    localStorage.removeItem('isImpersonating');
    navigate('/login/super-admin');
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
        background: 'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)',
      }}
    >
      <Box
        sx={{
          p: 3.5,
          background: 'linear-gradient(135deg, #062540 0%, #0A3D62 100%)',
          color: 'white',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <img 
            src="/logo.jpeg" 
            alt="Clean Motion Ghana" 
            style={{ height: '32px', objectFit: 'contain' }}
          />
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                mb: 0.5,
                fontSize: '1.375rem',
                letterSpacing: '-0.02em',
              }}
            >
              Clean Motion Ghana
            </Typography>
            <Typography
              variant="caption"
              sx={{
                opacity: 0.95,
                fontSize: '0.75rem',
                letterSpacing: '0.02em',
                fontWeight: 500,
              }}
            >
              Super Admin Portal
            </Typography>
          </Box>
        </Box>
      </Box>
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <SuperAdminMenu />
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: 'white',
          borderBottom: '1px solid',
          borderColor: 'divider',
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
              color: '#1e293b',
            }}
            aria-label="open menu"
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 600,
              color: '#1e293b',
              fontSize: '1.125rem',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            Super Admin Dashboard
            {isImpersonating && vendorName && (
              <Chip
                label={`Viewing: ${vendorName}`}
                color="error"
                size="small"
                sx={{ fontWeight: 600 }}
              />
            )}
          </Typography>
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
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
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
                <Typography>Profile</Typography>
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
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid',
              borderColor: 'rgba(0, 0, 0, 0.08)',
              bgcolor: '#fafafa',
              boxShadow: '2px 0 8px rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid',
              borderColor: 'rgba(0, 0, 0, 0.08)',
              bgcolor: '#fafafa',
              boxShadow: '2px 0 8px rgba(0, 0, 0, 0.04)',
            },
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
          bgcolor: '#f8fafc',
          pb: showBottomNav ? 10 : 3,
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
      {showBottomNav && (
        <BottomNav items={superAdminBottomNavItems} accentColor="#062540" />
      )}
    </Box>
  );
}


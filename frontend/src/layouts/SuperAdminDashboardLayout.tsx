import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Container,
  Avatar,
  Menu,
  MenuItem as MuiMenuItem,
  IconButton,
  Divider,
  Chip,
  Button,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EvStationIcon from '@mui/icons-material/EvStation';
import HistoryIcon from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';
import BusinessIcon from '@mui/icons-material/Business';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

const drawerWidth = 260;

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  divider?: boolean;
}

export function SuperAdminDashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [tenantName, setTenantName] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

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
    const tenant = localStorage.getItem('currentTenantName');
    setIsImpersonating(impersonating);
    setTenantName(tenant);
  }, []);

  const handleExitImpersonation = () => {
      if (window.confirm('Exit tenant view and return to Super Admin dashboard?')) {
        localStorage.removeItem('currentTenantId');
        localStorage.removeItem('currentTenantName');
        localStorage.removeItem('isImpersonating');
        window.location.href = '/superadmin/tenants';
      }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('currentTenantId');
    localStorage.removeItem('currentTenantName');
    localStorage.removeItem('isImpersonating');
    navigate('/login/super-admin');
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Super Admin menu items - everything (SuperAdmin-specific routes)
  const menuItems: MenuItem[] = [
    { text: 'My Dashboard', icon: <DashboardIcon />, path: '/superadmin/dashboard' },
    { text: 'Operations', icon: <DashboardIcon />, path: '/superadmin/ops' },
    { text: 'Sessions', icon: <HistoryIcon />, path: '/superadmin/ops/sessions' },
    { text: 'Devices', icon: <EvStationIcon />, path: '/superadmin/ops/devices' },
    { text: 'Tenant Settings', icon: <BusinessIcon />, path: '/superadmin/tenant' },
    { divider: true },
    { text: 'Super Admin', icon: <SettingsIcon />, path: '/superadmin/settings' },
    { text: 'Wallets', icon: <AccountBalanceWalletIcon />, path: '/superadmin/wallets' },
    { text: 'Tenants', icon: <BusinessIcon />, path: '/superadmin/tenants' },
  ];

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          p: 3,
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
          EV Charging
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.9 }}>
          Super Admin Portal
        </Typography>
      </Box>
      <List sx={{ flex: 1, pt: 2, px: 1.5 }}>
        {menuItems.map((item, index) => (
          item.divider ? (
            <Divider key={`divider-${index}`} sx={{ my: 1.5, borderColor: 'divider' }} />
          ) : (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={location.pathname === item.path || location.pathname.startsWith(item.path + '/')}
                sx={{
                  borderRadius: 2,
                  py: 1.25,
                  px: 2,
                  '&.Mui-selected': {
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      opacity: 0.9,
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: location.pathname === item.path || location.pathname.startsWith(item.path + '/') ? 'white' : 'inherit',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: location.pathname === item.path || location.pathname.startsWith(item.path + '/') ? 600 : 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          )
        ))}
      </List>
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
        <Toolbar sx={{ px: 3, minHeight: '64px !important' }}>
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
            {isImpersonating && tenantName && (
              <Chip
                label={`Viewing: ${tenantName}`}
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
              Exit Tenant View
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
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid',
              borderColor: 'divider',
              bgcolor: 'white',
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
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}


import { Outlet, useNavigate } from 'react-router-dom';
import { Container, AppBar, Toolbar, Typography, Box, Button, IconButton, useTheme, useMediaQuery } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useEffect, useState } from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { BottomNav } from '../components/BottomNav';
import { mainLayoutBottomNavItems } from '../config/menu.config';
import { brandColors } from '../theme';

export function MainLayout() {
  const navigate = useNavigate();
  const theme = useTheme();
  const showBottomNav = useMediaQuery(theme.breakpoints.down('lg'));
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (e) {
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('currentVendorId');
    localStorage.removeItem('currentVendorName');
    localStorage.removeItem('isImpersonating');
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar sx={{ flexWrap: 'wrap', gap: 1, py: { xs: 1, sm: 0 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexGrow: 1, minWidth: 0 }}>
            <img 
              src="/logo.jpeg" 
              alt="Clean Motion Ghana" 
              style={{ height: 'clamp(32px, 8vw, 40px)', objectFit: 'contain' }}
            />
            <Typography variant="h6" component="div" noWrap sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Clean Motion Ghana
            </Typography>
          </Box>
          {isAuthenticated && user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
              <Typography variant="body2" noWrap sx={{ maxWidth: { xs: 100, sm: 180 }, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name || user.email}
              </Typography>
              <IconButton color="inherit" onClick={handleLogout} title="Logout" aria-label="Logout">
                <LogoutIcon />
              </IconButton>
            </Box>
          )}
          {!isAuthenticated && (
            <Button color="inherit" onClick={() => navigate('/login')}>
              Login
            </Button>
          )}
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 4 }, mb: showBottomNav ? 10 : 4, px: { xs: 2, sm: 3 }, flex: 1 }}>
        <Outlet />
      </Container>
      {showBottomNav && (
        <BottomNav
          items={
            isAuthenticated
              ? [
                  ...mainLayoutBottomNavItems.slice(0, 2),
                  { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, path: '/user/dashboard' },
                ]
              : mainLayoutBottomNavItems
          }
          accentColor={brandColors.primary}
        />
      )}
    </Box>
  );
}




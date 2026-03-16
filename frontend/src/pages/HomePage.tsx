import { Box, Typography, Paper, Grid, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import EvStationIcon from '@mui/icons-material/EvStation';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsIcon from '@mui/icons-material/Settings';

export function HomePage() {
  const navigate = useNavigate();
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

  const handleFindStations = () => {
    if (!isAuthenticated) {
      navigate('/login/user');
      return;
    }
    navigate('/stations');
  };

  const handleOperations = () => {
    if (!isAuthenticated) {
      navigate('/login/admin');
      return;
    }
    
    // Redirect based on user type
    if (user?.accountType === 'SuperAdmin') {
      navigate('/superadmin/ops');
    } else if (user?.accountType === 'Admin') {
      navigate('/admin/ops');
    } else {
      // Customer users don't have access to operations
      navigate('/user/dashboard');
    }
  };

  const handleAdmin = () => {
    if (!isAuthenticated) {
      navigate('/login/admin');
      return;
    }
    
    // Redirect based on user type
    if (user?.accountType === 'SuperAdmin') {
      navigate('/superadmin/dashboard');
    } else if (user?.accountType === 'Admin') {
      navigate('/admin/dashboard');
    } else {
      // Customer users don't have access to admin
      navigate('/user/dashboard');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'center', md: 'flex-start' }, gap: { xs: 2, md: 3 }, mb: 3 }}>
        <img 
          src="/newlog.png" 
          alt="Clean Motion Ghana" 
          style={{ height: 'clamp(48px, 12vw, 80px)', objectFit: 'contain' }}
        />
        <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' } }}>
            Welcome to Clean Motion Ghana
          </Typography>
          <Typography variant="h6" color="text.secondary" paragraph sx={{ fontSize: { xs: '0.95rem', md: '1rem' } }}>
            Manage your EV charging operations and billing
          </Typography>
        </Box>
      </Box>
      
      {!isAuthenticated && (
        <Box sx={{ mb: 3, p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
          <Typography variant="body1" color="info.dark">
            Please login to access all services
          </Typography>
        </Box>
      )}

      {isAuthenticated && (
        <Box sx={{ mb: 3, p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
          <Typography variant="body1" color="success.dark">
            Welcome back, {user?.email || 'User'}! 
            <Button 
              variant="text" 
              onClick={() => {
                if (user?.accountType === 'SuperAdmin') {
                  navigate('/superadmin/dashboard');
                } else if (user?.accountType === 'Admin') {
                  navigate('/admin/dashboard');
                } else {
                  navigate('/user/dashboard');
                }
              }}
              sx={{ ml: 1, textTransform: 'none' }}
            >
              Go to My Dashboard →
            </Button>
          </Typography>
        </Box>
      )}

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }}>
            <EvStationIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Find Stations
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Locate nearby charging stations and start charging sessions
            </Typography>
            <Button 
              onClick={handleFindStations} 
              variant="contained"
              fullWidth
            >
              {isAuthenticated ? 'View Stations' : 'Login to View Stations'}
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }}>
            <DashboardIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Operations
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Monitor and manage charging operations, devices, and active sessions
            </Typography>
            <Button 
              onClick={handleOperations} 
              variant="contained"
              fullWidth
              disabled={isAuthenticated && user?.accountType === 'Customer'}
            >
              {!isAuthenticated 
                ? 'Login to Access Operations' 
                : user?.accountType === 'Customer'
                ? 'Operations (Admin Only)'
                : 'Operations Dashboard'}
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }}>
            <SettingsIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Admin
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              System administration, user management, and configuration
            </Typography>
            <Button 
              onClick={handleAdmin} 
              variant="contained"
              fullWidth
              disabled={isAuthenticated && user?.accountType === 'Customer'}
            >
              {!isAuthenticated 
                ? 'Login to Access Admin' 
                : user?.accountType === 'Customer'
                ? 'Admin (Admin Only)'
                : 'Admin Dashboard'}
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}




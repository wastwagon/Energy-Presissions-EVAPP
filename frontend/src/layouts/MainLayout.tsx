import { Outlet, useNavigate } from 'react-router-dom';
import { Container, AppBar, Toolbar, Typography, Box, Button, IconButton, useTheme, useMediaQuery } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useEffect, useState } from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { BottomNav } from '../components/BottomNav';
import { mainLayoutBottomNavItems } from '../config/menu.config';
import { brandColors } from '../theme';
import { jampackAppBarSx } from '../theme/jampackShell';
import { premiumIconButtonTouchSx, sxObject } from '../styles/authShell';
import { LOGO_PUBLIC_URL } from '../config/branding';
import { clearSession, getDashboardPathForAccountType, getStoredUser, hasValidSession } from '../utils/authSession';

export function MainLayout() {
  const navigate = useNavigate();
  const theme = useTheme();
  const showBottomNav = useMediaQuery(theme.breakpoints.down('lg'));
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const userData = getStoredUser();
    const authenticated = hasValidSession();
    setUser(userData);
    setIsAuthenticated(authenticated);
  }, []);

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  const getDashboardPath = () => {
    return getDashboardPathForAccountType(user?.accountType);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          ...jampackAppBarSx,
          color: 'text.primary',
        }}
      >
        <Toolbar
          sx={{
            flexWrap: 'wrap',
            gap: 1,
            py: { xs: 1, sm: 0.75 },
            px: { xs: 2, sm: 3 },
            minHeight: { xs: 60, sm: 68 },
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexGrow: 1, minWidth: 0 }}>
            <Box
              component="img"
              src={LOGO_PUBLIC_URL}
              alt="Clean Motion Ghana"
              draggable={false}
              sx={{
                height: { xs: 'clamp(48px, 14vw, 58px)', sm: 56, md: 60 },
                width: 'auto',
                maxWidth: { xs: 'min(280px, 72vw)', sm: 320 },
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </Box>
          {isAuthenticated && user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                noWrap
                sx={{
                  maxWidth: { xs: 100, sm: 180 },
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: 'text.primary',
                }}
              >
                {user.name || user.email}
              </Typography>
              <IconButton
                color="inherit"
                onClick={handleLogout}
                title="Logout"
                aria-label="Logout"
                sx={{
                  ...sxObject(theme, premiumIconButtonTouchSx),
                  color: 'text.primary',
                }}
              >
                <LogoutIcon />
              </IconButton>
            </Box>
          )}
          {!isAuthenticated && (
            <Button color="primary" variant="text" onClick={() => navigate('/login')}>
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
                  { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, path: getDashboardPath() },
                ]
              : mainLayoutBottomNavItems
          }
          accentColor={brandColors.primary}
        />
      )}
    </Box>
  );
}




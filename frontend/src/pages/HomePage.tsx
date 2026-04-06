import { Box, Typography, Paper, Grid, Button } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import EvStationIcon from '@mui/icons-material/EvStation';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  getDashboardPathForAccountType,
  getStoredUser,
  hasValidSession,
} from '../utils/authSession';
import { LOGO_PUBLIC_URL } from '../config/branding';
import { premiumFeatureCardSx, dashboardPageTitleSx, dashboardPageSubtitleSx } from '../theme/jampackShell';
import { compactContainedCtaSx, sxObject } from '../styles/authShell';

function FeatureIcon({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        width: { xs: 56, sm: 64 },
        height: { xs: 56, sm: 64 },
        mx: 'auto',
        mb: 2,
        borderRadius: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
        border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
      }}
    >
      {children}
    </Box>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const accountType = user?.accountType;
  const isAdminLike = accountType === 'Admin' || accountType === 'SuperAdmin';

  useEffect(() => {
    setUser(getStoredUser());
    setIsAuthenticated(hasValidSession());
  }, []);

  const handleFindStations = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate('/stations');
  };

  const handleOperations = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (accountType === 'SuperAdmin') {
      navigate('/superadmin/ops');
      return;
    }
    if (accountType === 'Admin') {
      navigate('/admin/ops');
      return;
    }
    navigate(getDashboardPathForAccountType(accountType));
  };

  const handleAdmin = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    navigate(getDashboardPathForAccountType(accountType));
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'center', md: 'flex-start' },
          gap: { xs: 2, md: 3 },
          mb: { xs: 2.5, sm: 3 },
        }}
      >
        <Box
          component="img"
          src={LOGO_PUBLIC_URL}
          alt=""
          draggable={false}
          sx={{
            height: { xs: 'clamp(56px, 16vw, 80px)', sm: 88 },
            width: 'auto',
            maxWidth: 'min(280px, 88vw)',
            objectFit: 'contain',
            display: 'block',
          }}
        />
        <Box sx={{ textAlign: { xs: 'center', md: 'left' }, minWidth: 0 }}>
          <Typography
            component="h1"
            variant="h6"
            sx={{
              ...dashboardPageTitleSx,
              fontSize: { xs: '1.25rem', sm: '1.375rem', md: '1.5rem' },
              fontWeight: 700,
              letterSpacing: '-0.03em',
            }}
          >
            Welcome to Clean Motion Ghana
          </Typography>
          <Typography variant="body2" sx={{ ...dashboardPageSubtitleSx, mt: 0.5, mx: { xs: 'auto', md: 0 } }}>
            Manage your EV charging operations and billing
          </Typography>
        </Box>
      </Box>

      {!isAuthenticated && (
        <Box
          sx={{
            mb: 3,
            p: { xs: 2, sm: 2.25 },
            borderRadius: 3,
            bgcolor: (theme) => alpha(theme.palette.info.main, 0.08),
            border: (theme) => `1px solid ${alpha(theme.palette.info.main, 0.22)}`,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'info.dark', lineHeight: 1.5 }}>
            Sign in to find stations, charge, and manage your wallet.
          </Typography>
        </Box>
      )}

      {isAuthenticated && (
        <Box
          sx={{
            mb: 3,
            p: { xs: 2, sm: 2.25 },
            borderRadius: 3,
            bgcolor: (theme) => alpha(theme.palette.success.main, 0.08),
            border: (theme) => `1px solid ${alpha(theme.palette.success.main, 0.22)}`,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            gap: 1.5,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.dark', lineHeight: 1.5 }}>
            Welcome back{user?.email ? `, ${user.email}` : ''}.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="medium"
            disableElevation
            onClick={() => navigate(getDashboardPathForAccountType(accountType))}
            sx={(th) => ({
              ...sxObject(th, compactContainedCtaSx),
              minWidth: { sm: 200 },
              width: { xs: '100%', sm: 'auto' },
            })}
          >
            Open my dashboard
          </Button>
        </Box>
      )}

      <Grid container spacing={{ xs: 2, sm: 2.5 }} sx={{ mt: { xs: 0.5, sm: 1 } }}>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={premiumFeatureCardSx}>
            <FeatureIcon>
              <EvStationIcon sx={{ fontSize: 30, color: 'primary.main' }} />
            </FeatureIcon>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: '-0.02em', mb: 1 }}>
              Find stations
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flex: 1, lineHeight: 1.55, px: 0.5 }}>
              Locate chargers nearby and start a session from your phone.
            </Typography>
            <Button
              onClick={handleFindStations}
              variant="contained"
              color="primary"
              fullWidth
              size="medium"
              disableElevation
              sx={(th) => sxObject(th, compactContainedCtaSx)}
            >
              {isAuthenticated ? 'View stations' : 'Sign in to view stations'}
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={premiumFeatureCardSx}>
            <FeatureIcon>
              <DashboardIcon sx={{ fontSize: 30, color: 'primary.main' }} />
            </FeatureIcon>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: '-0.02em', mb: 1 }}>
              Operations
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flex: 1, lineHeight: 1.55, px: 0.5 }}>
              Monitor devices, sessions, and live activity for your network.
            </Typography>
            <Button
              onClick={handleOperations}
              variant="contained"
              color="primary"
              fullWidth
              size="medium"
              disableElevation
              disabled={isAuthenticated && !isAdminLike}
              sx={(th) => sxObject(th, compactContainedCtaSx)}
            >
              {!isAuthenticated
                ? 'Sign in for operations'
                : !isAdminLike
                  ? 'Admin access only'
                  : 'Operations dashboard'}
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={premiumFeatureCardSx}>
            <FeatureIcon>
              <SettingsIcon sx={{ fontSize: 30, color: 'primary.main' }} />
            </FeatureIcon>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: '-0.02em', mb: 1 }}>
              Administration
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flex: 1, lineHeight: 1.55, px: 0.5 }}>
              Configure tariffs, users, and vendor settings from the admin console.
            </Typography>
            <Button
              onClick={handleAdmin}
              variant="contained"
              color="primary"
              fullWidth
              size="medium"
              disableElevation
              disabled={isAuthenticated && !isAdminLike}
              sx={(th) => sxObject(th, compactContainedCtaSx)}
            >
              {!isAuthenticated
                ? 'Sign in for admin'
                : !isAdminLike
                  ? 'Admin access only'
                  : 'Admin dashboard'}
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

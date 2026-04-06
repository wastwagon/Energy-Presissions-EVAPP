import { Box, Typography, Paper, Grid, Button } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import EvStationIcon from '@mui/icons-material/EvStation';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import {
  getDashboardPathForAccountType,
  getStoredUser,
  hasValidSession,
} from '../utils/authSession';
import { CustomerQuickActions } from '../components/dashboard/CustomerQuickActions';
import { CUSTOMER_ROUTES } from '../config/customerNav.paths';
import { ADMIN_ROUTES, SUPERADMIN_ROUTES } from '../config/staffNav.paths';
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

  const goLogin = () => navigate('/login');

  const handleFindStations = () => {
    if (!isAuthenticated) {
      goLogin();
      return;
    }
    navigate(CUSTOMER_ROUTES.stations);
  };

  const handleWallet = () => {
    if (!isAuthenticated) {
      goLogin();
      return;
    }
    navigate(CUSTOMER_ROUTES.wallet);
  };

  const handleFavorites = () => {
    if (!isAuthenticated) {
      goLogin();
      return;
    }
    navigate(CUSTOMER_ROUTES.favorites);
  };

  const handleOperations = () => {
    if (!isAuthenticated) {
      goLogin();
      return;
    }

    if (accountType === 'SuperAdmin') {
      navigate('/superadmin/ops');
      return;
    }
    if (accountType === 'Admin') {
      navigate(ADMIN_ROUTES.ops);
      return;
    }
    navigate(getDashboardPathForAccountType(accountType));
  };

  const handleAdmin = () => {
    if (!isAuthenticated) {
      goLogin();
      return;
    }

    navigate(getDashboardPathForAccountType(accountType));
  };

  const showCustomerQuickLinks = isAuthenticated && !isAdminLike;

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <Box sx={{ mb: { xs: 2.5, sm: 3 }, textAlign: 'left' }}>
        <Typography
          component="h1"
          variant="h6"
          sx={{
            ...dashboardPageTitleSx,
            fontSize: { xs: '1.25rem', sm: '1.375rem', md: '1.5rem' },
            fontWeight: 700,
            letterSpacing: '-0.03em',
            textAlign: 'left',
          }}
        >
          Welcome to Clean Motion Ghana
        </Typography>
        <Typography variant="body2" sx={{ ...dashboardPageSubtitleSx, mt: 0.5, textAlign: 'left', mx: 0 }}>
          Find stations, charge your EV, and manage your wallet.
        </Typography>
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

      {showCustomerQuickLinks && (
        <CustomerQuickActions preset="dashboard" sectionLabel="Quick links" />
      )}

      <Grid container spacing={{ xs: 2, sm: 2.5 }} sx={{ mt: { xs: 0.5, sm: 1 } }}>
        {isAdminLike ? (
          <>
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
                  View stations
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
                  sx={(th) => sxObject(th, compactContainedCtaSx)}
                >
                  Operations dashboard
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
                  sx={(th) => sxObject(th, compactContainedCtaSx)}
                >
                  Admin dashboard
                </Button>
              </Paper>
            </Grid>
          </>
        ) : (
          <>
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
                  <AccountBalanceWalletIcon sx={{ fontSize: 30, color: 'primary.main' }} />
                </FeatureIcon>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: '-0.02em', mb: 1 }}>
                  Wallet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flex: 1, lineHeight: 1.55, px: 0.5 }}>
                  Check your balance, top up, and pay for charging sessions.
                </Typography>
                <Button
                  onClick={handleWallet}
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="medium"
                  disableElevation
                  sx={(th) => sxObject(th, compactContainedCtaSx)}
                >
                  {isAuthenticated ? 'Open wallet' : 'Sign in for wallet'}
                </Button>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={premiumFeatureCardSx}>
                <FeatureIcon>
                  <FavoriteBorderIcon sx={{ fontSize: 30, color: 'primary.main' }} />
                </FeatureIcon>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: '-0.02em', mb: 1 }}>
                  Favorite stations
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flex: 1, lineHeight: 1.55, px: 0.5 }}>
                  Save the chargers you use often and open them with one tap.
                </Typography>
                <Button
                  onClick={handleFavorites}
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="medium"
                  disableElevation
                  sx={(th) => sxObject(th, compactContainedCtaSx)}
                >
                  {isAuthenticated ? 'View favorites' : 'Sign in for favorites'}
                </Button>
              </Paper>
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
}

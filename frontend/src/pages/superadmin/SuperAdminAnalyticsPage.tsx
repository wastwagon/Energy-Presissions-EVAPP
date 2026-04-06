import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RefreshIcon from '@mui/icons-material/Refresh';
import { dashboardApi, DashboardStats } from '../../services/dashboardApi';
import {
  dashboardPageTitleSx,
  dashboardPageSubtitleSx,
  premiumPanelCardSx,
} from '../../theme/jampackShell';
import { compactOutlinedCtaSx, sxObject } from '../../styles/authShell';
import { websocketService } from '../../services/websocket';
import { formatCurrency } from '../../utils/formatters';

export function SuperAdminAnalyticsPage() {
  const [searchParams] = useSearchParams();
  const vendorScope = searchParams.get('scope') === 'vendor';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    loadAnalytics();

    const unsubscribeTransactionStarted = websocketService.on('transactionStarted', () => {
      loadAnalytics();
    });

    const unsubscribeTransactionStopped = websocketService.on('transactionStopped', () => {
      loadAnalytics();
    });

    const unsubscribeDashboardStats = websocketService.on('dashboardStatsUpdate', () => {
      loadAnalytics();
    });

    return () => {
      unsubscribeTransactionStarted();
      unsubscribeTransactionStopped();
      unsubscribeDashboardStats();
    };
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardApi.getStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
        <Box sx={{ minWidth: 0, flex: '1 1 220px' }}>
          <Typography component="h1" variant="h6" sx={dashboardPageTitleSx}>
            {vendorScope ? 'Vendor analytics' : 'System Analytics'}
          </Typography>
          <Typography variant="body2" sx={dashboardPageSubtitleSx}>
            {vendorScope
              ? 'Cross-vendor benchmarks and network health (same data scope as system view; vendor-specific breakdowns coming soon).'
              : 'Comprehensive analytics and insights across all vendors'}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadAnalytics}
          disabled={loading}
          sx={(th) => ({
            ...sxObject(th, compactOutlinedCtaSx),
            width: { xs: '100%', sm: 'auto' },
          })}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {stats && (
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={premiumPanelCardSx}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUpIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="body2" color="text.secondary">
                  Total Revenue
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                {formatCurrency(stats.overview?.totalRevenue || 0)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={premiumPanelCardSx}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Sessions
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {stats.overview?.totalTransactions || 0}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={premiumPanelCardSx}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Active Sessions
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                {stats.overview?.activeSessions || 0}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={premiumPanelCardSx}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Users
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {stats.overview?.totalUsers || 0}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={premiumPanelCardSx}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Vendors
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {stats.overview?.totalVendors || 0}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={premiumPanelCardSx}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Charge Points
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {stats.overview?.totalChargePoints || 0}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper sx={premiumPanelCardSx}>
              <Typography variant="h6" gutterBottom>
                Analytics Overview
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Detailed charts and visualizations coming soon.
              </Typography>
              <Alert severity="info">
                Advanced analytics features including revenue trends, session patterns, and vendor performance comparisons will be available in the next update.
              </Alert>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

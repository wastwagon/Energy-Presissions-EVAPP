import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  LinearProgress,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import axios from 'axios';
import { dashboardApi, DashboardStats } from '../../services/dashboardApi';
import {
  dashboardPageTitleSx,
  dashboardPageSubtitleSx,
  premiumPanelCardSx,
} from '../../theme/jampackShell';
import { compactOutlinedCtaSx, sxObject } from '../../styles/authShell';
import { websocketService } from '../../services/websocket';
import { formatCurrency } from '../../utils/formatters';
import { OpsQuickActions } from '../../components/dashboard/OpsQuickActions';
import { LiveDataMeta } from '../../components/dashboard/LiveDataMeta';
import { RefreshButton } from '../../components/dashboard/RefreshButton';
import { LIVE_DATA_LABELS } from '../../constants/liveDataLabels';

export function SuperAdminAnalyticsPage() {
  const [searchParams] = useSearchParams();
  const vendorScope = searchParams.get('scope') === 'vendor';
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const statsRef = useRef<DashboardStats | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadAnalytics = useCallback(async (silent?: boolean) => {
    const isQuiet = silent === true;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      if (!mountedRef.current) return;

      if (isQuiet) {
        setRefreshing(true);
      } else if (statsRef.current == null) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      const data = await dashboardApi.getStats({ signal: controller.signal });
      if (mountedRef.current) {
        statsRef.current = data;
        setStats(data);
        setUpdatedAt(Date.now());
      }
    } catch (err: unknown) {
      if (axios.isCancel(err)) return;
      console.error('Error loading analytics:', err);
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Failed to load analytics';
        setError(message);
      }
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadAnalytics(false);

    const unsubscribeTransactionStarted = websocketService.on('transactionStarted', () => {
      void loadAnalytics(true);
    });

    const unsubscribeTransactionStopped = websocketService.on('transactionStopped', () => {
      void loadAnalytics(true);
    });

    const unsubscribeDashboardStats = websocketService.on('dashboardStatsUpdate', () => {
      void loadAnalytics(true);
    });

    return () => {
      unsubscribeTransactionStarted();
      unsubscribeTransactionStopped();
      unsubscribeDashboardStats();
      abortRef.current?.abort();
    };
  }, [loadAnalytics]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      {refreshing && (
        <LinearProgress sx={{ mb: 2, borderRadius: 1 }} aria-label="Updating analytics data" />
      )}
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
          <LiveDataMeta updatedAt={updatedAt} liveLabel={LIVE_DATA_LABELS.analytics} />
        </Box>
        <RefreshButton
          refreshing={refreshing}
          disabled={loading}
          onClick={() => void loadAnalytics(false)}
          sx={(th) => ({
            ...sxObject(th, compactOutlinedCtaSx),
            width: { xs: '100%', sm: 'auto' },
          })}
        />
      </Box>

      <OpsQuickActions />

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

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Alert,
  Button,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
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
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { LIVE_DATA_LABELS } from '../../constants/liveDataLabels';
import { DashboardStaffChromeSkeleton } from '../../components/dashboard/DashboardStaffChromeSkeleton';
import { AnalyticsBreakdownPanel } from '../../components/reports/AnalyticsBreakdownPanel';
import { RevenueTrendChart } from '../../components/reports/RevenueTrendChart';
import { ADMIN_ROUTES, SUPERADMIN_ROUTES } from '../../config/staffNav.paths';

export type StaffAnalyticsVariant = 'admin' | 'superadmin';

export function StaffAnalyticsPage({ variant = 'superadmin' }: { variant?: StaffAnalyticsVariant }) {
  const [searchParams] = useSearchParams();
  const vendorScope = variant === 'superadmin' && searchParams.get('scope') === 'vendor';
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
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
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
    return <DashboardStaffChromeSkeleton preset="analytics" />;
  }

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <LivePageHeader
        title={
          variant === 'admin'
            ? 'Vendor Analytics'
            : vendorScope
              ? 'Vendor Analytics'
              : 'System Analytics'
        }
        subtitle={
          variant === 'admin'
            ? 'Your vendor metrics, revenue trend, and operational breakdowns'
            : vendorScope
              ? 'System-wide metrics — open Reports for vendor-scoped exports'
              : 'Network metrics, user mix, and connection health across all vendors'
        }
        updatedAt={updatedAt}
        liveLabel={LIVE_DATA_LABELS.analytics}
        refreshing={refreshing}
        refreshDisabled={loading}
        onRefresh={() => void loadAnalytics(false)}
        titleSx={dashboardPageTitleSx}
        subtitleSx={dashboardPageSubtitleSx}
        refreshSx={(th) => ({
          ...sxObject(th, compactOutlinedCtaSx),
          width: { xs: '100%', sm: 'auto' },
        })}
      />

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
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                Completed sessions only
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
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Button
                component={RouterLink}
                to={variant === 'admin' ? ADMIN_ROUTES.reports : SUPERADMIN_ROUTES.reports}
                variant="outlined"
                size="small"
                sx={(th) => sxObject(th, compactOutlinedCtaSx)}
              >
                Open reports
              </Button>
              <Button
                component={RouterLink}
                to={variant === 'admin' ? ADMIN_ROUTES.billing : SUPERADMIN_ROUTES.billing}
                variant="outlined"
                size="small"
                sx={(th) => sxObject(th, compactOutlinedCtaSx)}
              >
                Billing & invoices
              </Button>
            </Box>
            <Box sx={{ mb: 2 }}>
              <RevenueTrendChart days={30} />
            </Box>
            <AnalyticsBreakdownPanel stats={stats} />
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

export function SuperAdminAnalyticsPage() {
  return <StaffAnalyticsPage variant="superadmin" />;
}

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Alert,
  Button,
  Tabs,
  Tab,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import axios from 'axios';
import { dashboardApi, DashboardStats } from '../../services/dashboardApi';
import {
  dashboardPageTitleSx,
  dashboardPageSubtitleSx,
  premiumPanelCardSx,
  premiumTableSurfaceSx,
} from '../../theme/jampackShell';
import { compactOutlinedCtaSx, sxObject } from '../../styles/authShell';
import { formatCurrency } from '../../utils/formatters';
import { SessionsReportPanel } from '../../components/reports/SessionsReportPanel';
import { RevenueReportPanel } from '../../components/reports/RevenueReportPanel';
import { VendorsReportPanel } from '../../components/reports/VendorsReportPanel';
import { AnalyticsBreakdownPanel } from '../../components/reports/AnalyticsBreakdownPanel';
import { ReportSessionAverages } from '../../components/reports/ReportSessionAverages';
import { reportsApi } from '../../services/dashboardApi';
import { downloadSessionsReportCsv } from '../../utils/reportExport';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { LIVE_DATA_LABELS } from '../../constants/liveDataLabels';
import { DashboardStaffChromeSkeleton } from '../../components/dashboard/DashboardStaffChromeSkeleton';

export function SuperAdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const statsRef = useRef<DashboardStats | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadStats = useCallback(async (silent?: boolean) => {
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
      console.error('Error loading reports:', err);
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Failed to load reports';
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
    void loadStats(false);
    return () => {
      abortRef.current?.abort();
    };
  }, [loadStats]);

  const handleExport = async () => {
    try {
      setExportNotice(null);
      const data = await reportsApi.getSessionRows(200, 0);
      downloadSessionsReportCsv(
        data.transactions,
        `sessions-report-${new Date().toISOString().slice(0, 10)}.csv`,
      );
      setExportNotice('Sessions CSV downloaded.');
    } catch (err: unknown) {
      setExportNotice(err instanceof Error ? err.message : 'Export failed');
    }
  };
  const tabA11yProps = (index: number) => ({
    id: `superadmin-reports-tab-${index}`,
    'aria-controls': `superadmin-reports-panel-${index}`,
  });

  if (loading) {
    return <DashboardStaffChromeSkeleton preset="superReports" />;
  }

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <LivePageHeader
        title="System Reports"
        subtitle="Comprehensive reports and analytics across all vendors"
        updatedAt={updatedAt}
        liveLabel={LIVE_DATA_LABELS.reports}
        refreshing={refreshing}
        refreshDisabled={loading}
        onRefresh={() => void loadStats(false)}
        titleSx={dashboardPageTitleSx}
        subtitleSx={dashboardPageSubtitleSx}
        refreshSx={(th) => ({
          ...sxObject(th, compactOutlinedCtaSx),
          flex: { xs: '1 1 auto', sm: '0 0 auto' },
          minWidth: { xs: 0, sm: 'auto' },
        })}
        actions={
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => void handleExport()}
            sx={(th) => ({
              ...sxObject(th, compactOutlinedCtaSx),
              flex: { xs: '1 1 auto', sm: '0 0 auto' },
              minWidth: { xs: 0, sm: 'auto' },
            })}
          >
            Export Report
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {exportNotice && (
        <Alert severity="info" sx={{ mb: 3 }} onClose={() => setExportNotice(null)}>
          {exportNotice}
        </Alert>
      )}

      {stats && (
        <>
          <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={premiumPanelCardSx}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Revenue
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                  {formatCurrency(stats.overview?.totalRevenue ?? stats.totalRevenue ?? 0)}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.75 }}>
                  Completed sessions only — excludes wallet holds
                </Typography>
              </Paper>
            </Grid>
            {(stats.overview?.pendingWalletReserved ?? 0) > 0 && (
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={premiumPanelCardSx}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Wallet holds (pending)
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                    {formatCurrency(stats.overview?.pendingWalletReserved ?? 0)}
                  </Typography>
                </Paper>
              </Grid>
            )}
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={premiumPanelCardSx}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Sessions
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {stats.overview?.totalTransactions ?? stats.totalSessions ?? 0}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={premiumPanelCardSx}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Vendors
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {stats.overview?.totalVendors ?? stats.totalVendors ?? 0}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={premiumPanelCardSx}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Users
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {stats.overview?.totalUsers ?? stats.totalUsers ?? 0}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Paper sx={premiumTableSurfaceSx}>
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile aria-label="Super Admin report sections">
              <Tab label="Overview" {...tabA11yProps(0)} />
              <Tab label="Revenue" {...tabA11yProps(1)} />
              <Tab label="Vendors" {...tabA11yProps(2)} />
              <Tab label="Sessions" {...tabA11yProps(3)} />
            </Tabs>

            <Box sx={{ p: { xs: 2, sm: 3 } }} role="tabpanel" id={`superadmin-reports-panel-${activeTab}`} aria-labelledby={`superadmin-reports-tab-${activeTab}`}>
              {activeTab === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    System Overview Report
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Comprehensive overview of the entire EV charging network.
                  </Typography>
                  <ReportSessionAverages stats={stats} />
                  {((stats.overview?.totalVendors ?? stats.totalVendors) ?? 0) > 0 && (
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={12} md={6}>
                        <Paper sx={premiumPanelCardSx}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Average revenue per vendor
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {formatCurrency(
                              (stats.overview?.totalRevenue ?? stats.totalRevenue ?? 0) /
                                Math.max(1, stats.overview?.totalVendors ?? stats.totalVendors ?? 1),
                            )}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Network total ÷ vendor count
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Paper sx={premiumPanelCardSx}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Average sessions per vendor
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {Math.round(
                              (stats.overview?.totalTransactions ?? stats.totalSessions ?? 0) /
                                Math.max(1, stats.overview?.totalVendors ?? stats.totalVendors ?? 1),
                            )}
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  )}
                  <AnalyticsBreakdownPanel stats={stats} />
                </Box>
              )}

              {activeTab === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Revenue Report
                  </Typography>
                  <RevenueReportPanel />
                </Box>
              )}

              {activeTab === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Vendor Performance Report
                  </Typography>
                  <VendorsReportPanel />
                </Box>
              )}

              {activeTab === 3 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Sessions Report
                  </Typography>
                  <SessionsReportPanel />
                </Box>
              )}
            </Box>
          </Paper>
        </>
      )}
    </Box>
  );
}


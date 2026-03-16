import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  Tabs,
  Tab,
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DownloadIcon from '@mui/icons-material/Download';
import { dashboardApi, DashboardStats } from '../../services/dashboardApi';

export function SuperAdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardApi.getStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load reports');
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'GHS') => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const handleExport = (type: string) => {
    alert(`Export ${type} report - Feature coming soon`);
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
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
            System Reports
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Comprehensive reports and analytics across all vendors
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={() => handleExport('all')}
        >
          Export Report
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {stats && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Revenue
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                    {formatCurrency(stats.overview?.totalRevenue ?? stats.totalRevenue ?? 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Sessions
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats.overview?.totalTransactions ?? stats.totalSessions ?? 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Vendors
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats.overview?.totalVendors ?? stats.totalVendors ?? 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Users
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats.overview?.totalUsers ?? stats.totalUsers ?? 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Paper>
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile>
              <Tab label="Overview" />
              <Tab label="Revenue" />
              <Tab label="Vendors" />
              <Tab label="Sessions" />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {activeTab === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    System Overview Report
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Comprehensive overview of the entire EV charging network.
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Average Revenue per Vendor
                        </Typography>
                        <Typography variant="h6">
                          {((stats.overview?.totalVendors ?? stats.totalVendors) ?? 0) > 0
                            ? formatCurrency((stats.overview?.totalRevenue ?? stats.totalRevenue ?? 0) / Math.max(1, (stats.overview?.totalVendors ?? stats.totalVendors ?? 1)))
                            : 'N/A'}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Average Sessions per Vendor
                        </Typography>
                        <Typography variant="h6">
                          {((stats.overview?.totalVendors ?? stats.totalVendors) ?? 0) > 0
                            ? Math.round((stats.overview?.totalTransactions ?? stats.totalSessions ?? 0) / Math.max(1, (stats.overview?.totalVendors ?? stats.totalVendors ?? 1)))
                            : 'N/A'}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {activeTab === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Revenue Report
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Revenue analytics and trends across all vendors.
                  </Typography>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Revenue charts and detailed breakdowns by vendor coming soon.
                  </Alert>
                </Box>
              )}

              {activeTab === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Vendor Performance Report
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Performance metrics for each vendor.
                  </Typography>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Vendor performance charts and comparisons coming soon.
                  </Alert>
                </Box>
              )}

              {activeTab === 3 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Sessions Report
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Session statistics and analysis across the network.
                  </Typography>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Session charts and detailed breakdowns coming soon.
                  </Alert>
                </Box>
              )}
            </Box>
          </Paper>
        </>
      )}
    </Box>
  );
}


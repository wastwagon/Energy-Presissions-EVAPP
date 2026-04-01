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
import { dashboardPageTitleSx, dashboardPageSubtitleSx } from '../../theme/jampackShell';
import { formatCurrency } from '../../utils/formatters';

export function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardApi.getVendorStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load reports');
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (type: string) => {
    // TODO: Implement export functionality
    setExportNotice(`Export ${type} report - feature coming soon.`);
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
        <Box sx={{ minWidth: 0, flex: '1 1 220px' }}>
          <Typography variant="h6" component="h1" sx={dashboardPageTitleSx}>
            Reports & Analytics
          </Typography>
          <Typography variant="body2" sx={dashboardPageSubtitleSx}>
            View detailed reports and analytics for your operations
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={() => handleExport('all')}
          sx={{ width: { xs: '100%', sm: 'auto' }, alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
        >
          Export Report
        </Button>
      </Box>

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
                    Active Sessions
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                    {stats.overview?.activeSessions ?? stats.activeSessions ?? 0}
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
              <Tab label="Sessions" />
              <Tab label="Users" />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {activeTab === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Overview Report
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Comprehensive overview of your charging operations.
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Average Session Duration
                        </Typography>
                        <Typography variant="h6">
                          {(stats.overview?.averageSessionDuration ?? stats.averageSessionDuration)
                            ? `${Math.round(stats.overview?.averageSessionDuration ?? stats.averageSessionDuration ?? 0)} minutes`
                            : 'N/A'}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Average Revenue per Session
                        </Typography>
                        <Typography variant="h6">
                          {(stats.overview?.averageRevenuePerSession ?? stats.averageRevenuePerSession)
                            ? formatCurrency(stats.overview?.averageRevenuePerSession ?? stats.averageRevenuePerSession ?? 0)
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
                    Detailed revenue analytics and trends.
                  </Typography>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Revenue charts and detailed breakdowns coming soon.
                  </Alert>
                </Box>
              )}

              {activeTab === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Sessions Report
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Session statistics and analysis.
                  </Typography>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Session charts and detailed breakdowns coming soon.
                  </Alert>
                </Box>
              )}

              {activeTab === 3 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Users Report
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    User statistics and growth metrics.
                  </Typography>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    User charts and detailed breakdowns coming soon.
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


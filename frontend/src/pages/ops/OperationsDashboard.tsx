import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import EvStationIcon from '@mui/icons-material/EvStation';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { useNavigate } from 'react-router-dom';
import { chargePointsApi, ChargePoint } from '../../services/chargePointsApi';
import { transactionsApi } from '../../services/transactionsApi';
import { websocketService } from '../../services/websocket';
import { useOpsBasePath } from '../../hooks/useOpsBasePath';
import { DashboardNavIcon, premiumStatCardSx } from '../../components/dashboard/DashboardNavIcon';

export function OperationsDashboard() {
  const navigate = useNavigate();
  const opsBase = useOpsBasePath();
  const [chargePoints, setChargePoints] = useState<ChargePoint[]>([]);
  const [activeSessions, setActiveSessions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [vendorName, setVendorName] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is impersonating a vendor
    const impersonating = localStorage.getItem('isImpersonating') === 'true';
    const vendor = localStorage.getItem('currentVendorName');
    setIsImpersonating(impersonating);
    setVendorName(vendor);
  }, []);

  const handleExitImpersonation = () => {
    if (window.confirm('Exit vendor view and return to Super Admin dashboard?')) {
      localStorage.removeItem('currentVendorId');
      localStorage.removeItem('currentVendorName');
      localStorage.removeItem('isImpersonating');
      window.location.href = '/superadmin/vendors';
    }
  };

  useEffect(() => {
    loadData();
    
    // Set up WebSocket listeners for real-time updates
    const unsubscribeChargePoint = websocketService.on('chargePointStatus', (event) => {
      setChargePoints((prev) =>
        prev.map((cp) =>
          cp.chargePointId === event.data.chargePointId
            ? { ...cp, ...event.data }
            : cp
        )
      );
    });

    const unsubscribeTransaction = websocketService.on('transactionStarted', () => {
      loadData(); // Reload to get updated active sessions count
    });

    const unsubscribeTransactionStopped = websocketService.on('transactionStopped', () => {
      loadData(); // Reload to get updated active sessions count
    });

    // Cleanup
    return () => {
      unsubscribeChargePoint();
      unsubscribeTransaction();
      unsubscribeTransactionStopped();
    };
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      const [cpData, activeTx] = await Promise.all([
        chargePointsApi.getAll().catch((err) => {
          console.warn('Error loading charge points:', err);
          return []; // Return empty array on error
        }),
        transactionsApi.getActive().catch((err) => {
          console.warn('Error loading active transactions:', err);
          return []; // Return empty array on error
        }),
      ]);
      setChargePoints(cpData || []);
      setActiveSessions((activeTx || []).length);
    } catch (err: any) {
      // Only show error if it's a critical error, not just empty data
      if (err.response?.status >= 500) {
        setError(err.message || 'Failed to load data');
      } else {
        // For 404 or empty data, just log and continue
        console.warn('Dashboard data load warning:', err);
        setChargePoints([]);
        setActiveSessions(0);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'success';
      case 'Charging':
        return 'info';
      case 'Offline':
        return 'default';
      case 'Faulted':
        return 'error';
      default:
        return 'warning';
    }
  };

  const availableCount = chargePoints.filter((cp) => cp.status === 'Available').length;
  const offlineCount = chargePoints.filter((cp) => cp.status === 'Offline').length;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 2,
            mb: 0.5,
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              fontSize: { xs: '1.75rem', sm: '2rem' },
              minWidth: 0,
              flex: '1 1 200px',
            }}
          >
            Operations Dashboard
          </Typography>
          {isImpersonating && (
            <Button
              variant="outlined"
              color="warning"
              startIcon={<ExitToAppIcon />}
              onClick={handleExitImpersonation}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                width: { xs: '100%', sm: 'auto' },
                alignSelf: { xs: 'stretch', sm: 'auto' },
              }}
            >
              Exit Vendor View
            </Button>
          )}
        </Box>
        {isImpersonating && vendorName && (
          <Chip
            label={`Viewing as: ${vendorName}`}
            color="info"
            size="small"
            sx={{ mt: 1 }}
          />
        )}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Real-time monitoring of charging operations and device status.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={{ xs: 2, sm: 2.5 }} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <Card elevation={0} sx={{ bgcolor: 'background.paper', ...premiumStatCardSx('primary') }}>
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <DashboardNavIcon accent="primary" compact noRightMargin>
                  <EvStationIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                </DashboardNavIcon>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Stations
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5, fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
                {chargePoints.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total charge points
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card elevation={0} sx={{ bgcolor: 'background.paper', ...premiumStatCardSx('success') }}>
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <DashboardNavIcon accent="success" compact noRightMargin>
                  <BatteryChargingFullIcon sx={{ color: 'success.main', fontSize: 24 }} />
                </DashboardNavIcon>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Active
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5, fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
                {activeSessions}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Currently charging
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card elevation={0} sx={{ bgcolor: 'background.paper', ...premiumStatCardSx('info') }}>
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <DashboardNavIcon accent="info" compact noRightMargin>
                  <CheckCircleIcon sx={{ color: 'info.main', fontSize: 24 }} />
                </DashboardNavIcon>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Available
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5, fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
                {availableCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Connectors available
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card elevation={0} sx={{ bgcolor: 'background.paper', ...premiumStatCardSx('secondary') }}>
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <DashboardNavIcon accent="secondary" compact noRightMargin>
                  <ErrorIcon sx={{ color: 'secondary.main', fontSize: 24 }} />
                </DashboardNavIcon>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Offline
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5, fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
                {offlineCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Stations offline
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charge Points List */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: { xs: 2, sm: 3 }, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
            Charge Points
          </Typography>
        </Box>
        {chargePoints.length === 0 ? (
          <Box sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No charge points registered yet. Charge points will appear here after they connect and send BootNotification.
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Vendor/Model</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Last Seen</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Location</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {chargePoints.map((cp) => (
                  <TableRow
                    key={cp.chargePointId}
                    sx={{
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                    onClick={() => navigate(`${opsBase}/devices/${cp.chargePointId}`)}
                  >
                    <TableCell sx={{ fontWeight: 500 }}>{cp.chargePointId}</TableCell>
                    <TableCell>
                      {(cp.vendorName || cp.vendor) && cp.model ? `${cp.vendorName || cp.vendor} ${cp.model}` : 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={cp.status}
                        color={getStatusColor(cp.status) as any}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      {cp.lastSeen
                        ? new Date(cp.lastSeen).toLocaleString()
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      {cp.locationAddress || 'Not set'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}


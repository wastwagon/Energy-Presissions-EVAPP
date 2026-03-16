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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 700,
              color: '#1e293b',
              fontSize: { xs: '1.75rem', sm: '2rem' },
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
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
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
        <Typography variant="body2" sx={{ color: '#64748b', mt: 1 }}>
          Real-time monitoring of charging operations and device status.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              background: 'linear-gradient(135deg, rgba(10, 61, 98, 0.08) 0%, rgba(26, 95, 122, 0.08) 100%)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 10px 25px rgba(10, 61, 98, 0.15)',
                borderColor: 'primary.main',
              },
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #0A3D62 0%, #1A5F7A 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <EvStationIcon sx={{ color: 'white', fontSize: 24 }} />
                </Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                  Stations
                </Typography>
              </Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: '#1e293b',
                  mb: 0.5,
                  fontSize: { xs: '1.5rem', sm: '1.75rem' },
                }}
              >
                {chargePoints.length}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Total charge points
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              background: 'linear-gradient(135deg, #10b98115 0%, #05966915 100%)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 10px 25px rgba(16, 185, 129, 0.15)',
                borderColor: 'success.main',
              },
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <BatteryChargingFullIcon sx={{ color: 'white', fontSize: 24 }} />
                </Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                  Active
                </Typography>
              </Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: '#1e293b',
                  mb: 0.5,
                  fontSize: { xs: '1.5rem', sm: '1.75rem' },
                }}
              >
                {activeSessions}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Currently charging
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              background: 'linear-gradient(135deg, #3b82f615 0%, #2563eb15 100%)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 10px 25px rgba(59, 130, 246, 0.15)',
                borderColor: 'info.main',
              },
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircleIcon sx={{ color: 'white', fontSize: 24 }} />
                </Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                  Available
                </Typography>
              </Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: '#1e293b',
                  mb: 0.5,
                  fontSize: { xs: '1.5rem', sm: '1.75rem' },
                }}
              >
                {availableCount}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Connectors available
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              background: 'linear-gradient(135deg, rgba(26, 95, 122, 0.08) 0%, rgba(37, 132, 168, 0.08) 100%)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 10px 25px rgba(26, 95, 122, 0.15)',
                borderColor: 'secondary.main',
              },
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #1A5F7A 0%, #2584a8 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ErrorIcon sx={{ color: 'white', fontSize: 24 }} />
                </Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                  Offline
                </Typography>
              </Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: '#1e293b',
                  mb: 0.5,
                  fontSize: { xs: '1.5rem', sm: '1.75rem' },
                }}
              >
                {offlineCount}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
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
        <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
            Charge Points
          </Typography>
        </Box>
        {chargePoints.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No charge points registered yet. Charge points will appear here after they connect and send BootNotification.
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Vendor/Model</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Last Seen</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Location</TableCell>
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
                        bgcolor: '#f8fafc',
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


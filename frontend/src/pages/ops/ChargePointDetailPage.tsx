import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SettingsIcon from '@mui/icons-material/Settings';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { chargePointsApi, ChargePoint, Connector } from '../../services/chargePointsApi';
import { transactionsApi } from '../../services/transactionsApi';
import { websocketService } from '../../services/websocket';

export function ChargePointDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [chargePoint, setChargePoint] = useState<ChargePoint | null>(null);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [activeTransactions, setActiveTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [remoteStartDialogOpen, setRemoteStartDialogOpen] = useState(false);
  const [configKey, setConfigKey] = useState('');
  const [configValue, setConfigValue] = useState('');
  const [remoteStartConnector, setRemoteStartConnector] = useState<number | null>(null);
  const [remoteStartIdTag, setRemoteStartIdTag] = useState('');

  useEffect(() => {
    if (id) {
      loadData();
      
      // Set up WebSocket listeners for real-time updates
      const unsubscribeChargePoint = websocketService.on('chargePointStatus', (event) => {
        if (event.data.chargePointId === id) {
          setChargePoint((prev) => (prev ? { ...prev, ...event.data } : null));
        }
      });

      const unsubscribeConnector = websocketService.on('connectorStatus', (event) => {
        if (event.data.chargePointId === id) {
          setConnectors((prev) =>
            prev.map((conn) =>
              conn.connectorId === event.data.connectorId
                ? { ...conn, ...event.data }
                : conn
            )
          );
        }
      });

      const unsubscribeTransaction = websocketService.on('transactionStarted', (event) => {
        if (event.data.chargePointId === id) {
          loadData(); // Reload to get updated active transactions
        }
      });

      const unsubscribeTransactionStopped = websocketService.on('transactionStopped', (event) => {
        if (event.data.chargePointId === id) {
          loadData(); // Reload to get updated active transactions
        }
      });

      // Cleanup
      return () => {
        unsubscribeChargePoint();
        unsubscribeConnector();
        unsubscribeTransaction();
        unsubscribeTransactionStopped();
      };
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      setError(null);
      const [cp, conns, activeTx] = await Promise.all([
        chargePointsApi.getById(id),
        chargePointsApi.getConnectors(id).catch(() => []),
        transactionsApi.getActive().catch(() => []),
      ]);
      setChargePoint(cp);
      setConnectors(conns);
      setActiveTransactions(activeTx.filter((tx: any) => tx.chargePointId === id));
    } catch (err: any) {
      setError(err.message || 'Failed to load charge point details');
      console.error('Error loading charge point details:', err);
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

  const handleRemoteStart = async () => {
    if (!id || !remoteStartConnector || !remoteStartIdTag) return;
    try {
      await chargePointsApi.remoteStart(id, remoteStartConnector, remoteStartIdTag);
      setRemoteStartDialogOpen(false);
      setRemoteStartConnector(null);
      setRemoteStartIdTag('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to start transaction');
    }
  };

  const handleReset = async (type: 'Hard' | 'Soft') => {
    if (!window.confirm(`Are you sure you want to ${type.toLowerCase()} reset this charge point?`)) {
      return;
    }

      setLoading(true);
      setError(null);
      setSuccess(null);
      try {
        await chargePointsApi.reset(id!, type);
        setSuccess(`Charge point ${type.toLowerCase()} reset initiated`);
        setTimeout(() => loadData(), 2000);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to reset charge point');
      } finally {
        setLoading(false);
      }
    };

    const handleClearCache = async () => {
      if (!window.confirm('Are you sure you want to clear the authorization cache?')) {
        return;
      }

      setLoading(true);
      setError(null);
      setSuccess(null);
      try {
        await chargePointsApi.clearCache(id!);
        setSuccess('Authorization cache cleared');
        setTimeout(() => setSuccess(null), 3000);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to clear cache');
      } finally {
        setLoading(false);
      }
    };

  const handleUnlockConnector = async (connectorId: number) => {
    if (!id) return;
    try {
      await chargePointsApi.unlockConnector(id, connectorId);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to unlock connector');
    }
  };

  const handleChangeAvailability = async (connectorId: number, type: 'Inoperative' | 'Operative') => {
    if (!id) return;
    try {
      await chargePointsApi.changeAvailability(id, connectorId, type);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to change availability');
    }
  };

  const handleGetConfiguration = async () => {
    if (!id) return;
    try {
      const config = await chargePointsApi.getConfiguration(id);
      console.log('Configuration:', config);
      // TODO: Display configuration in a dialog or table
    } catch (err: any) {
      setError(err.message || 'Failed to get configuration');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!chargePoint) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/ops')} sx={{ mb: 2 }}>
          Back to Dashboard
        </Button>
        <Alert severity="error">Charge point not found</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/ops')} sx={{ mr: 2 }}>
          Back
        </Button>
        <Typography variant="h4" component="h1">
          {chargePoint.chargePointId}
        </Typography>
        <Chip
          label={chargePoint.status}
          color={getStatusColor(chargePoint.status) as any}
          sx={{ ml: 2 }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Charge Point Info */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Charge Point Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Vendor
                  </Typography>
                  <Typography variant="body1">{chargePoint.vendor || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Model
                  </Typography>
                  <Typography variant="body1">{chargePoint.model || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Serial Number
                  </Typography>
                  <Typography variant="body1">{chargePoint.serialNumber || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Firmware
                  </Typography>
                  <Typography variant="body1">{chargePoint.firmwareVersion || '-'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Location
                  </Typography>
                  <Typography variant="body1">
                    {chargePoint.locationAddress ||
                      (chargePoint.locationLatitude && chargePoint.locationLongitude
                        ? `${chargePoint.locationLatitude}, ${chargePoint.locationLongitude}`
                        : '-')}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Last Heartbeat
                  </Typography>
                  <Typography variant="body1">
                    {chargePoint.lastHeartbeat
                      ? new Date(chargePoint.lastHeartbeat).toLocaleString()
                      : 'Never'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Last Seen
                  </Typography>
                  <Typography variant="body1">
                    {chargePoint.lastSeen
                      ? new Date(chargePoint.lastSeen).toLocaleString()
                      : 'Never'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<PlayArrowIcon />}
                  onClick={() => setRemoteStartDialogOpen(true)}
                  disabled={chargePoint.status === 'Offline'}
                >
                  Remote Start Transaction
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<SettingsIcon />}
                  onClick={handleGetConfiguration}
                  disabled={chargePoint.status === 'Offline'}
                >
                  Get Configuration
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={() => handleReset('Soft')}
                  disabled={chargePoint.status === 'Offline' || loading}
                >
                  Reset (Soft)
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => handleReset('Hard')}
                  disabled={chargePoint.status === 'Offline' || loading}
                >
                  Reset (Hard)
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleClearCache}
                  disabled={chargePoint.status === 'Offline' || loading}
                >
                  Clear Cache
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Connectors */}
        <Grid item xs={12}>
          <Paper>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">Connectors</Typography>
            </Box>
            {connectors.length === 0 ? (
              <Box sx={{ p: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  No connectors found
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Connector ID</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Power Rating</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Error Code</TableCell>
                      <TableCell>Last Update</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {connectors.map((connector) => (
                      <TableRow key={connector.connectorId}>
                        <TableCell>{connector.connectorId}</TableCell>
                        <TableCell>{connector.connectorType || '-'}</TableCell>
                        <TableCell>
                          {connector.powerRatingKw ? `${connector.powerRatingKw} kW` : '-'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={connector.status}
                            color={getStatusColor(connector.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{connector.errorCode || '-'}</TableCell>
                        <TableCell>
                          {connector.lastStatusUpdate
                            ? new Date(connector.lastStatusUpdate).toLocaleString()
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              startIcon={<LockOpenIcon />}
                              onClick={() => handleUnlockConnector(connector.connectorId)}
                              disabled={chargePoint.status === 'Offline'}
                            >
                              Unlock
                            </Button>
                            <Button
                              size="small"
                              onClick={() =>
                                handleChangeAvailability(
                                  connector.connectorId,
                                  connector.status === 'Unavailable' ? 'Operative' : 'Inoperative',
                                )
                              }
                              disabled={chargePoint.status === 'Offline'}
                            >
                              {connector.status === 'Unavailable' ? 'Enable' : 'Disable'}
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        {/* Active Transactions */}
        {activeTransactions.length > 0 && (
          <Grid item xs={12}>
            <Paper>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6">Active Transactions</Typography>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Transaction ID</TableCell>
                      <TableCell>Connector</TableCell>
                      <TableCell>IdTag</TableCell>
                      <TableCell>Start Time</TableCell>
                      <TableCell>Energy (kWh)</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activeTransactions.map((tx) => (
                      <TableRow key={tx.transactionId}>
                        <TableCell>{tx.transactionId}</TableCell>
                        <TableCell>{tx.connectorId}</TableCell>
                        <TableCell>{tx.idTag || '-'}</TableCell>
                        <TableCell>{new Date(tx.startTime).toLocaleString()}</TableCell>
                        <TableCell>{tx.totalEnergyKwh?.toFixed(3) || '-'}</TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<StopIcon />}
                            onClick={async () => {
                              try {
                                await chargePointsApi.remoteStop(id!, tx.transactionId);
                                loadData();
                              } catch (err: any) {
                                setError(err.message || 'Failed to stop transaction');
                              }
                            }}
                          >
                            Stop
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Remote Start Dialog */}
      <Dialog open={remoteStartDialogOpen} onClose={() => setRemoteStartDialogOpen(false)}>
        <DialogTitle>Remote Start Transaction</DialogTitle>
        <DialogContent>
          <TextField
            label="Connector ID"
            type="number"
            fullWidth
            margin="normal"
            value={remoteStartConnector || ''}
            onChange={(e) => setRemoteStartConnector(parseInt(e.target.value))}
          />
          <TextField
            label="IdTag"
            fullWidth
            margin="normal"
            value={remoteStartIdTag}
            onChange={(e) => setRemoteStartIdTag(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoteStartDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRemoteStart} variant="contained" disabled={!remoteStartConnector || !remoteStartIdTag}>
            Start
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


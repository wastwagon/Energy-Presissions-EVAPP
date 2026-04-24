import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Tooltip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SettingsIcon from '@mui/icons-material/Settings';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import EditIcon from '@mui/icons-material/Edit';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import BugReportIcon from '@mui/icons-material/BugReport';
import HealingIcon from '@mui/icons-material/Healing';
import { useOpsBasePath } from '../../hooks/useOpsBasePath';
import { chargePointsApi, ChargePoint, Connector } from '../../services/chargePointsApi';
import { transactionsApi } from '../../services/transactionsApi';
import { websocketService } from '../../services/websocket';
import { ChargePointSettingsDialog } from '../../components/ChargePointSettingsDialog';
import { firmwareApi } from '../../services/firmwareApi';
import { diagnosticsApi } from '../../services/diagnosticsApi';
import { dashboardPageTitleSx, dashboardPageSubtitleSx, premiumPanelCardSx, premiumTableSurfaceSx } from '../../theme/jampackShell';
import {
  authFormFieldSx,
  compactContainedCtaSx,
  compactErrorContainedCtaSx,
  compactOutlinedCtaSx,
  premiumDialogPaperSx,
  sxObject,
} from '../../styles/authShell';
import { formatCurrency, formatEnergyKwh } from '../../utils/formatters';
import { getChargePointStatusColor } from '../../utils/statusColors';
import { OpsQuickActions } from '../../components/dashboard/OpsQuickActions';
import { getStoredUser } from '../../utils/authSession';

const CONNECTOR_REMOTE_START_STATUSES = ['Available', 'Preparing'] as const;

/** Connector statuses that may indicate a stuck session with no DB billing row */
const STALE_OPERATIONAL_CONNECTOR_STATUSES = [
  'Charging',
  'Finishing',
  'SuspendedEVSE',
  'SuspendedEV',
  'Preparing',
] as const;

function connectorAllowsRemoteStart(status: string | undefined): boolean {
  return !!status && CONNECTOR_REMOTE_START_STATUSES.includes(status as (typeof CONNECTOR_REMOTE_START_STATUSES)[number]);
}

export function ChargePointDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const opsBase = useOpsBasePath();
  const [chargePoint, setChargePoint] = useState<ChargePoint | null>(null);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [activeTransactions, setActiveTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [remoteStartDialogOpen, setRemoteStartDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [remoteStartConnector, setRemoteStartConnector] = useState<number | null>(null);
  const [remoteStartIdTag, setRemoteStartIdTag] = useState('');
  const [firmwareJobs, setFirmwareJobs] = useState<any[]>([]);
  const [diagnosticsJobs, setDiagnosticsJobs] = useState<any[]>([]);
  const [firmwareLocation, setFirmwareLocation] = useState('');
  const [firmwareRetrieveDate, setFirmwareRetrieveDate] = useState(() =>
    new Date().toISOString().slice(0, 16)
  );
  const [diagnosticsLocation, setDiagnosticsLocation] = useState('');
  const [firmwareLoading, setFirmwareLoading] = useState(false);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    { type: 'reset'; resetType: 'Hard' | 'Soft' } | { type: 'clearCache' } | null
  >(null);
  const [clearStaleSubmitting, setClearStaleSubmitting] = useState(false);
  const [configurationDialogOpen, setConfigurationDialogOpen] = useState(false);
  const [configurationPayload, setConfigurationPayload] = useState<unknown>(null);

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

  const remoteStartBlockedByConnectors =
    connectors.length > 0 &&
    !connectors.some((c) => connectorAllowsRemoteStart(c.status));

  const canUserClearStaleOperationalState =
    !!chargePoint &&
    (() => {
      const user = getStoredUser();
      const role = user?.accountType;
      if (role === 'SuperAdmin') return true;
      if (
        role === 'Admin' &&
        typeof user?.vendorId === 'number' &&
        typeof chargePoint.vendorId === 'number'
      ) {
        return chargePoint.vendorId === user.vendorId;
      }
      return false;
    })();

  const chargePointLooksOperationallyStuck =
    !!chargePoint &&
    ['Charging', 'Preparing', 'Finishing', 'SuspendedEVSE', 'SuspendedEV'].includes(chargePoint.status);

  const connectorLooksOperationallyStuck = connectors.some((c) =>
    (STALE_OPERATIONAL_CONNECTOR_STATUSES as readonly string[]).includes(c.status),
  );

  const clearStaleOperationalAvailable =
    !!chargePoint &&
    canUserClearStaleOperationalState &&
    (chargePoint.activeTransactionCount ?? 0) === 0 &&
    activeTransactions.length === 0 &&
    (chargePointLooksOperationallyStuck || connectorLooksOperationallyStuck);

  const remoteStartSelectedConnector = connectors.find((c) => c.connectorId === remoteStartConnector);
  const remoteStartSubmitDisabled =
    !remoteStartConnector ||
    !remoteStartIdTag ||
    !!(remoteStartSelectedConnector && !connectorAllowsRemoteStart(remoteStartSelectedConnector.status));

  const loadData = async () => {
    if (!id) return;
    try {
      setError(null);
      const [cp, conns, activeTx, fwJobs, diagJobs] = await Promise.all([
        chargePointsApi.getById(id),
        chargePointsApi.getConnectors(id).catch(() => []),
        transactionsApi.getActive().catch(() => []),
        firmwareApi.getJobs(id).catch(() => []),
        diagnosticsApi.getJobs(id).catch(() => []),
      ]);
      setChargePoint(cp);
      setConnectors(conns);
      setActiveTransactions(activeTx.filter((tx: any) => tx.chargePointId === id));
      setFirmwareJobs(Array.isArray(fwJobs) ? fwJobs : []);
      setDiagnosticsJobs(Array.isArray(diagJobs) ? diagJobs : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load charge point details');
      console.error('Error loading charge point details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFirmwareUpdate = async () => {
    if (!id || !firmwareLocation || !firmwareRetrieveDate) return;
    try {
      setFirmwareLoading(true);
      setError(null);
      await firmwareApi.update({
        chargePointId: id,
        location: firmwareLocation,
        retrieveDate: new Date(firmwareRetrieveDate).toISOString(),
      });
      setSuccess('Firmware update initiated');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to start firmware update');
    } finally {
      setFirmwareLoading(false);
    }
  };

  const handleDiagnosticsGet = async () => {
    if (!id || !diagnosticsLocation) return;
    try {
      setDiagnosticsLoading(true);
      setError(null);
      await diagnosticsApi.get({
        chargePointId: id,
        location: diagnosticsLocation,
      });
      setSuccess('Diagnostics request sent');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to request diagnostics');
    } finally {
      setDiagnosticsLoading(false);
    }
  };

  const handleRemoteStart = async () => {
    if (!id || !remoteStartConnector || !remoteStartIdTag) return;
    const match = connectors.find((c) => c.connectorId === remoteStartConnector);
    if (match && !connectorAllowsRemoteStart(match.status)) {
      setError(
        `Connector ${remoteStartConnector} is ${match.status}${match.errorCode ? ` (${match.errorCode})` : ''}. Clear the fault or wait until status is Available or Preparing.`,
      );
      return;
    }
    try {
      setError(null);
      await chargePointsApi.remoteStart(id, remoteStartConnector, remoteStartIdTag);
      setRemoteStartDialogOpen(false);
      setRemoteStartConnector(null);
      setRemoteStartIdTag('');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to start transaction');
    }
  };

  const handleReset = (type: 'Hard' | 'Soft') => {
    setConfirmAction({ type: 'reset', resetType: type });
  };

  const handleClearCache = () => {
    setConfirmAction({ type: 'clearCache' });
  };

  const confirmDeviceAction = async () => {
    if (!confirmAction || !id) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (confirmAction.type === 'reset') {
        await chargePointsApi.reset(id, confirmAction.resetType);
        setSuccess(`Charge point ${confirmAction.resetType.toLowerCase()} reset initiated`);
        setTimeout(() => loadData(), 2000);
      } else {
        await chargePointsApi.clearCache(id);
        setSuccess('Authorization cache cleared');
        setTimeout(() => setSuccess(null), 3000);
      }
      setConfirmAction(null);
    } catch (err: any) {
      const fallbackMessage =
        confirmAction.type === 'reset' ? 'Failed to reset charge point' : 'Failed to clear cache';
      setError(err.response?.data?.message || err.message || fallbackMessage);
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

  const handleClearStaleOperationalState = async () => {
    if (!id) return;
    try {
      setClearStaleSubmitting(true);
      setError(null);
      const res = await chargePointsApi.clearStaleOperationalState(id);
      setSuccess(
        `Cleared stuck operational state (${res.clearedConnectors} connector(s); charge point status ${res.chargePointStatus}).`,
      );
      await loadData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: unknown } }; message?: string };
      const raw = e.response?.data?.message;
      const msg =
        typeof raw === 'string'
          ? raw
          : Array.isArray(raw)
            ? raw.join(', ')
            : e.message || 'Failed to clear stuck state';
      setError(msg);
    } finally {
      setClearStaleSubmitting(false);
    }
  };

  const handleGetConfiguration = async () => {
    if (!id) return;
    try {
      const config = await chargePointsApi.getConfiguration(id);
      setConfigurationPayload(config);
      setConfigurationDialogOpen(true);
      setSuccess('Configuration loaded');
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
      <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(opsBase)}
          sx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), mb: 2, width: { xs: '100%', sm: 'auto' } })}
        >
          Back to dashboard
        </Button>
        <OpsQuickActions />
        <Alert severity="error">Charge point not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(opsBase)}
          sx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), width: { xs: '100%', sm: 'auto' } })}
        >
          Back
        </Button>
        <Box sx={{ minWidth: 0, flex: '1 1 220px' }}>
          <Typography variant="h6" component="h1" sx={dashboardPageTitleSx}>
            {chargePoint.chargePointId}
          </Typography>
          <Typography variant="body2" sx={dashboardPageSubtitleSx}>
            Device details, connectors, active transactions, and remote actions.
          </Typography>
        </Box>
        <Chip
          label={chargePoint.status}
          color={getChargePointStatusColor(chargePoint.status)}
          sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
        />
      </Box>

      <OpsQuickActions />

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
          <Paper elevation={0} sx={premiumPanelCardSx}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Charge point information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Vendor
                  </Typography>
                  <Typography variant="body1">{chargePoint.vendorName || chargePoint.vendor || '-'}</Typography>
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
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Active billing sessions (DB)
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {chargePoint.activeTransactionCount ?? 0}
                  </Typography>
                </Grid>
                {chargePoint.totalCapacityKw && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Total Capacity
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {chargePoint.totalCapacityKw} kW
                    </Typography>
                  </Grid>
                )}
                {chargePoint.pricePerKwh != null && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Price per kWh
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatCurrency(Number(chargePoint.pricePerKwh ?? 0), chargePoint.currency || 'GHS')}
                    </Typography>
                  </Grid>
                )}
              </Grid>
          </Paper>
        </Grid>

        {/* Actions */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={premiumPanelCardSx}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                <Button
                  variant="contained"
                  color="primary"
                  disableElevation
                  startIcon={<EditIcon />}
                  onClick={() => setSettingsDialogOpen(true)}
                  sx={(th) => ({ ...sxObject(th, compactContainedCtaSx), width: '100%' })}
                >
                  Settings
                </Button>
                <Tooltip
                  title={
                    remoteStartBlockedByConnectors
                      ? 'No connector is Available or Preparing (e.g. Faulted). Fix the station or reset before remote start.'
                      : ''
                  }
                  disableHoverListener={!remoteStartBlockedByConnectors}
                >
                  <span style={{ width: '100%', display: 'block' }}>
                    <Button
                      variant="outlined"
                      startIcon={<PlayArrowIcon />}
                      onClick={() => setRemoteStartDialogOpen(true)}
                      disabled={chargePoint.status === 'Offline' || remoteStartBlockedByConnectors}
                      sx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), width: '100%' })}
                    >
                      Remote start
                    </Button>
                  </span>
                </Tooltip>
                {clearStaleOperationalAvailable && (
                  <Tooltip title="No active billing session in the database: resets connector/charge-point operational status when the UI is stuck after disconnect or simulator issues.">
                    <span style={{ width: '100%', display: 'block' }}>
                      <Button
                        variant="outlined"
                        color="warning"
                        startIcon={
                          clearStaleSubmitting ? (
                            <CircularProgress size={18} color="inherit" />
                          ) : (
                            <HealingIcon />
                          )
                        }
                        onClick={handleClearStaleOperationalState}
                        disabled={
                          chargePoint.status === 'Offline' || clearStaleSubmitting || loading
                        }
                        sx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), width: '100%' })}
                      >
                        Clear stuck operational state
                      </Button>
                    </span>
                  </Tooltip>
                )}
                <Button
                  variant="outlined"
                  startIcon={<SettingsIcon />}
                  onClick={handleGetConfiguration}
                  disabled={chargePoint.status === 'Offline'}
                  sx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), width: '100%' })}
                >
                  Get configuration
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={() => handleReset('Soft')}
                  disabled={chargePoint.status === 'Offline' || loading}
                  sx={(th) => ({
                    ...sxObject(th, compactOutlinedCtaSx),
                    width: '100%',
                    borderColor: 'warning.main',
                    color: 'warning.main',
                  })}
                >
                  Reset (soft)
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => handleReset('Hard')}
                  disabled={chargePoint.status === 'Offline' || loading}
                  sx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), width: '100%' })}
                >
                  Reset (hard)
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleClearCache}
                  disabled={chargePoint.status === 'Offline' || loading}
                  sx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), width: '100%' })}
                >
                  Clear cache
                </Button>
              </Box>
          </Paper>
        </Grid>

        {/* Connectors */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={premiumTableSurfaceSx}>
            <Box sx={{ px: { xs: 2, sm: 2.5 }, py: { xs: 1.75, sm: 2 }, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Connectors
              </Typography>
            </Box>
            {connectors.length === 0 ? (
              <Box sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography variant="body2" color="text.secondary">
                  No connectors found
                </Typography>
              </Box>
            ) : (
              <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <Table size="small">
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
                            color={getChargePointStatusColor(connector.status)}
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
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<LockOpenIcon />}
                              onClick={() => handleUnlockConnector(connector.connectorId)}
                              disabled={chargePoint.status === 'Offline'}
                              sx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), py: 0.5, minHeight: 36, fontSize: '0.8125rem' })}
                            >
                              Unlock
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() =>
                                handleChangeAvailability(
                                  connector.connectorId,
                                  connector.status === 'Unavailable' ? 'Operative' : 'Inoperative',
                                )
                              }
                              disabled={chargePoint.status === 'Offline'}
                              sx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), py: 0.5, minHeight: 36, fontSize: '0.8125rem' })}
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
            <Paper elevation={0} sx={premiumTableSurfaceSx}>
              <Box sx={{ px: { xs: 2, sm: 2.5 }, py: { xs: 1.75, sm: 2 }, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Active transactions
                </Typography>
              </Box>
              <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <Table size="small">
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
                        <TableCell>
                          {formatEnergyKwh(tx.totalEnergyKwh, 3)}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            disableElevation
                            startIcon={<StopIcon />}
                            onClick={async () => {
                              try {
                                await chargePointsApi.remoteStop(id!, tx.transactionId);
                                loadData();
                              } catch (err: unknown) {
                                const e = err as {
                                  response?: { data?: { message?: unknown } };
                                  message?: string;
                                };
                                const raw = e.response?.data?.message;
                                const msg =
                                  typeof raw === 'string'
                                    ? raw
                                    : Array.isArray(raw)
                                      ? raw.join(', ')
                                      : e.message || 'Failed to stop transaction';
                                setError(msg);
                              }
                            }}
                            sx={(th) => ({
                              ...sxObject(th, compactOutlinedCtaSx),
                              py: 0.5,
                              minHeight: 36,
                              fontSize: '0.8125rem',
                              borderColor: 'error.main',
                              color: 'error.main',
                              '&:hover': {
                                borderColor: 'error.dark',
                                bgcolor: alpha(th.palette.error.main, 0.06),
                              },
                            })}
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

        {/* Firmware & Diagnostics */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={premiumPanelCardSx}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CloudUploadIcon fontSize="small" color="primary" /> Firmware update
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
                <TextField
                  size="small"
                  label="Firmware URL"
                  placeholder="https://…"
                  value={firmwareLocation}
                  onChange={(e) => setFirmwareLocation(e.target.value)}
                  sx={(th) => sxObject(th, authFormFieldSx)}
                />
                <TextField
                  size="small"
                  label="Retrieve date"
                  type="datetime-local"
                  value={firmwareRetrieveDate}
                  onChange={(e) => setFirmwareRetrieveDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={(th) => sxObject(th, authFormFieldSx)}
                />
                <Button
                  variant="outlined"
                  startIcon={<CloudUploadIcon />}
                  onClick={handleFirmwareUpdate}
                  disabled={chargePoint.status === 'Offline' || firmwareLoading || !firmwareLocation}
                  sx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), width: { xs: '100%', sm: 'auto' } })}
                >
                  {firmwareLoading ? 'Starting…' : 'Start update'}
                </Button>
              </Box>
              {firmwareJobs.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Recent Jobs
                  </Typography>
                  <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Status</TableCell>
                          <TableCell>Retrieve Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {firmwareJobs.slice(0, 5).map((j) => (
                          <TableRow key={j.id}>
                            <TableCell><Chip label={j.status} size="small" /></TableCell>
                            <TableCell>
                              {j.retrieveDate ? new Date(j.retrieveDate).toLocaleString() : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={premiumPanelCardSx}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <BugReportIcon fontSize="small" color="primary" /> Diagnostics
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
                <TextField
                  size="small"
                  label="Upload URL"
                  placeholder="https://…"
                  value={diagnosticsLocation}
                  onChange={(e) => setDiagnosticsLocation(e.target.value)}
                  sx={(th) => sxObject(th, authFormFieldSx)}
                />
                <Button
                  variant="outlined"
                  startIcon={<BugReportIcon />}
                  onClick={handleDiagnosticsGet}
                  disabled={chargePoint.status === 'Offline' || diagnosticsLoading || !diagnosticsLocation}
                  sx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), width: { xs: '100%', sm: 'auto' } })}
                >
                  {diagnosticsLoading ? 'Requesting…' : 'Get diagnostics'}
                </Button>
              </Box>
              {diagnosticsJobs.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Recent Jobs
                  </Typography>
                  <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Status</TableCell>
                          <TableCell>Created</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {diagnosticsJobs.slice(0, 5).map((j) => (
                          <TableRow key={j.id}>
                            <TableCell><Chip label={j.status} size="small" /></TableCell>
                            <TableCell>
                              {j.createdAt ? new Date(j.createdAt).toLocaleString() : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
          </Paper>
        </Grid>
      </Grid>

      {/* Remote Start Dialog */}
      <Dialog
        open={remoteStartDialogOpen}
        onClose={() => setRemoteStartDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: (th) => sxObject(th, premiumDialogPaperSx) }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem' }}>Remote start</DialogTitle>
        <DialogContent>
          {remoteStartBlockedByConnectors && (
            <Alert severity="warning" sx={{ mb: 1 }}>
              No connector is Available or Preparing. Remote start will be blocked until the station reports a
              startable connector.
            </Alert>
          )}
          <TextField
            label="Connector ID"
            type="number"
            fullWidth
            margin="normal"
            value={remoteStartConnector ?? ''}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              setRemoteStartConnector(Number.isNaN(v) ? null : v);
            }}
            sx={(th) => sxObject(th, authFormFieldSx)}
          />
          <TextField
            label="IdTag"
            fullWidth
            margin="normal"
            value={remoteStartIdTag}
            onChange={(e) => setRemoteStartIdTag(e.target.value)}
            sx={(th) => sxObject(th, authFormFieldSx)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, flexWrap: 'wrap', gap: 1 }}>
          <Button onClick={() => setRemoteStartDialogOpen(false)} sx={(th) => sxObject(th, compactOutlinedCtaSx)}>
            Cancel
          </Button>
          <Button
            onClick={handleRemoteStart}
            variant="contained"
            disableElevation
            disabled={remoteStartSubmitDisabled}
            sx={(th) => sxObject(th, compactContainedCtaSx)}
          >
            Start
          </Button>
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <ChargePointSettingsDialog
        open={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
        chargePoint={chargePoint}
        onSave={loadData}
      />

      <Dialog
        open={configurationDialogOpen}
        onClose={() => setConfigurationDialogOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: (th) => sxObject(th, premiumDialogPaperSx) }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem' }}>
          Charge point configuration
        </DialogTitle>
        <DialogContent dividers>
          <Box
            component="pre"
            sx={(theme) => ({
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontSize: '0.75rem',
              lineHeight: 1.5,
              color: theme.palette.text.primary,
              backgroundColor: alpha(theme.palette.action.hover, 0.5),
              borderRadius: 1,
              p: 1.5,
            })}
          >
            {configurationPayload
              ? JSON.stringify(configurationPayload, null, 2)
              : 'No configuration returned.'}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, flexWrap: 'wrap', gap: 1 }}>
          <Button
            onClick={() => setConfigurationDialogOpen(false)}
            sx={(th) => sxObject(th, compactOutlinedCtaSx)}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: (th) => sxObject(th, premiumDialogPaperSx) }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem' }}>Confirm action</DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            {confirmAction?.type === 'reset'
              ? `Run a ${confirmAction.resetType.toLowerCase()} reset on this charge point?`
              : 'Clear the authorization cache for this charge point?'}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, flexWrap: 'wrap', gap: 1 }}>
          <Button onClick={() => setConfirmAction(null)} sx={(th) => sxObject(th, compactOutlinedCtaSx)}>
            Cancel
          </Button>
          <Button
            onClick={confirmDeviceAction}
            variant="contained"
            disableElevation
            sx={(th) => {
              const hard =
                confirmAction?.type === 'reset' && confirmAction.resetType === 'Hard';
              return hard
                ? { ...sxObject(th, compactErrorContainedCtaSx) }
                : { ...sxObject(th, compactContainedCtaSx) };
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


import { useState, useEffect, useCallback } from 'react';
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
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
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
import CableIcon from '@mui/icons-material/Cable';
import { useOpsBasePath } from '../../hooks/useOpsBasePath';
import { useStaffNavBack } from '../../hooks/useStaffNavBack';
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
import { formatApiOrNetworkError } from '../../utils/apiErrors';
import { getChargePointStatusColor } from '../../utils/statusColors';
import { AppBadge, chipColorToBadgeTone } from '../../components/ui/AppBadge';
import { AppEmptyState } from '../../components/ui/AppEmptyState';
import {
  formatSecondsSinceHeartbeat,
  getLinkStatusChipColor,
  getLinkStatusLabel,
  getLinkStatusTooltip,
} from '../../utils/chargePointLink';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { getStoredUser } from '../../utils/authSession';
import { LIVE_DATA_LABELS } from '../../constants/liveDataLabels';
import { logger } from '../../utils/logger';
import { OpsLiveDetailSkeleton } from '../../components/dashboard/RouteDetailSkeleton';
import { ChargerCellularGuide } from '../../components/ops/ChargerCellularGuide';
import { GroupedListSection } from '../../components/ios/GroupedListSection';
import { GroupedListRow } from '../../components/ios/GroupedListRow';

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
  const theme = useTheme();
  const useGroupedList = useMediaQuery(theme.breakpoints.down('md'));
  const showInlineStaffBack = useMediaQuery(theme.breakpoints.up('md'));
  const goBackToDevices = useCallback(() => navigate(`${opsBase}/devices`), [navigate, opsBase]);
  useStaffNavBack(goBackToDevices, 'Back to devices');
  const [chargePoint, setChargePoint] = useState<ChargePoint | null>(null);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [activeTransactions, setActiveTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
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
  const [detailTab, setDetailTab] = useState(0);
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

  const loadData = async (silent?: boolean) => {
    if (!id) return;
    const isQuiet = silent === true;
    try {
      if (isQuiet) setRefreshing(true);
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
      setUpdatedAt(Date.now());
    } catch (err: any) {
      setError(err.message || 'Failed to load charge point details');
      logger.error('Error loading charge point details:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
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
    if (chargePoint?.linkStatus !== 'online') {
      setError(
        'Get configuration requires CSMS link Online (open WebSocket). Reconnect the charger or wait for heartbeat, then try again.',
      );
      return;
    }
    try {
      setError(null);
      const config = await chargePointsApi.getConfiguration(id);
      setConfigurationPayload(config);
      setConfigurationDialogOpen(true);
      setSuccess('Configuration loaded');
    } catch (err: unknown) {
      setError(formatApiOrNetworkError(err));
    }
  };

  if (loading) {
    return <OpsLiveDetailSkeleton ariaLabel="Loading charge point details" />;
  }

  if (!chargePoint) {
    return (
      <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
        {showInlineStaffBack ? (
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={goBackToDevices}
            sx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), mb: 2, width: { xs: '100%', sm: 'auto' } })}
          >
            Back to devices
          </Button>
        ) : null}
        <Alert severity="error">Charge point not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <LivePageHeader
        title={chargePoint.chargePointId}
        subtitle="Device details, connectors, active transactions, and remote actions"
        updatedAt={updatedAt}
        liveLabel={LIVE_DATA_LABELS.device}
        showSeconds
        refreshing={refreshing}
        onRefresh={() => void loadData(true)}
        titleSx={dashboardPageTitleSx}
        subtitleSx={dashboardPageSubtitleSx}
        containerSx={{ mb: 2 }}
        refreshSx={{ width: { xs: '100%', sm: 'auto' } }}
        actions={
          <>
            {showInlineStaffBack ? (
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={goBackToDevices}
                sx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), width: { xs: '100%', sm: 'auto' } })}
              >
                Back
              </Button>
            ) : null}
            <Tooltip title={getLinkStatusTooltip(chargePoint)}>
              <AppBadge
                label={getLinkStatusLabel(chargePoint.linkStatus)}
                tone={chipColorToBadgeTone(getLinkStatusChipColor(chargePoint.linkStatus))}
                sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
              />
            </Tooltip>
            <AppBadge
              label={chargePoint.status}
              tone={chipColorToBadgeTone(getChargePointStatusColor(chargePoint.status))}
              sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
            />
          </>
        }
      />

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

      <Paper elevation={0} sx={{ ...premiumTableSurfaceSx, mb: 3 }}>
        <Tabs
          value={detailTab}
          onChange={(_, v) => setDetailTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          aria-label="Charge point sections"
          sx={{
            px: { xs: 1, sm: 2 },
            borderBottom: '1px solid',
            borderColor: 'divider',
            '& .MuiTab-root': { minHeight: 48, textTransform: 'none', fontWeight: 600 },
          }}
        >
          <Tab label="Overview" id="cp-tab-0" aria-controls="cp-tabpanel-0" />
          <Tab
            label={`Connectors${connectors.length ? ` (${connectors.length})` : ''}`}
            id="cp-tab-1"
            aria-controls="cp-tabpanel-1"
          />
          <Tab label="Actions" id="cp-tab-2" aria-controls="cp-tabpanel-2" />
          <Tab label="Maintenance" id="cp-tab-3" aria-controls="cp-tabpanel-3" />
        </Tabs>

        <Box
          role="tabpanel"
          hidden={detailTab !== 0}
          id="cp-tabpanel-0"
          aria-labelledby="cp-tab-0"
          sx={{ p: { xs: 2, sm: 2.5 } }}
        >
          {detailTab === 0 && (
            <Grid container spacing={2}>
              {chargePoint.linkStatus === 'offline' ? (
                <Grid item xs={12}>
                  <ChargerCellularGuide compact />
                </Grid>
              ) : null}
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5 }}>
                  CSMS link is live WebSocket + heartbeat. OCPP status is what the charger last reported. Connectors
                  appear after StatusNotification. Set GPS in Settings for the public Stations map.
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Paper elevation={0} sx={{ ...premiumPanelCardSx, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
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
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    SIM operator
                  </Typography>
                  <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    {chargePoint.cellularProvider || '—'}
                    {chargePoint.cellularProvider === 'MTN' && (
                      <AppBadge label="Recommended" tone="brand" sx={{ height: 22 }} />
                    )}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Cellular APN
                  </Typography>
                  <Typography variant="body1">{chargePoint.cellularApn || '—'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    ICCID
                  </Typography>
                  <Typography variant="body1" sx={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                    {chargePoint.iccid || '—'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    IMSI
                  </Typography>
                  <Typography variant="body1" sx={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                    {chargePoint.imsi || '—'}
                  </Typography>
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
            </Grid>
          )}
        </Box>
        <Box
          role="tabpanel"
          hidden={detailTab !== 1}
          id="cp-tabpanel-1"
          aria-labelledby="cp-tab-1"
          sx={{ p: { xs: 2, sm: 2.5 } }}
        >
          {detailTab === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                        <Paper elevation={0} sx={premiumTableSurfaceSx}>
                          <Box sx={{ px: { xs: 2, sm: 2.5 }, py: { xs: 1.75, sm: 2 }, borderBottom: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              Connectors
                            </Typography>
                          </Box>
                          {connectors.length === 0 ? (
                            <AppEmptyState
                              sx={{ border: 0, boxShadow: 'none', borderRadius: 0 }}
                              icon={<CableIcon />}
                              title="No connectors found"
                              description="Connector status appears after the charger reports StatusNotification."
                              primaryAction={{
                                label: 'Refresh status',
                                onClick: () => void loadData(true),
                                variant: 'secondary',
                              }}
                            />
                          ) : useGroupedList ? (
                            <Box sx={{ py: 1 }}>
                              <GroupedListSection>
                                {connectors.map((connector, index) => (
                                  <GroupedListRow
                                    key={connector.connectorId}
                                    divider={index < connectors.length - 1}
                                    showChevron={false}
                                    primary={`Connector ${connector.connectorId}`}
                                    secondary={`${connector.connectorType || '—'} · ${
                                      connector.powerRatingKw ? `${connector.powerRatingKw} kW` : '—'
                                    }`}
                                    end={
                                      <Box sx={{ textAlign: 'right', minWidth: 100 }}>
                                        <AppBadge
                                          label={connector.status}
                                          tone={chipColorToBadgeTone(getChargePointStatusColor(connector.status))}
                                          sx={{ height: 22, mb: 0.75, display: 'flex', ml: 'auto' }}
                                        />
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          startIcon={<LockOpenIcon sx={{ fontSize: 16 }} />}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            void handleUnlockConnector(connector.connectorId);
                                          }}
                                          disabled={chargePoint.linkStatus !== 'online'}
                                          sx={(th) => ({
                                            ...sxObject(th, compactOutlinedCtaSx),
                                            mb: 0.5,
                                            minHeight: 32,
                                            fontSize: '0.75rem',
                                            width: '100%',
                                          })}
                                        >
                                          Unlock
                                        </Button>
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            void handleChangeAvailability(
                                              connector.connectorId,
                                              connector.status === 'Unavailable' ? 'Operative' : 'Inoperative',
                                            );
                                          }}
                                          disabled={chargePoint.linkStatus !== 'online'}
                                          sx={(th) => ({
                                            ...sxObject(th, compactOutlinedCtaSx),
                                            minHeight: 32,
                                            fontSize: '0.75rem',
                                            width: '100%',
                                          })}
                                        >
                                          {connector.status === 'Unavailable' ? 'Enable' : 'Disable'}
                                        </Button>
                                      </Box>
                                    }
                                  />
                                ))}
                              </GroupedListSection>
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
                                        <AppBadge
                                          label={connector.status}
                                          tone={chipColorToBadgeTone(getChargePointStatusColor(connector.status))}
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
                                            disabled={chargePoint.linkStatus !== 'online'}
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
                                            disabled={chargePoint.linkStatus !== 'online'}
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
                            {useGroupedList ? (
                              <Box sx={{ py: 1 }}>
                                <GroupedListSection>
                                  {activeTransactions.map((tx, index) => (
                                    <GroupedListRow
                                      key={tx.transactionId}
                                      divider={index < activeTransactions.length - 1}
                                      showChevron
                                      primary={`Session #${tx.transactionId}`}
                                      secondary={`Connector ${tx.connectorId} · ${formatEnergyKwh(tx.totalEnergyKwh, 3)}`}
                                      end={
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          disableElevation
                                          startIcon={<StopIcon sx={{ fontSize: 16 }} />}
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            try {
                                              await chargePointsApi.remoteStop(id!, tx.transactionId);
                                              loadData();
                                            } catch (err: unknown) {
                                              const errObj = err as {
                                                response?: { data?: { message?: unknown } };
                                                message?: string;
                                              };
                                              const raw = errObj.response?.data?.message;
                                              const msg =
                                                typeof raw === 'string'
                                                  ? raw
                                                  : Array.isArray(raw)
                                                    ? raw.join(', ')
                                                    : errObj.message || 'Failed to stop transaction';
                                              setError(msg);
                                            }
                                          }}
                                          sx={(th) => ({
                                            ...sxObject(th, compactOutlinedCtaSx),
                                            minHeight: 32,
                                            fontSize: '0.75rem',
                                            borderColor: 'error.main',
                                            color: 'error.main',
                                          })}
                                        >
                                          Stop
                                        </Button>
                                      }
                                      onClick={() =>
                                        navigate(`${opsBase}/sessions/${tx.transactionId}`)
                                      }
                                      aria-label={`Open session ${tx.transactionId}`}
                                    />
                                  ))}
                                </GroupedListSection>
                              </Box>
                            ) : (
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
                                        <TableCell>{formatEnergyKwh(tx.totalEnergyKwh, 3)}</TableCell>
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
                            )}
                          </Paper>
                        </Grid>
                      )}
            </Grid>
          )}
        </Box>
        <Box
          role="tabpanel"
          hidden={detailTab !== 2}
          id="cp-tabpanel-2"
          aria-labelledby="cp-tab-2"
          sx={{ p: { xs: 2, sm: 2.5 } }}
        >
          {detailTab === 2 && (
            <Grid container spacing={2}>
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
                      disabled={chargePoint.linkStatus !== 'online' || remoteStartBlockedByConnectors}
                      sx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), width: '100%' })}
                    >
                      Remote start
                    </Button>
                  </span>
                </Tooltip>
                {clearStaleOperationalAvailable && (
                  <Tooltip title="No active billing session: resets connector and charge point operational state when the UI is stuck after disconnect or a failed remote flow.">
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
                          chargePoint.linkStatus !== 'online' || clearStaleSubmitting || loading
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
                  disabled={chargePoint.linkStatus !== 'online'}
                  sx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), width: '100%' })}
                >
                  Get configuration
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={() => handleReset('Soft')}
                  disabled={chargePoint.linkStatus !== 'online' || loading}
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
                  disabled={chargePoint.linkStatus !== 'online' || loading}
                  sx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), width: '100%' })}
                >
                  Reset (hard)
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleClearCache}
                  disabled={chargePoint.linkStatus !== 'online' || loading}
                  sx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), width: '100%' })}
                >
                  Clear cache
                </Button>
              </Box>
          </Paper>
              </Grid>
            </Grid>
          )}
        </Box>
        <Box
          role="tabpanel"
          hidden={detailTab !== 3}
          id="cp-tabpanel-3"
          aria-labelledby="cp-tab-3"
          sx={{ p: { xs: 2, sm: 2.5 } }}
        >
          {detailTab === 3 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                        <Paper elevation={0} sx={premiumPanelCardSx}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CloudUploadIcon fontSize="small" color="primary" /> Firmware update
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
                              <TextField
                                label="Firmware URL"
                                placeholder="https://…"
                                value={firmwareLocation}
                                onChange={(e) => setFirmwareLocation(e.target.value)}
                                sx={(th) => sxObject(th, authFormFieldSx)}
                              />
                              <TextField
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
                                disabled={chargePoint.linkStatus !== 'online' || firmwareLoading || !firmwareLocation}
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
                                {useGroupedList ? (
                                  <GroupedListSection>
                                    {firmwareJobs.slice(0, 5).map((j, index, arr) => (
                                      <GroupedListRow
                                        key={j.id}
                                        divider={index < arr.length - 1}
                                        showChevron={false}
                                        primary={j.status}
                                        secondary={
                                          j.retrieveDate ? new Date(j.retrieveDate).toLocaleString() : 'No date'
                                        }
                                      />
                                    ))}
                                  </GroupedListSection>
                                ) : (
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
                                            <TableCell>
                                              <AppBadge label={j.status} tone="neutral" />
                                            </TableCell>
                                            <TableCell>
                                              {j.retrieveDate ? new Date(j.retrieveDate).toLocaleString() : '-'}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </TableContainer>
                                )}
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
                                disabled={chargePoint.linkStatus !== 'online' || diagnosticsLoading || !diagnosticsLocation}
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
                                {useGroupedList ? (
                                  <GroupedListSection>
                                    {diagnosticsJobs.slice(0, 5).map((j, index, arr) => (
                                      <GroupedListRow
                                        key={j.id}
                                        divider={index < arr.length - 1}
                                        showChevron={false}
                                        primary={j.status}
                                        secondary={
                                          j.createdAt ? new Date(j.createdAt).toLocaleString() : 'No date'
                                        }
                                      />
                                    ))}
                                  </GroupedListSection>
                                ) : (
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
                                            <TableCell>
                                              <AppBadge label={j.status} tone="neutral" />
                                            </TableCell>
                                            <TableCell>
                                              {j.createdAt ? new Date(j.createdAt).toLocaleString() : '-'}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </TableContainer>
                                )}
                              </Box>
                            )}
                        </Paper>
              </Grid>
            </Grid>
          )}
        </Box>
      </Paper>

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


import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Grid,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Badge,
  MenuItem,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import EvStationIcon from '@mui/icons-material/EvStation';
import BugReportIcon from '@mui/icons-material/BugReport';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import FilterListIcon from '@mui/icons-material/FilterList';
import HealingIcon from '@mui/icons-material/Healing';
import { alpha } from '@mui/material/styles';
import { useOpsBasePath } from '../../hooks/useOpsBasePath';
import { staffHelpPath } from '../../config/staffNav.paths';
import { chargePointsApi, ChargePoint } from '../../services/chargePointsApi';
import { vendorApi, Vendor } from '../../services/vendorApi';
import { connectionLogsApi, ConnectionLog, ConnectionStatistics } from '../../services/connectionLogsApi';
import { premiumPanelCardSx, premiumTableSurfaceSx } from '../../theme/jampackShell';
import {
  authFormFieldSx,
  staffFilterFieldSx,
  compactContainedCtaSx,
  compactOutlinedCtaSx,
  premiumDialogPaperSx,
  premiumIconButtonTouchSx,
  sxObject,
} from '../../styles/authShell';
import {
  getChargePointStatusColor,
  getConnectionEventColor,
  getConnectionStatusColor,
} from '../../utils/statusColors';
import {
  countByLinkStatus,
  formatSecondsSinceHeartbeat,
  getLinkStatusChipColor,
  getLinkStatusLabel,
  getLinkStatusTooltip,
  type ChargePointLinkStatus,
} from '../../utils/chargePointLink';
import {
  mergeChargePointLinkUpdate,
  useChargePointLinkRealtime,
} from '../../hooks/useChargePointLinkRealtime';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { StaffFilterBar } from '../../components/dashboard/StaffFilterBar';
import { StaffStatusTabs } from '../../components/dashboard/StaffStatusTabs';
import { AppEmptyState } from '../../components/ui/AppEmptyState';
import { AppBadge, chipColorToBadgeTone } from '../../components/ui/AppBadge';
import { useStaffPullRefresh } from '../../hooks/useStaffPullRefresh';
import { staffLargeSubtitleSx, staffLargeTitleSx } from '../../theme/staffChrome';
import { getStoredUser } from '../../utils/authSession';
import { LIVE_DATA_LABELS } from '../../constants/liveDataLabels';
import {
  DashboardStaffChromeSkeleton,
  StaffChromeTabPanelSkeleton,
} from '../../components/dashboard/DashboardStaffChromeSkeleton';
import { DialogDenseRowsSkeleton } from '../../components/dashboard/BlockContentSkeletons';
import { GroupedListSection } from '../../components/ios/GroupedListSection';
import { GroupedListRow } from '../../components/ios/GroupedListRow';
import { StaffBulkBar, StaffSelectCheckbox } from '../../components/dashboard/StaffBulkBar';
import { useStaffSelection } from '../../hooks/useStaffSelection';
import { downloadCsv } from '../../utils/reportExport';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`devices-tabpanel-${index}`}
      aria-labelledby={`devices-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: { xs: 2, sm: 3 }, px: { xs: 0, sm: 0 } }}>{children}</Box>}
    </div>
  );
}

/** API may return decimals as strings; avoid calling .toFixed on non-numbers. */
function formatLatLngPair(lat: unknown, lng: unknown): string | null {
  const a = typeof lat === 'number' && !Number.isNaN(lat) ? lat : parseFloat(String(lat ?? ''));
  const b = typeof lng === 'number' && !Number.isNaN(lng) ? lng : parseFloat(String(lng ?? ''));
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return `${a.toFixed(6)}, ${b.toFixed(6)}`;
}

function chargePointHasMapCoords(cp: ChargePoint): boolean {
  return formatLatLngPair(cp.locationLatitude, cp.locationLongitude) !== null;
}

/** OCPP-style numeric charge point identity (serial often omitted until BootNotification fills it). */
function looksLikeNumericChargePointIdentity(id: string): boolean {
  return /^\d{14,20}$/.test(id);
}

export function DevicesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const useGroupedList = useMediaQuery(theme.breakpoints.down('md'));
  const opsBase = useOpsBasePath();
  const [chargePoints, setChargePoints] = useState<ChargePoint[]>([]);
  const [filteredChargePoints, setFilteredChargePoints] = useState<ChargePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [showOnlyFieldProvisioned, setShowOnlyFieldProvisioned] = useState(false);
  const [linkFilter, setLinkFilter] = useState<'all' | ChargePointLinkStatus>('all');
  
  // Connection logs state
  const [selectedChargePoint, setSelectedChargePoint] = useState<ChargePoint | null>(null);
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [connectionLogs, setConnectionLogs] = useState<ConnectionLog[]>([]);
  const [connectionStats, setConnectionStats] = useState<ConnectionStatistics | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [recentErrors, setRecentErrors] = useState<ConnectionLog[]>([]);

  const [deleteTarget, setDeleteTarget] = useState<ChargePoint | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [clearStaleSubmittingId, setClearStaleSubmittingId] = useState<string | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerSubmitting, setRegisterSubmitting] = useState(false);
  const [registerVendors, setRegisterVendors] = useState<Vendor[]>([]);
  const [registerForm, setRegisterForm] = useState({
    chargePointId: '',
    vendorId: '',
    model: '',
    serialNumber: '',
    locationAddress: '',
  });

  const canUserDeleteDevice = (cp: ChargePoint): boolean => {
    const user = getStoredUser();
    const role = user?.accountType;
    if (role === 'SuperAdmin') {
      return true;
    }
    if (role === 'Admin' && typeof user?.vendorId === 'number' && typeof cp.vendorId === 'number') {
      return cp.vendorId === user.vendorId;
    }
    return false;
  };

  const deleteDisabledReason = (cp: ChargePoint): string | null => {
    if (!canUserDeleteDevice(cp)) {
      return null;
    }
    const active = cp.activeTransactionCount ?? 0;
    if (active > 0) {
      return 'This device has an active billing session. Remote stop the session (or end it from Charging Sessions) before removing it.';
    }
    return null;
  };

  const canClearStaleChargingUi = (cp: ChargePoint): boolean => {
    if (!canUserDeleteDevice(cp)) return false;
    const active = cp.activeTransactionCount ?? 0;
    if (active > 0) return false;
    return cp.status === 'Charging' || cp.status === 'Preparing';
  };

  const handleClearStaleOperationalState = async (cp: ChargePoint) => {
    try {
      setClearStaleSubmittingId(cp.chargePointId);
      setError(null);
      const res = await chargePointsApi.clearStaleOperationalState(cp.chargePointId);
      setSuccess(
        `Cleared stuck operational state for ${cp.chargePointId} (${res.clearedConnectors} connector(s); status ${res.chargePointStatus}).`,
      );
      await loadChargePoints();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string | string[] } }; message?: string };
      const msg =
        e.response?.data?.message ||
        (Array.isArray(e.response?.data?.message) ? e.response.data.message.join(', ') : null) ||
        e.message ||
        'Failed to clear stuck state';
      setError(typeof msg === 'string' ? msg : 'Failed to clear stuck state');
    } finally {
      setClearStaleSubmittingId(null);
    }
  };

  const openDeleteDialog = (cp: ChargePoint) => {
    setDeleteTarget(cp);
    setDeleteDialogOpen(true);
    setError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteSubmitting(true);
      setError(null);
      await chargePointsApi.delete(deleteTarget.chargePointId);
      setSuccess(`Removed charge point ${deleteTarget.chargePointId}.`);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      await loadChargePoints();
      await loadRecentErrors();
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        (Array.isArray(err.response?.data?.message) ? err.response.data.message.join(', ') : null) ||
        err.message ||
        'Failed to delete device';
      setError(msg);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  useEffect(() => {
    loadChargePoints();
    loadRecentErrors();
  }, []);

  useEffect(() => {
    if (!registerOpen) return;
    const user = getStoredUser();
    if (user?.accountType !== 'SuperAdmin') return;
    void vendorApi
      .getAll()
      .then(setRegisterVendors)
      .catch(() => setRegisterVendors([]));
  }, [registerOpen]);

  const applyLinkRealtime = useCallback((payload: Parameters<typeof mergeChargePointLinkUpdate>[1]) => {
    setChargePoints((prev) => mergeChargePointLinkUpdate(prev, payload));
    setUpdatedAt(Date.now());
  }, []);

  useChargePointLinkRealtime(applyLinkRealtime);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadChargePoints(true);
    }, 60000);
    return () => window.clearInterval(interval);
  }, [searchTerm]);

  // Excludes known catalog import ID patterns; field-provisioned = vendor/serial, numeric OCPP id (14–20 digits), or assigned vendorId.
  const isRealDevice = (cp: ChargePoint): boolean => {
    const catalogImportIdPattern = /^CP-(ACC|ASH|WES)-\d{3}$/;
    if (catalogImportIdPattern.test(cp.chargePointId)) {
      return false;
    }

    // OCPP-style numeric id (e.g. station serial) counts as a field device even if Boot left vendorName empty.
    if (looksLikeNumericChargePointIdentity(cp.chargePointId)) {
      return true;
    }

    if (typeof cp.vendorId === 'number' && cp.vendorId > 0) {
      return true;
    }

    if (!cp.vendorName && !cp.vendor) {
      return false;
    }

    if (cp.serialNumber) {
      return true;
    }

    return false;
  };

  const inventoryTypeTooltip = (cp: ChargePoint): string => {
    const catalogImportPattern = /^CP-(ACC|ASH|WES)-\d{3}$/;
    if (catalogImportPattern.test(cp.chargePointId)) {
      return 'Catalog-style import ID. Hide these with the field-devices filter in production';
    }
    if (isRealDevice(cp)) {
      return chargePointHasMapCoords(cp)
        ? 'Field device with map coordinates'
        : 'Field device — set coordinates on the device page for the public map';
    }
    if (!cp.vendorName && !cp.vendor) {
      return 'Incomplete: assign a vendor';
    }
    return 'Pending provisioning: vendor and serial, or 14–20 digit charge point id from the station (BootNotification)';
  };

  useEffect(() => {
    // Filter by search term and optional field-provisioned filter
    let filtered = chargePoints;

    // Apply field-provisioned filter first
    if (showOnlyFieldProvisioned) {
      filtered = filtered.filter(isRealDevice);
    }

    // Then apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (cp) =>
          cp.chargePointId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ((cp.vendorName || cp.vendor) && (cp.vendorName || cp.vendor)?.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (cp.model && cp.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (cp.serialNumber && cp.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())),
      );
    }

    if (linkFilter !== 'all') {
      filtered = filtered.filter((cp) => cp.linkStatus === linkFilter);
    }

    filtered.sort((a, b) => {
      const order: Record<string, number> = {
        online: 0,
        stale: 1,
        offline: 2,
        never_seen: 3,
      };
      const ao = order[a.linkStatus ?? 'never_seen'] ?? 4;
      const bo = order[b.linkStatus ?? 'never_seen'] ?? 4;
      if (ao !== bo) return ao - bo;
      return a.chargePointId.localeCompare(b.chargePointId);
    });

    setFilteredChargePoints(filtered);
  }, [searchTerm, chargePoints, showOnlyFieldProvisioned, linkFilter]);

  const loadChargePoints = async (silent?: boolean) => {
    const isQuiet = silent === true;
    try {
      if (isQuiet) setRefreshing(true);
      setError(null);
      const data = await chargePointsApi.getAll(searchTerm || undefined);
      setChargePoints(data);
      setFilteredChargePoints(data);
      setUpdatedAt(Date.now());
    } catch (err: any) {
      setError(err.message || 'Failed to load charge points');
      console.error('Error loading charge points:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshDevicesPage = useCallback(() => {
    void loadChargePoints(true);
  }, [searchTerm]);

  useStaffPullRefresh(refreshDevicesPage);

  const loadRecentErrors = async () => {
    try {
      const errors = await connectionLogsApi.getRecentErrors(10);
      setRecentErrors(errors);
    } catch (err) {
      // Silently fail - errors are not critical
      console.error('Error loading recent errors:', err);
    }
  };

  const handleClearResolvedErrors = async () => {
    try {
      const result = await connectionLogsApi.deleteResolvedErrors(1); // Clear errors older than 1 hour that are resolved
      if (result.deleted > 0) {
        setError(null);
        // Reload errors to refresh the list
        await loadRecentErrors();
        setSuccess(`Cleared ${result.deleted} resolved error(s).`);
      } else {
        setSuccess('No resolved errors found to clear.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to clear resolved errors');
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadChargePoints(true);
      return;
    }

    setRefreshing(true);
    try {
      setError(null);
      const data = await chargePointsApi.getAll(searchTerm);
      setChargePoints(data);
      setFilteredChargePoints(data);
      setUpdatedAt(Date.now());
    } catch (err: any) {
      setError(err.message || 'Failed to search charge points');
    } finally {
      setRefreshing(false);
    }
  };

  const handleViewLogs = async (chargePoint: ChargePoint) => {
    setSelectedChargePoint(chargePoint);
    setLogsDialogOpen(true);
    setLogsLoading(true);

    try {
      const [logs, stats] = await Promise.all([
        connectionLogsApi.getLogs(chargePoint.chargePointId, undefined, 50),
        connectionLogsApi.getStatistics(chargePoint.chargePointId),
      ]);
      setConnectionLogs(logs.logs);
      setConnectionStats(stats);
    } catch (err: any) {
      setError(err.message || 'Failed to load connection logs');
    } finally {
      setLogsLoading(false);
    }
  };

  const visibleDeviceIds = useMemo(
    () => filteredChargePoints.map((cp) => cp.chargePointId),
    [filteredChargePoints],
  );
  const selection = useStaffSelection(visibleDeviceIds);

  const openRegisterDialog = () => {
    const user = getStoredUser();
    setRegisterForm({
      chargePointId: '',
      vendorId: user?.accountType === 'Admin' && user.vendorId ? String(user.vendorId) : '',
      model: '',
      serialNumber: '',
      locationAddress: '',
    });
    setRegisterOpen(true);
  };

  const handleRegisterDevice = async () => {
    const chargePointId = registerForm.chargePointId.trim();
    if (!chargePointId) {
      setError('Charge point ID is required.');
      return;
    }
    const user = getStoredUser();
    const vendorIdRaw =
      registerForm.vendorId ||
      (user?.accountType === 'Admin' && user.vendorId ? String(user.vendorId) : '');
    const vendorId = vendorIdRaw ? Number(vendorIdRaw) : undefined;
    if (!vendorId) {
      setError('Choose a vendor before registering the device.');
      return;
    }
    try {
      setRegisterSubmitting(true);
      setError(null);
      const created = await chargePointsApi.create({
        chargePointId,
        vendorId,
        model: registerForm.model.trim() || undefined,
        serialNumber: registerForm.serialNumber.trim() || undefined,
        locationAddress: registerForm.locationAddress.trim() || undefined,
      });
      setRegisterOpen(false);
      setSuccess(`Registered ${created.chargePointId}. Add coordinates so it appears on the public map.`);
      await loadChargePoints();
      navigate(`${opsBase}/devices/${encodeURIComponent(created.chargePointId)}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string | string[] } }; message?: string };
      const msg =
        e.response?.data?.message ||
        (Array.isArray(e.response?.data?.message) ? e.response.data.message.join(', ') : null) ||
        e.message ||
        'Failed to register device';
      setError(typeof msg === 'string' ? msg : 'Failed to register device');
    } finally {
      setRegisterSubmitting(false);
    }
  };

  if (loading) {
    return <DashboardStaffChromeSkeleton preset="devices" />;
  }

  const getErrorCount = (chargePointId: string) => {
    return recentErrors.filter((log) => log.chargePointId === chargePointId).length;
  };

  const fieldDevices = chargePoints.filter(isRealDevice);
  const linkScope = showOnlyFieldProvisioned ? fieldDevices : chargePoints;
  const linkCounts = countByLinkStatus(linkScope);

  const exportSelectedDevices = () => {
    const selectedDevices = filteredChargePoints.filter((cp) => selection.isSelected(cp.chargePointId));
    downloadCsv(
      `devices-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'Charge point ID',
        'Vendor',
        'Model',
        'Serial',
        'Firmware',
        'OCPP status',
        'Link status',
        'Address',
        'Last heartbeat',
        'Active sessions',
      ],
      selectedDevices.map((cp) => [
        cp.chargePointId,
        cp.vendorName || cp.vendor || '',
        cp.model || '',
        cp.serialNumber || '',
        cp.firmwareVersion || '',
        cp.status,
        getLinkStatusLabel(cp.linkStatus),
        cp.locationAddress || '',
        cp.lastHeartbeat || '',
        cp.activeTransactionCount ?? 0,
      ]),
    );
  };

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <LivePageHeader
        title="Device Inventory"
        subtitle="CSMS link shows live WebSocket + heartbeat. OCPP status (Available, Charging, …) is separate. Updates live over Socket.IO; refreshes every 60s as fallback."
        updatedAt={updatedAt}
        liveLabel={LIVE_DATA_LABELS.devices}
        showSeconds
        refreshing={refreshing}
        onRefresh={refreshDevicesPage}
        titleVariant="large"
        titleSx={staffLargeTitleSx}
        subtitleSx={staffLargeSubtitleSx}
        showToolbarRefreshOnMobile
        containerSx={{ mb: 2 }}
        refreshSx={{ width: { xs: '100%', sm: 'auto' }, whiteSpace: { sm: 'nowrap' } }}
        actions={
          <Button
            variant="contained"
            disableElevation
            startIcon={<AddIcon />}
            onClick={openRegisterDialog}
            sx={(th) => ({
              ...sxObject(th, compactContainedCtaSx),
              width: { xs: '100%', sm: 'auto' },
            })}
          >
            Register device
          </Button>
        }
      />

      <StaffFilterBar aria-label="Device filters">
        <TextField
          placeholder="Search devices..."
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => {
                    setSearchTerm('');
                    loadChargePoints();
                  }}
                  aria-label="Clear device search"
                  sx={(th) => ({ ...sxObject(th, premiumIconButtonTouchSx) })}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={(th) => ({
            ...sxObject(th, staffFilterFieldSx),
            minWidth: { xs: 0, sm: 260 },
            flex: { sm: '1 1 240px' },
            maxWidth: { sm: 400 },
          })}
        />
        <Button
          variant={showOnlyFieldProvisioned ? 'contained' : 'outlined'}
          disableElevation={showOnlyFieldProvisioned}
          startIcon={<FilterListIcon />}
          onClick={() => setShowOnlyFieldProvisioned(!showOnlyFieldProvisioned)}
          sx={(th) => ({
            ...sxObject(th, showOnlyFieldProvisioned ? compactContainedCtaSx : compactOutlinedCtaSx),
            width: { xs: '100%', sm: 'auto' },
            whiteSpace: { sm: 'nowrap' },
          })}
        >
          {showOnlyFieldProvisioned ? 'Show all' : 'Field devices only'}
        </Button>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0.75,
            width: { xs: '100%', sm: 'auto' },
            alignItems: 'center',
            flex: { sm: '1 1 280px' },
          }}
        >
          <StaffStatusTabs
            aria-label="CSMS link filter"
            value={linkFilter}
            onChange={setLinkFilter}
            options={[
              { value: 'all', label: 'All links', count: linkScope.length },
              { value: 'online', label: 'Online', count: linkCounts.online },
              { value: 'stale', label: 'Recent off', count: linkCounts.stale },
              { value: 'offline', label: 'Offline', count: linkCounts.offline },
              { value: 'never_seen', label: 'Never', count: linkCounts.never_seen },
            ]}
          />
        </Box>
      </StaffFilterBar>

      {error && (
        <Alert severity="error" sx={{ mt: 2, mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mt: 2, mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Paper elevation={0} sx={premiumTableSurfaceSx}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          aria-label="Device inventory sections"
          sx={{
            px: { xs: 1, sm: 2 },
            borderBottom: '1px solid',
            borderColor: 'divider',
            '& .MuiTab-root': { minHeight: 48, textTransform: 'none', fontWeight: 600 },
          }}
        >
          <Tab label="All devices" id="devices-tab-0" aria-controls="devices-tabpanel-0" />
          <Tab 
            label={
              <Badge badgeContent={recentErrors.length} color="error">
                Recent errors
              </Badge>
            }
            id="devices-tab-1"
            aria-controls="devices-tabpanel-1"
          />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          {loading ? (
            <StaffChromeTabPanelSkeleton rows={8} ariaLabel="Loading devices" />
          ) : filteredChargePoints.length === 0 ? (
            <AppEmptyState
              sx={{ m: { xs: 2, sm: 2 }, boxShadow: 'none' }}
              icon={<EvStationIcon />}
              title={
                showOnlyFieldProvisioned
                  ? 'No field devices in this list'
                  : searchTerm
                    ? 'No devices match your search'
                    : 'No charge points yet'
              }
              description={
                showOnlyFieldProvisioned
                  ? 'Field-provisioned rows: vendor set, and either a serial from the station or a long numeric charge point id. The filter hides catalog import ids (CP-ACC-*, CP-ASH-*, CP-WES-*).'
                  : searchTerm
                    ? 'Try another term or clear search to see all devices.'
                    : 'Devices appear after BootNotification or registration. Set coordinates so they also show on the public Stations map.'
              }
              primaryAction={
                showOnlyFieldProvisioned || searchTerm
                  ? {
                      label: showOnlyFieldProvisioned ? 'Show all devices' : 'Clear search',
                      onClick: () => {
                        if (showOnlyFieldProvisioned) setShowOnlyFieldProvisioned(false);
                        if (searchTerm) {
                          setSearchTerm('');
                          loadChargePoints();
                        }
                      },
                      variant: 'secondary',
                    }
                  : {
                      label: 'Register device',
                      onClick: openRegisterDialog,
                      startIcon: <AddIcon />,
                    }
              }
              secondaryAction={
                showOnlyFieldProvisioned || searchTerm
                  ? undefined
                  : {
                      label: 'Learn how',
                      onClick: () => navigate(staffHelpPath(location.pathname)),
                      variant: 'secondary',
                    }
              }
            />
          ) : (
            <>
              {showOnlyFieldProvisioned && (
                <Alert
                  severity="info"
                  sx={{ mt: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center', gap: 1, '& .MuiAlert-message': { width: { xs: '100%', sm: 'auto' } } }}
                >
                  Showing only field-provisioned devices (vendor + serial or numeric OCPP-style id). The public map still needs coordinates on each device.
                  <Button 
                    size="small" 
                    onClick={() => setShowOnlyFieldProvisioned(false)}
                    sx={{ ml: { xs: 0, sm: 2 }, width: { xs: '100%', sm: 'auto' } }}
                  >
                    Show all
                  </Button>
                </Alert>
              )}
              <Box
                sx={{
                  mt: 2,
                  mb: 1,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  alignItems: 'center',
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mr: 0.5 }}>
                  CSMS link
                </Typography>
                <AppBadge label={`${linkCounts.online} online`} tone="success" />
                <AppBadge label={`${linkCounts.stale} recent off`} tone="warning" />
                <AppBadge label={`${linkCounts.offline} offline`} tone="error" />
                <AppBadge label={`${linkCounts.never_seen} never`} tone="neutral" />
              </Box>
              <StaffBulkBar
                count={selection.selectedCount}
                onClear={selection.clear}
                actions={[{ label: 'Export', onClick: exportSelectedDevices, variant: 'primary' }]}
              />
            {useGroupedList ? (
              <Box sx={{ mt: 1, py: 1 }}>
                {filteredChargePoints.length > 0 ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', px: 1, minHeight: 44 }}>
                    <StaffSelectCheckbox
                      checked={selection.allSelected}
                      indeterminate={selection.someSelected}
                      onChange={() => selection.toggleAll()}
                      label="Select all devices"
                    />
                    <Typography variant="body2" color="text.secondary">
                      Select all
                    </Typography>
                  </Box>
                ) : null}
                <GroupedListSection>
                  {filteredChargePoints.map((cp, index) => (
                    <GroupedListRow
                      key={cp.chargePointId}
                      divider={index < filteredChargePoints.length - 1}
                      leading={
                        <StaffSelectCheckbox
                          checked={selection.isSelected(cp.chargePointId)}
                          onChange={() => selection.toggle(cp.chargePointId)}
                          label={`Select ${cp.chargePointId}`}
                        />
                      }
                      primary={cp.chargePointId}
                      secondary={`${cp.vendorName || cp.vendor || 'No vendor'} · ${cp.model || '—'}`}
                      end={
                        <Box sx={{ textAlign: 'right' }}>
                          <AppBadge
                            label={getLinkStatusLabel(cp.linkStatus)}
                            tone={chipColorToBadgeTone(getLinkStatusChipColor(cp.linkStatus))}
                            sx={{ height: 22, mb: 0.5 }}
                          />
                          <AppBadge
                            label={cp.status}
                            tone={chipColorToBadgeTone(getChargePointStatusColor(cp.status))}
                            sx={{ height: 22, display: 'flex', ml: 'auto' }}
                          />
                        </Box>
                      }
                      onClick={() =>
                        navigate(`${opsBase}/devices/${encodeURIComponent(cp.chargePointId)}`)
                      }
                      aria-label={`Open device ${cp.chargePointId}`}
                    />
                  ))}
                </GroupedListSection>
              </Box>
            ) : (
            <TableContainer sx={{ mt: 2, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <StaffSelectCheckbox
                        checked={selection.allSelected}
                        indeterminate={selection.someSelected}
                        onChange={() => selection.toggleAll()}
                        label="Select all devices"
                      />
                    </TableCell>
                    <TableCell>Device</TableCell>
                    <TableCell>Connection</TableCell>
                    <TableCell>OCPP</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredChargePoints.map((cp) => {
                    const errorCount = getErrorCount(cp.chargePointId);
                    const isReal = isRealDevice(cp);
                    const onCustomerMap = chargePointHasMapCoords(cp);

                    return (
                      <TableRow
                        key={cp.chargePointId}
                        hover
                        sx={{
                          '&:hover': {
                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                          },
                        }}
                      >
                        <TableCell padding="checkbox">
                          <StaffSelectCheckbox
                            checked={selection.isSelected(cp.chargePointId)}
                            onChange={() => selection.toggle(cp.chargePointId)}
                            label={`Select ${cp.chargePointId}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, minWidth: 0 }}>
                            <Tooltip title={inventoryTypeTooltip(cp)}>
                              <Box component="span" sx={{ mt: 0.25, flexShrink: 0 }}>
                                {isReal ? (
                                  <CheckCircleIcon color="success" fontSize="small" />
                                ) : (
                                  <WarningIcon color="warning" fontSize="small" />
                                )}
                              </Box>
                            </Tooltip>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={600} noWrap>
                                {cp.chargePointId}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                {[cp.vendorName || cp.vendor || 'No vendor', cp.model, cp.serialNumber]
                                  .filter(Boolean)
                                  .join(' · ')}
                                {cp.firmwareVersion ? ` · FW ${cp.firmwareVersion}` : ''}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={getLinkStatusTooltip(cp)}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
                              <AppBadge
                                label={getLinkStatusLabel(cp.linkStatus)}
                                tone={chipColorToBadgeTone(getLinkStatusChipColor(cp.linkStatus))}
                              />
                              {cp.lastHeartbeat ? (
                                <Tooltip title={new Date(cp.lastHeartbeat).toLocaleString()}>
                                  <Typography
                                    variant="caption"
                                    color={cp.heartbeatStale ? 'warning.main' : 'text.secondary'}
                                  >
                                    {formatSecondsSinceHeartbeat(cp.secondsSinceHeartbeat ?? null)}
                                  </Typography>
                                </Tooltip>
                              ) : (
                                <Typography variant="caption" color="text.secondary" fontStyle="italic">
                                  No heartbeat
                                </Typography>
                              )}
                            </Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <AppBadge
                            label={cp.status}
                            tone={chipColorToBadgeTone(getChargePointStatusColor(cp.status))}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
                            <Typography variant="body2">
                              {cp.locationAddress ||
                                formatLatLngPair(cp.locationLatitude, cp.locationLongitude) ||
                                '—'}
                            </Typography>
                            <AppBadge
                              label={onCustomerMap ? 'On customer map' : 'Not on map (no GPS)'}
                              tone={onCustomerMap ? 'success' : 'neutral'}
                              sx={{ height: 22, fontSize: '0.7rem', maxWidth: '100%' }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
                            <Tooltip title="View details">
                              <IconButton
                                onClick={() =>
                                  navigate(`${opsBase}/devices/${encodeURIComponent(cp.chargePointId)}`)
                                }
                                color="primary"
                                aria-label={`View details for ${cp.chargePointId}`}
                                sx={(th) => ({ ...sxObject(th, premiumIconButtonTouchSx) })}
                              >
                                <SearchIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Connection logs & debug">
                              <IconButton
                                onClick={() => handleViewLogs(cp)}
                                color={errorCount > 0 ? 'error' : 'default'}
                                aria-label={`View connection logs for ${cp.chargePointId}`}
                                sx={(th) => ({ ...sxObject(th, premiumIconButtonTouchSx) })}
                              >
                                <Badge badgeContent={errorCount} color="error">
                                  <BugReportIcon fontSize="small" />
                                </Badge>
                              </IconButton>
                            </Tooltip>
                            {canClearStaleChargingUi(cp) && (
                              <Tooltip
                                title="No active session in the database: reset connector/charge-point status so you can remove the device or start fresh."
                              >
                                <span>
                                  <IconButton
                                    onClick={() => handleClearStaleOperationalState(cp)}
                                    disabled={clearStaleSubmittingId === cp.chargePointId}
                                    color="warning"
                                    aria-label={`Clear stuck charging state for ${cp.chargePointId}`}
                                    sx={(th) => ({ ...sxObject(th, premiumIconButtonTouchSx) })}
                                  >
                                    {clearStaleSubmittingId === cp.chargePointId ? (
                                      <CircularProgress size={20} color="inherit" />
                                    ) : (
                                      <HealingIcon fontSize="small" />
                                    )}
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}
                            {canUserDeleteDevice(cp) && (
                              <Tooltip title={deleteDisabledReason(cp) || 'Remove device from CSMS'}>
                                <span>
                                  <IconButton
                                    onClick={() => openDeleteDialog(cp)}
                                    color="error"
                                    disabled={Boolean(deleteDisabledReason(cp))}
                                    aria-label={`Remove device ${cp.chargePointId}`}
                                    sx={(th) => ({ ...sxObject(th, premiumIconButtonTouchSx) })}
                                  >
                                    <DeleteOutlineIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            )
            }
            </>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 2,
              mb: 2,
              mt: 2,
            }}
          >
            <Typography variant="h6" sx={{ minWidth: 0 }}>
              Recent Connection Errors
            </Typography>
            {recentErrors.length > 0 && (
              <Button
                variant="outlined"
                color="primary"
                onClick={handleClearResolvedErrors}
                size="small"
                sx={(th) => ({
                  ...sxObject(th, compactOutlinedCtaSx),
                  width: { xs: '100%', sm: 'auto' },
                  py: 0.5,
                  minHeight: 36,
                  fontSize: '0.8125rem',
                })}
              >
                Clear Resolved Errors
              </Button>
            )}
          </Box>
          {recentErrors.length === 0 ? (
            <Paper elevation={0} sx={{ ...premiumPanelCardSx, m: { xs: 2, sm: 2 } }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                No recent connection errors
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Devices are connecting successfully.
              </Typography>
            </Paper>
          ) : useGroupedList ? (
            <Box sx={{ mt: 1, py: 1 }}>
              <GroupedListSection>
                {recentErrors.map((log, index) => (
                  <GroupedListRow
                    key={log.id}
                    divider={index < recentErrors.length - 1}
                    showChevron={false}
                    primary={log.chargePointId}
                    secondary={`${log.eventType} · ${new Date(log.createdAt).toLocaleString()}`}
                    end={
                      <AppBadge
                        label={log.errorCode || 'error'}
                        tone={chipColorToBadgeTone(getConnectionEventColor(log.eventType))}
                        size="small"
                      />
                    }
                    onClick={() => {
                      const cp = chargePoints.find((c) => c.chargePointId === log.chargePointId);
                      if (cp) handleViewLogs(cp);
                    }}
                    aria-label={`View logs for ${log.chargePointId}`}
                  />
                ))}
              </GroupedListSection>
            </Box>
          ) : (
            <TableContainer sx={{ mt: 2, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Charge Point ID</TableCell>
                    <TableCell>Event Type</TableCell>
                    <TableCell>Error Code</TableCell>
                    <TableCell>Error Message</TableCell>
                    <TableCell>Close Code</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentErrors.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {log.chargePointId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <AppBadge
                          label={log.eventType}
                          tone={chipColorToBadgeTone(getConnectionEventColor(log.eventType))}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{log.errorCode || '-'}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {log.errorMessage || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>{log.closeCode || '-'}</TableCell>
                      <TableCell>
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={() => {
                            const cp = chargePoints.find((c) => c.chargePointId === log.chargePointId);
                            if (cp) {
                              handleViewLogs(cp);
                            }
                          }}
                        >
                          View Logs
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </Paper>

      <Dialog
        open={registerOpen}
        onClose={() => !registerSubmitting && setRegisterOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: (th) => sxObject(th, premiumDialogPaperSx) }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem' }}>Register device</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Pre-register a charge point ID so it is assigned to your vendor when it boots. You can still wait for
            BootNotification if the station is already on the network.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Charge point ID"
                required
                fullWidth
                value={registerForm.chargePointId}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, chargePointId: e.target.value }))}
                sx={(th) => sxObject(th, authFormFieldSx)}
              />
            </Grid>
            {getStoredUser()?.accountType === 'SuperAdmin' ? (
              <Grid item xs={12}>
                <TextField
                  select
                  label="Vendor"
                  required
                  fullWidth
                  value={registerForm.vendorId}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, vendorId: e.target.value }))}
                  sx={(th) => sxObject(th, authFormFieldSx)}
                >
                  {registerVendors.map((vendor) => (
                    <MenuItem key={vendor.id} value={String(vendor.id)}>
                      {vendor.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            ) : null}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Model"
                fullWidth
                value={registerForm.model}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, model: e.target.value }))}
                sx={(th) => sxObject(th, authFormFieldSx)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Serial"
                fullWidth
                value={registerForm.serialNumber}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, serialNumber: e.target.value }))}
                sx={(th) => sxObject(th, authFormFieldSx)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Address"
                fullWidth
                value={registerForm.locationAddress}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, locationAddress: e.target.value }))}
                sx={(th) => sxObject(th, authFormFieldSx)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, flexDirection: { xs: 'column-reverse', sm: 'row' }, gap: 1 }}>
          <Button
            onClick={() => setRegisterOpen(false)}
            disabled={registerSubmitting}
            sx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), width: { xs: '100%', sm: 'auto' } })}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disableElevation
            disabled={registerSubmitting || !registerForm.chargePointId.trim()}
            onClick={() => void handleRegisterDevice()}
            sx={(th) => ({ ...sxObject(th, compactContainedCtaSx), width: { xs: '100%', sm: 'auto' } })}
          >
            {registerSubmitting ? 'Registering…' : 'Register'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleteSubmitting && setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: (th) => sxObject(th, premiumDialogPaperSx) }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem' }}>Remove device?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            This permanently deletes <strong>{deleteTarget?.chargePointId}</strong> from the CSMS, including
            connectors, sessions, and related billing rows. The charger can register again later if it reconnects.
          </Typography>
          {(deleteTarget?.activeTransactionCount ?? 0) > 0 ? (
            <>
              <Alert severity="warning" sx={{ mt: 1 }}>
                This device has an active billing session. Remote stop or end the session from Charging Sessions
                before removal.
              </Alert>
              <Button
                variant="outlined"
                fullWidth
                sx={{ mt: 2, minHeight: 44 }}
                onClick={() => {
                  const cpId = deleteTarget?.chargePointId;
                  setDeleteDialogOpen(false);
                  if (cpId) navigate(`${opsBase}/devices/${encodeURIComponent(cpId)}`);
                }}
              >
                Open device details (remote stop)
              </Button>
            </>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, flexDirection: { xs: 'column-reverse', sm: 'row' }, gap: 1 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleteSubmitting}
            sx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), width: { xs: '100%', sm: 'auto' } })}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleteSubmitting || Boolean(deleteTarget && deleteDisabledReason(deleteTarget))}
            onClick={handleConfirmDelete}
            sx={{ width: { xs: '100%', sm: 'auto' }, minHeight: 44 }}
          >
            {deleteSubmitting ? 'Removing…' : 'Remove device'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Connection Logs Dialog */}
      <Dialog
        open={logsDialogOpen}
        onClose={() => setLogsDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: (th) => sxObject(th, premiumDialogPaperSx) }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem' }}>
          Connection logs — {selectedChargePoint?.chargePointId}
        </DialogTitle>
        <DialogContent>
          {logsLoading ? (
            <DialogDenseRowsSkeleton rows={8} ariaLabel="Loading connection logs" showToolbar />
          ) : (
            <Box>
              {/* Connection Statistics */}
              {connectionStats && (
                <Grid container spacing={{ xs: 2, sm: 2 }} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={premiumPanelCardSx}>
                      <Typography variant="caption" color="text.secondary">
                        Total Attempts
                      </Typography>
                      <Typography variant="h6">{connectionStats.totalAttempts}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={premiumPanelCardSx}>
                      <Typography variant="caption" color="text.secondary">
                        Successful
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        {connectionStats.successfulConnections}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={premiumPanelCardSx}>
                      <Typography variant="caption" color="text.secondary">
                        Failed
                      </Typography>
                      <Typography variant="h6" color="error.main">
                        {connectionStats.failedConnections}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={premiumPanelCardSx}>
                      <Typography variant="caption" color="text.secondary">
                        Consecutive Failures
                      </Typography>
                      <Typography variant="h6" color={connectionStats.consecutiveFailures > 0 ? 'error.main' : 'success.main'}>
                        {connectionStats.consecutiveFailures}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              )}

              {/* Last Error */}
              {connectionStats?.lastErrorCode && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Last Error: {connectionStats.lastErrorCode}
                  </Typography>
                  <Typography variant="body2">
                    {connectionStats.lastErrorMessage}
                  </Typography>
                  {connectionStats.lastFailedConnection && (
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      {new Date(connectionStats.lastFailedConnection).toLocaleString()}
                    </Typography>
                  )}
                </Alert>
              )}

              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Recent Connection Events
              </Typography>
              {connectionLogs.length === 0 ? (
                <AppEmptyState
                  sx={{ border: 0, boxShadow: 'none', borderRadius: 0, py: 2 }}
                  title="No connection logs found"
                  description="Events for this charge point will appear here after connect attempts."
                />
              ) : useGroupedList ? (
                <GroupedListSection>
                  {connectionLogs.map((log, index) => (
                    <GroupedListRow
                      key={log.id}
                      divider={index < connectionLogs.length - 1}
                      showChevron={false}
                      primary={log.eventType.replace(/_/g, ' ')}
                      secondary={[
                        new Date(log.createdAt).toLocaleString(),
                        log.errorCode ? `Code ${log.errorCode}` : null,
                        log.errorMessage || null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                      end={
                        log.status ? (
                          <AppBadge
                            label={log.status}
                            tone={chipColorToBadgeTone(getConnectionStatusColor(log.status))}
                            size="small"
                          />
                        ) : log.closeCode ? (
                          <Tooltip title={log.closeReason || ''}>
                            <span>
                              <AppBadge label={log.closeCode} tone="error" size="small" />
                            </span>
                          </Tooltip>
                        ) : undefined
                      }
                    />
                  ))}
                </GroupedListSection>
              ) : (
                <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Timestamp</TableCell>
                        <TableCell>Event Type</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Error Code</TableCell>
                        <TableCell>Error Message</TableCell>
                        <TableCell>Close Code</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {connectionLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            {new Date(log.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <AppBadge
                              label={log.eventType}
                              tone={chipColorToBadgeTone(getConnectionEventColor(log.eventType))}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {log.status && (
                              <AppBadge
                                label={log.status}
                                tone={chipColorToBadgeTone(getConnectionStatusColor(log.status))}
                                size="small"
                              />
                            )}
                          </TableCell>
                          <TableCell>{log.errorCode || '-'}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {log.errorMessage || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {log.closeCode ? (
                              <Tooltip title={log.closeReason || ''}>
                                <span>
                                  <AppBadge label={log.closeCode} tone="error" size="small" />
                                </span>
                              </Tooltip>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, flexWrap: 'wrap', gap: 1 }}>
          <Button onClick={() => setLogsDialogOpen(false)} sx={(th) => sxObject(th, compactOutlinedCtaSx)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


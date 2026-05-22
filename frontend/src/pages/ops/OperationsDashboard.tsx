import { useState, useEffect } from 'react';
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
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useTheme,
  useMediaQuery,
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
import { DashboardStatTile } from '../../components/dashboard/DashboardStatTile';
import { DashboardOperationsSkeleton } from '../../components/dashboard/DashboardOperationsSkeleton';
import { dashboardPageTitleSx, dashboardPageSubtitleSx, premiumTableSurfaceSx } from '../../theme/jampackShell';
import {
  compactOutlinedCtaSx,
  compactWarningContainedCtaSx,
  premiumDialogPaperSx,
  sxObject,
} from '../../styles/authShell';
import { getChargePointStatusColor } from '../../utils/statusColors';
import { GroupedListSection } from '../../components/ios/GroupedListSection';
import { GroupedListRow } from '../../components/ios/GroupedListRow';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { SUPERADMIN_ROUTES } from '../../config/staffNav.paths';
import { LIVE_DATA_LABELS } from '../../constants/liveDataLabels';

export function OperationsDashboard() {
  const navigate = useNavigate();
  const opsBase = useOpsBasePath();
  const theme = useTheme();
  const useGroupedList = useMediaQuery(theme.breakpoints.down('md'));
  const [chargePoints, setChargePoints] = useState<ChargePoint[]>([]);
  const [activeSessions, setActiveSessions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [vendorName, setVendorName] = useState<string | null>(null);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);

  useEffect(() => {
    // Check if user is impersonating a vendor
    const impersonating = localStorage.getItem('isImpersonating') === 'true';
    const vendor = localStorage.getItem('currentVendorName');
    setIsImpersonating(impersonating);
    setVendorName(vendor);
  }, []);

  const handleExitImpersonation = () => {
    setExitDialogOpen(true);
  };

  const confirmExitImpersonation = () => {
    localStorage.removeItem('currentVendorId');
    localStorage.removeItem('currentVendorName');
    localStorage.removeItem('isImpersonating');
    setExitDialogOpen(false);
    navigate(SUPERADMIN_ROUTES.vendors);
  };

  const handleRowKeyDown =
    (chargePointId: string) => (event: React.KeyboardEvent<HTMLTableRowElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        navigate(`${opsBase}/devices/${chargePointId}`);
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

  const loadData = async (silent?: boolean) => {
    const isQuiet = silent === true;
    try {
      if (isQuiet) setRefreshing(true);
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
      setUpdatedAt(Date.now());
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
      setRefreshing(false);
    }
  };

  const availableCount = chargePoints.filter((cp) => cp.status === 'Available').length;
  const offlineCount = chargePoints.filter((cp) => cp.status === 'Offline').length;

  if (loading) {
    return <DashboardOperationsSkeleton />;
  }

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <LivePageHeader
        title="Operations Dashboard"
        subtitle="Real-time monitoring of charging operations and device status"
        updatedAt={updatedAt}
        liveLabel={LIVE_DATA_LABELS.operations}
        showSeconds
        refreshing={refreshing}
        onRefresh={() => void loadData(true)}
        titleSx={{
          ...dashboardPageTitleSx,
          minWidth: 0,
          flex: '1 1 200px',
          mb: 0,
        }}
        subtitleSx={dashboardPageSubtitleSx}
        containerSx={{ mb: 0.5 }}
        refreshSx={(th) => ({
          ...sxObject(th, compactOutlinedCtaSx),
          width: { xs: '100%', sm: 'auto' },
          alignSelf: { xs: 'stretch', sm: 'auto' },
        })}
        actions={
          isImpersonating ? (
            <Button
              variant="outlined"
              color="warning"
              startIcon={<ExitToAppIcon />}
              onClick={handleExitImpersonation}
              sx={(th) => ({
                ...sxObject(th, compactOutlinedCtaSx),
                borderColor: 'warning.main',
                color: 'warning.main',
                width: { xs: '100%', sm: 'auto' },
                alignSelf: { xs: 'stretch', sm: 'auto' },
              })}
            >
              Exit vendor view
            </Button>
          ) : null
        }
      />
      <Box sx={{ mb: 3 }}>
        {isImpersonating && vendorName && (
          <Chip
            label={`Viewing as: ${vendorName}`}
            color="info"
            size="small"
            sx={{ mt: 1 }}
          />
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats — shared iOS-native-style tiles */}
      <Grid container spacing={{ xs: 2, sm: 2.5 }} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <DashboardStatTile
            accent="primary"
            kicker="Stations"
            value={chargePoints.length}
            caption="Total charge points"
            icon={<EvStationIcon sx={{ color: 'primary.main', fontSize: 24 }} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <DashboardStatTile
            accent="success"
            kicker="Active"
            value={activeSessions}
            caption="Currently charging"
            icon={<BatteryChargingFullIcon sx={{ color: 'success.main', fontSize: 24 }} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <DashboardStatTile
            accent="info"
            kicker="Available"
            value={availableCount}
            caption="Connectors available"
            icon={<CheckCircleIcon sx={{ color: 'info.main', fontSize: 24 }} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <DashboardStatTile
            accent="secondary"
            kicker="Offline"
            value={offlineCount}
            caption="Stations offline"
            icon={<ErrorIcon sx={{ color: 'secondary.main', fontSize: 24 }} />}
          />
        </Grid>
      </Grid>

      {/* Charge Points List */}
      <Paper elevation={0} sx={premiumTableSurfaceSx}>
        <Box sx={{ px: { xs: 2, sm: 2.5 }, py: { xs: 1.75, sm: 2 }, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Charge points
          </Typography>
        </Box>
        {chargePoints.length === 0 ? (
          <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 4 }, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No charge points yet. They appear here after connecting and sending BootNotification.
            </Typography>
          </Box>
        ) : useGroupedList ? (
          <Box sx={{ py: 1 }}>
            <GroupedListSection>
              {chargePoints.map((cp, index) => (
                <GroupedListRow
                  key={cp.chargePointId}
                  divider={index < chargePoints.length - 1}
                  primary={cp.chargePointId}
                  secondary={
                    (cp.vendorName || cp.vendor) && cp.model
                      ? `${cp.vendorName || cp.vendor} ${cp.model}`
                      : cp.locationAddress || 'Unknown'
                  }
                  end={
                    <Chip
                      label={cp.status}
                      color={getChargePointStatusColor(cp.status)}
                      size="small"
                      sx={{ height: 24 }}
                    />
                  }
                  onClick={() => navigate(`${opsBase}/devices/${encodeURIComponent(cp.chargePointId)}`)}
                  aria-label={`Open details for ${cp.chargePointId}`}
                />
              ))}
            </GroupedListSection>
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
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
                    onKeyDown={handleRowKeyDown(cp.chargePointId)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open details for ${cp.chargePointId}`}
                  >
                    <TableCell sx={{ fontWeight: 500 }}>{cp.chargePointId}</TableCell>
                    <TableCell>
                      {(cp.vendorName || cp.vendor) && cp.model ? `${cp.vendorName || cp.vendor} ${cp.model}` : 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={cp.status}
                        color={getChargePointStatusColor(cp.status)}
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
      <Dialog
        open={exitDialogOpen}
        onClose={() => setExitDialogOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: (th) => sxObject(th, premiumDialogPaperSx) }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem' }}>Exit vendor view?</DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            You will leave this vendor context and return to the Super Admin vendors page.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, flexWrap: 'wrap', gap: 1 }}>
          <Button onClick={() => setExitDialogOpen(false)} sx={(th) => sxObject(th, compactOutlinedCtaSx)}>
            Cancel
          </Button>
          <Button
            onClick={confirmExitImpersonation}
            variant="contained"
            disableElevation
            sx={(th) => sxObject(th, compactWarningContainedCtaSx)}
          >
            Exit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


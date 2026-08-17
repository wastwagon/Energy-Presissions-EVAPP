import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CancelIcon from '@mui/icons-material/Cancel';
import { reservationsApi, Reservation } from '../../services/reservationsApi';
import {
  staffFilterFieldSx,
  premiumIconButtonTouchSx,
  sxObject,
} from '../../styles/authShell';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { StaffFilterBar } from '../../components/dashboard/StaffFilterBar';
import { AppEmptyState } from '../../components/ui/AppEmptyState';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import { useLiveRefresh } from '../../hooks/useLiveRefresh';
import { LIVE_DATA_LABELS } from '../../constants/liveDataLabels';
import { DashboardStaffChromeSkeleton } from '../../components/dashboard/DashboardStaffChromeSkeleton';
import { TableSurfaceProgress } from '../../components/dashboard/TableSurfaceProgress';
import { GroupedListSection } from '../../components/ios/GroupedListSection';
import { GroupedListRow } from '../../components/ios/GroupedListRow';
import { premiumTableSurfaceSx } from '../../theme/jampackShell';
import { SUPERADMIN_ROUTES } from '../../config/staffNav.paths';

export function SuperAdminReservationsPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const useGroupedList = useMediaQuery(theme.breakpoints.down('md'));
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const { loading, refreshing, updatedAt, runWithRefresh } = useLiveRefresh();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filterChargePoint, setFilterChargePoint] = useState('');
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const loadReservations = useCallback(async (silent?: boolean) => {
    await runWithRefresh(async () => {
      try {
        setError(null);
        const data = await reservationsApi.getActive(filterChargePoint || undefined);
        setReservations(Array.isArray(data) ? data : []);
        return true;
      } catch (err: any) {
        setError(err.message || 'Failed to load reservations');
        setReservations([]);
        return false;
      }
    }, silent);
  }, [filterChargePoint, runWithRefresh]);

  useEffect(() => {
    void loadReservations();
  }, [loadReservations]);

  const handleCancel = async (r: Reservation) => {
    const rid = (r as any).reservationId ?? r.id;
    if (!rid) return;
    try {
      setCancellingId(rid);
      setError(null);
      await reservationsApi.cancel(rid, r.chargePointId);
      setSuccess('Reservation cancelled');
      void loadReservations(true);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading && reservations.length === 0) {
    return <DashboardStaffChromeSkeleton preset="reservationsList" />;
  }

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <LivePageHeader
        title="Active Reservations"
        subtitle="View and manage connector reservations"
        updatedAt={updatedAt}
        liveLabel={LIVE_DATA_LABELS.reservations}
        refreshing={refreshing}
        refreshDisabled={loading}
        onRefresh={() => void loadReservations(true)}
        refreshSx={{ width: { xs: '100%', sm: 'auto' } }}
      />

      <StaffFilterBar aria-label="Reservation filters">
        <TextField
          fullWidth
          placeholder="Filter by charge point"
          value={filterChargePoint}
          onChange={(e) => setFilterChargePoint(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={(th) => ({
            ...sxObject(th, staffFilterFieldSx),
            width: { xs: '100%', sm: 280 },
            maxWidth: '100%',
          })}
        />
      </StaffFilterBar>

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

      <Paper elevation={0} sx={{ ...premiumTableSurfaceSx, position: 'relative' }}>
        <TableSurfaceProgress active={loading && reservations.length > 0} ariaLabel="Loading reservations" />
        {reservations.length === 0 ? (
          <AppEmptyState
            sx={{ border: 0, boxShadow: 'none', borderRadius: 0 }}
            icon={<EventBusyIcon />}
            title={filterChargePoint ? 'No reservations match this charger' : 'No active reservations'}
            description={
              filterChargePoint
                ? 'Try another charge point ID, or clear the filter.'
                : 'Connector reservations will appear here when customers or operators hold a bay.'
            }
            primaryAction={
              filterChargePoint
                ? {
                    label: 'Clear filter',
                    onClick: () => setFilterChargePoint(''),
                    variant: 'secondary',
                  }
                : {
                    label: 'Open devices',
                    onClick: () => navigate(SUPERADMIN_ROUTES.opsDevices),
                    variant: 'secondary',
                  }
            }
          />
        ) : useGroupedList ? (
          <Box sx={{ py: 1 }}>
            <GroupedListSection>
              {reservations.map((r, index) => {
                const rid = (r as { reservationId?: number }).reservationId ?? r.id;
                return (
                  <GroupedListRow
                    key={`${r.chargePointId}-${r.connectorId}-${rid}`}
                    divider={index < reservations.length - 1}
                    showChevron={false}
                    primary={r.chargePointId}
                    secondary={`Connector ${r.connectorId} · ${r.idTag}`}
                    end={
                      <IconButton
                        sx={(th) => ({ ...sxObject(th, premiumIconButtonTouchSx) })}
                        color="error"
                        onClick={() => void handleCancel(r)}
                        disabled={cancellingId === rid}
                        aria-label={`Cancel reservation ${rid} for ${r.chargePointId}`}
                      >
                        <CancelIcon />
                      </IconButton>
                    }
                  />
                );
              })}
            </GroupedListSection>
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Charge Point</TableCell>
                  <TableCell>Connector</TableCell>
                  <TableCell>ID Tag</TableCell>
                  <TableCell>Expires</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reservations.map((r) => {
                  const rid = (r as { reservationId?: number }).reservationId ?? r.id;
                  return (
                    <TableRow key={`${r.chargePointId}-${r.connectorId}-${rid}`}>
                      <TableCell>{r.chargePointId}</TableCell>
                      <TableCell>{r.connectorId}</TableCell>
                      <TableCell>{r.idTag}</TableCell>
                      <TableCell>
                        {r.expiryDate ? new Date(r.expiryDate).toLocaleString() : '-'}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          sx={(th) => ({ ...sxObject(th, premiumIconButtonTouchSx) })}
                          color="error"
                          onClick={() => handleCancel(r)}
                          disabled={cancellingId === rid}
                          aria-label={`Cancel reservation ${rid} for ${r.chargePointId}`}
                        >
                          <CancelIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}

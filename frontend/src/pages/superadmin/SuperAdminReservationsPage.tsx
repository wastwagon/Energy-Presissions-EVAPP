import { useState, useEffect } from 'react';
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
  Button,
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CancelIcon from '@mui/icons-material/Cancel';
import RefreshIcon from '@mui/icons-material/Refresh';
import { reservationsApi, Reservation } from '../../services/reservationsApi';
import {
  dashboardPageTitleSx,
  dashboardPageSubtitleSx,
  premiumEmptyStatePaperSx,
  premiumTableSurfaceSx,
} from '../../theme/jampackShell';
import {
  authFormFieldSx,
  compactOutlinedCtaSx,
  premiumIconButtonTouchSx,
  sxObject,
} from '../../styles/authShell';
import { useOpsBasePath } from '../../hooks/useOpsBasePath';
import { OpsQuickActions } from '../../components/dashboard/OpsQuickActions';

export function SuperAdminReservationsPage() {
  const opsBase = useOpsBasePath();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filterChargePoint, setFilterChargePoint] = useState('');
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const loadReservations = async () => {
    try {
      setError(null);
      const data = await reservationsApi.getActive(filterChargePoint || undefined);
      setReservations(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load reservations');
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, [filterChargePoint]);

  const handleCancel = async (r: Reservation) => {
    const rid = (r as any).reservationId ?? r.id;
    if (!rid) return;
    try {
      setCancellingId(rid);
      setError(null);
      await reservationsApi.cancel(rid, r.chargePointId);
      setSuccess('Reservation cancelled');
      loadReservations();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ minWidth: 0, flex: '1 1 220px' }}>
          <Typography variant="h6" component="h1" sx={dashboardPageTitleSx}>
            Active Reservations
          </Typography>
          <Typography variant="body2" sx={dashboardPageSubtitleSx}>
            View and manage connector reservations
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: { xs: '100%', sm: 'auto' }, flexDirection: { xs: 'column', sm: 'row' } }}>
          <TextField
            size="small"
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
              ...sxObject(th, authFormFieldSx),
              width: { xs: '100%', sm: 260 },
            })}
          />
          <Button
            startIcon={<RefreshIcon />}
            onClick={loadReservations}
            variant="outlined"
            sx={(th) => ({
              ...sxObject(th, compactOutlinedCtaSx),
              width: { xs: '100%', sm: 'auto' },
            })}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      <OpsQuickActions opsBase={opsBase} />

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

      <Paper sx={premiumTableSurfaceSx}>
        {reservations.length === 0 ? (
          <Box sx={premiumEmptyStatePaperSx}>
            <Typography color="text.secondary">No active reservations</Typography>
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
                  const rid = (r as any).reservationId ?? r.id;
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

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
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
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CancelIcon from '@mui/icons-material/Cancel';
import RefreshIcon from '@mui/icons-material/Refresh';
import { reservationsApi, Reservation } from '../../services/reservationsApi';
import { dashboardPageTitleSx, dashboardPageSubtitleSx } from '../../theme/jampackShell';

export function SuperAdminReservationsPage() {
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
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ minWidth: 0, flex: '1 1 220px' }}>
          <Typography variant="h6" component="h1" sx={dashboardPageTitleSx}>
            Active Reservations
          </Typography>
          <Typography variant="body2" sx={dashboardPageSubtitleSx}>
            View and manage connector reservations
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: { xs: '100%', sm: 'auto' } }}>
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
            sx={{ width: { xs: '100%', sm: 260 } }}
          />
          <Button startIcon={<RefreshIcon />} onClick={loadReservations} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            Refresh
          </Button>
        </Box>
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

      <Card>
        <CardContent>
          {reservations.length === 0 ? (
            <Typography color="text.secondary">No active reservations</Typography>
          ) : (
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small">
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
                          {r.expiryDate
                            ? new Date(r.expiryDate).toLocaleString()
                            : '-'}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
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
        </CardContent>
      </Card>
    </Box>
  );
}

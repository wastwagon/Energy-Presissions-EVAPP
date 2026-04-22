import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  useTheme,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { stationsApi, StationWithDistance } from '../../services/stationsApi';
import { usersApi } from '../../services/usersApi';
import { StartChargingDialog } from '../../components/StartChargingDialog';
import { CustomerQuickActions } from '../../components/dashboard/CustomerQuickActions';
import {
  dashboardPageTitleSx,
  dashboardPageSubtitleSx,
  premiumEmptyStatePaperSx,
  premiumTableSurfaceSx,
} from '../../theme/jampackShell';
import { compactContainedCtaSx, premiumIconButtonTouchSx, sxObject } from '../../styles/authShell';
import { getStoredUser } from '../../utils/authSession';
import { CUSTOMER_ROUTES } from '../../config/customerNav.paths';
import { formatCurrency } from '../../utils/formatters';
import { getChargePointStatusColor } from '../../utils/statusColors';

export function CustomerFavoritesPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [stations, setStations] = useState<StationWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startChargingDialogOpen, setStartChargingDialogOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<StationWithDistance | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const getCurrentUserId = () => {
    const user = getStoredUser();
    return typeof user?.id === 'number' ? user.id : null;
  };

  const loadData = async () => {
    try {
      setError(null);
      const userId = getCurrentUserId();
      if (!userId) {
        setError('Please log in to view favorites');
        setLoading(false);
        return;
      }
      const ids = await usersApi.getFavorites(userId);

      if (ids.length === 0) {
        setStations([]);
      } else {
        const favoriteStations = await stationsApi.getByIds(ids);
        setStations(favoriteStations);
      }
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
      const status = ax.response?.status;
      const serverMsg = ax.response?.data?.message;
      if (status === 500) {
        setError(serverMsg || 'Server error loading favorites. Please try again or contact support.');
      } else {
        setError(ax.message || serverMsg || 'Failed to load favorites');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (chargePointId: string) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) return;
      await usersApi.removeFavorite(userId, chargePointId);
      setStations((prev) => prev.filter((s) => s.chargePointId !== chargePointId));
    } catch (err: any) {
      setError(err.message || 'Failed to remove favorite');
    }
  };

  const openStartCharging = (station: StationWithDistance) => {
    setSelectedStation(station);
    setStartChargingDialogOpen(true);
  };

  const handleFavoriteCardKeyDown =
    (station: StationWithDistance) => (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (station.status !== 'Offline') {
          openStartCharging(station);
        }
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
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" component="h1" sx={dashboardPageTitleSx}>
          Favorite Stations
        </Typography>
        <Typography variant="body2" sx={dashboardPageSubtitleSx}>
          Your saved charging stations for quick access
        </Typography>
      </Box>

      <CustomerQuickActions preset="favorites" />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {stations.length === 0 ? (
        <Paper elevation={0} sx={premiumEmptyStatePaperSx}>
          <Box
            sx={(theme) => ({
              width: 72,
              height: 72,
              mx: 'auto',
              mb: 2,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: theme.palette.action.hover,
              color: 'text.secondary',
            })}
          >
            <FavoriteBorderIcon sx={{ fontSize: 36 }} />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            No favorite stations yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Go to Find Stations and tap the heart icon on any station to add it to your favorites.
          </Typography>
          <Button
            variant="contained"
            disableElevation
            onClick={() => navigate(CUSTOMER_ROUTES.stations)}
            sx={(th) => ({ ...sxObject(th, compactContainedCtaSx), width: { xs: '100%', sm: 'auto' } })}
          >
            Find stations
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {stations.map((station) => (
            <Paper
              key={station.chargePointId}
              elevation={0}
              role="button"
              tabIndex={0}
              aria-label={`Open favorite station ${station.chargePointId}`}
              onClick={() => {
                if (station.status !== 'Offline') {
                  openStartCharging(station);
                }
              }}
              onKeyDown={handleFavoriteCardKeyDown(station)}
              sx={{
                ...premiumTableSurfaceSx,
                cursor: station.status === 'Offline' ? 'default' : 'pointer',
                transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
              }}
            >
              <Box sx={{ p: { xs: 2, sm: 2 }, pb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, gap: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {station.chargePointId}
                  </Typography>
                  <IconButton
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleRemoveFavorite(station.chargePointId);
                    }}
                    aria-label={`Remove ${station.chargePointId} from favorites`}
                    sx={{
                      ...sxObject(theme, premiumIconButtonTouchSx),
                      flexShrink: 0,
                    }}
                  >
                    <FavoriteIcon />
                  </IconButton>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                  <LocationOnIcon fontSize="small" />
                  {station.locationAddress || station.locationName || 'Address not set'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label={station.status} color={getChargePointStatusColor(station.status)} size="small" />
                  {station.pricePerKwh != null && (
                    <Chip
                      label={formatCurrency(Number(station.pricePerKwh), station.currency)}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>
              <Box sx={{ px: { xs: 2, sm: 2 }, pb: 2, pt: 0, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  disableElevation
                  startIcon={<PlayArrowIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    openStartCharging(station);
                  }}
                  disabled={station.status === 'Offline'}
                  sx={(th) => ({ ...sxObject(th, compactContainedCtaSx), width: { xs: '100%', sm: 'auto' } })}
                >
                  Start charging
                </Button>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {selectedStation && (
        <StartChargingDialog
          open={startChargingDialogOpen}
          onClose={() => {
            setStartChargingDialogOpen(false);
            setSelectedStation(null);
          }}
          station={selectedStation}
          onSuccess={() => loadData()}
        />
      )}
    </Box>
  );
}

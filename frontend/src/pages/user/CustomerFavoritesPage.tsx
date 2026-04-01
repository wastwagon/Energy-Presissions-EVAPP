import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  CardActions,
  Chip,
  CircularProgress,
  Alert,
  Button,
  IconButton,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { stationsApi, StationWithDistance } from '../../services/stationsApi';
import { usersApi } from '../../services/usersApi';
import { StartChargingDialog } from '../../components/StartChargingDialog';
import { dashboardPageTitleSx, dashboardPageSubtitleSx } from '../../theme/jampackShell';
import { getStoredUser } from '../../utils/authSession';
import { formatCurrency } from '../../utils/formatters';
import { getChargePointStatusColor } from '../../utils/statusColors';

export function CustomerFavoritesPage() {
  const navigate = useNavigate();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
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
      setFavoriteIds(ids);

      if (ids.length === 0) {
        setStations([]);
      } else {
        const favoriteStations = await stationsApi.getByIds(ids);
        setStations(favoriteStations);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (chargePointId: string) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) return;
      await usersApi.removeFavorite(userId, chargePointId);
      setFavoriteIds((prev) => prev.filter((id) => id !== chargePointId));
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
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" component="h1" sx={dashboardPageTitleSx}>
          Favorite Stations
        </Typography>
        <Typography variant="body2" sx={dashboardPageSubtitleSx}>
          Your saved charging stations for quick access
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {stations.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <FavoriteBorderIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No favorite stations yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Go to Find Stations and tap the heart icon on any station to add it to your favorites.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/stations')}>
            Find Stations
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {stations.map((station) => (
            <Card
              key={station.chargePointId}
              variant="outlined"
              role="button"
              tabIndex={0}
              aria-label={`Open favorite station ${station.chargePointId}`}
              onClick={() => {
                if (station.status !== 'Offline') {
                  openStartCharging(station);
                }
              }}
              onKeyDown={handleFavoriteCardKeyDown(station)}
              sx={{ cursor: station.status === 'Offline' ? 'default' : 'pointer' }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="h6">{station.chargePointId}</Typography>
                  <IconButton
                    color="error"
                    onClick={() => handleRemoveFavorite(station.chargePointId)}
                    size="small"
                    aria-label={`Remove ${station.chargePointId} from favorites`}
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
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  startIcon={<PlayArrowIcon />}
                  onClick={() => openStartCharging(station)}
                  disabled={station.status === 'Offline'}
                >
                  Start Charging
                </Button>
              </CardActions>
            </Card>
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

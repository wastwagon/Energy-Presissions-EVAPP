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

  const loadData = async () => {
    try {
      setError(null);
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        setError('Please log in to view favorites');
        setLoading(false);
        return;
      }
      const user = JSON.parse(userStr);
      const ids = await usersApi.getFavorites(user.id);
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
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      await usersApi.removeFavorite(user.id, chargePointId);
      setFavoriteIds((prev) => prev.filter((id) => id !== chargePointId));
      setStations((prev) => prev.filter((s) => s.chargePointId !== chargePointId));
    } catch (err: any) {
      setError(err.message || 'Failed to remove favorite');
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
      default:
        return 'warning';
    }
  };

  const formatCurrency = (amount?: number, currency = 'GHS') => {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency,
    }).format(amount);
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
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
          Favorite Stations
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
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
            <Card key={station.chargePointId} variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="h6">{station.chargePointId}</Typography>
                  <IconButton
                    color="error"
                    onClick={() => handleRemoveFavorite(station.chargePointId)}
                    size="small"
                  >
                    <FavoriteIcon />
                  </IconButton>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                  <LocationOnIcon fontSize="small" />
                  {station.locationAddress || station.locationName || 'Address not set'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label={station.status} color={getStatusColor(station.status) as any} size="small" />
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
                  onClick={() => {
                    setSelectedStation(station);
                    setStartChargingDialogOpen(true);
                  }}
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

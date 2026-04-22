import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import MapIcon from '@mui/icons-material/Map';
import ListIcon from '@mui/icons-material/List';
import DirectionsIcon from '@mui/icons-material/Directions';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import LoginIcon from '@mui/icons-material/Login';
import { stationsApi, StationWithDistance } from '../services/stationsApi';
import { usersApi } from '../services/usersApi';
import { websocketService } from '../services/websocket';
import { StartChargingDialog } from '../components/StartChargingDialog';
import {
  authFormFieldSx,
  compactContainedCtaSx,
  compactOutlinedCtaSx,
  premiumDialogPaperSx,
  premiumIconButtonTouchSx,
  sxObject,
} from '../styles/authShell';
import {
  dashboardPageTitleSx,
  dashboardPageSubtitleSx,
  jampackKpiCardBaseSx,
  premiumEmptyStatePaperSx,
} from '../theme/jampackShell';
import { CustomerQuickActions } from '../components/dashboard/CustomerQuickActions';
import { StationListCard } from '../components/stations/StationListCard';
import { formatCurrency } from '../utils/formatters';
import { getChargePointStatusColor } from '../utils/statusColors';
import { getStoredUser, hasValidSession } from '../utils/authSession';
import {
  buildGoogleMapsDrivingDirectionsUrl,
  openGoogleMapsDirections,
} from '../utils/googleMapsDirections';
import { reverseGeocodeAreaLabel } from '../services/reverseGeocodeApi';

function formatStationsLoadError(err: unknown): string {
  const e = err as { message?: string; code?: string; response?: { data?: { message?: string } } };
  if (e.response?.data?.message && typeof e.response.data.message === 'string') {
    return e.response.data.message;
  }
  if (e.code === 'ERR_NETWORK' || e.message === 'Network Error') {
    return 'Cannot reach the server. Check your connection, VPN, or try again shortly. If this persists, the API may be unavailable.';
  }
  return e.message || 'Request failed';
}

export function StationsPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [stations, setStations] = useState<StationWithDistance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userAreaLabel, setUserAreaLabel] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<StationWithDistance | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [startChargingDialogOpen, setStartChargingDialogOpen] = useState(false);
  const [selectedStationForCharging, setSelectedStationForCharging] = useState<StationWithDistance | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [radius, setRadius] = useState(50); // Default 50km radius
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [pendingStationForLogin, setPendingStationForLogin] = useState<StationWithDistance | null>(null);

  // Check authentication status and load favorites
  useEffect(() => {
    setIsAuthenticated(hasValidSession());
    const userData = getStoredUser();
    if (userData) {
      setUser(userData);
      if (typeof userData.id === 'number') {
        usersApi.getFavorites(userData.id).then(setFavoriteIds).catch(() => setFavoriteIds([]));
      } else {
        setFavoriteIds([]);
      }
    }
  }, []);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation({ lat, lng });
          setLocationError(null);
          setUserAreaLabel(null);
          void reverseGeocodeAreaLabel(lat, lng).then((label) => setUserAreaLabel(label));
          loadNearbyStations(lat, lng);
        },
        (err) => {
          setLocationError(
            err.message === 'User denied Geolocation'
              ? 'Location access denied. Please enable location services to find nearby stations.'
              : 'Unable to get your location. Please search for stations manually.',
          );
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
    }
  }, []);

  // WebSocket listener for real-time status updates
  useEffect(() => {
    const unsubscribe = websocketService.on('chargePointStatus', (event) => {
      const { chargePointId, status, lastSeen, lastHeartbeat } = event.data;
      setStations((prev) =>
        prev.map((station) => {
          if (station.chargePointId !== chargePointId) return station;
          return {
            ...station,
            ...(status != null ? { status } : {}),
            ...(lastSeen != null ? { lastSeen } : {}),
            ...(lastHeartbeat != null ? { lastHeartbeat } : {}),
          };
        }),
      );
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const loadNearbyStations = async (lat: number, lng: number) => {
    try {
      setLoading(true);
      setError(null);
      const nearbyStations = await stationsApi.findNearby({
        latitude: lat,
        longitude: lng,
        radiusKm: radius,
        status: ['Available', 'Charging', 'Preparing', 'Finishing'], // Only show active stations
        limit: 50,
      });
      setStations(nearbyStations);
    } catch (err: unknown) {
      setError(formatStationsLoadError(err));
      console.error('Error loading nearby stations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation({ lat, lng });
          setUserAreaLabel(null);
          void reverseGeocodeAreaLabel(lat, lng).then((label) => setUserAreaLabel(label));
          loadNearbyStations(lat, lng);
        },
        (err) => {
          setLocationError('Failed to refresh location');
          setLoading(false);
        },
      );
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      if (userLocation) {
        loadNearbyStations(userLocation.lat, userLocation.lng);
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const results = await stationsApi.search(
        searchTerm.trim(),
        50,
        userLocation ? { latitude: userLocation.lat, longitude: userLocation.lng } : undefined,
      );
      setStations(results);
    } catch (err: unknown) {
      setError(formatStationsLoadError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleStationClick = (station: StationWithDistance) => {
    setSelectedStation(station);
    setDialogOpen(true);
  };

  const handleGetDirections = (e: React.MouseEvent, station: StationWithDistance) => {
    e.stopPropagation(); // Prevent card click
    const url = buildGoogleMapsDrivingDirectionsUrl(
      station.locationLatitude,
      station.locationLongitude,
      userLocation,
    );
    if (url) {
      openGoogleMapsDirections(url);
    }
  };

  const openLoginPrompt = (station: StationWithDistance) => {
    setPendingStationForLogin(station);
    setLoginPromptOpen(true);
  };

  const confirmLoginPrompt = () => {
    if (pendingStationForLogin) {
      sessionStorage.setItem('returnToStation', pendingStationForLogin.chargePointId);
    }
    setLoginPromptOpen(false);
    setPendingStationForLogin(null);
    navigate('/login');
  };

  const handleStartCharging = (e: React.MouseEvent, station: StationWithDistance) => {
    e.stopPropagation(); // Prevent card click
    if (!isAuthenticated) {
      openLoginPrompt(station);
    } else {
      // For all authenticated users, show the wallet-based charging dialog
      setSelectedStationForCharging(station);
      setStartChargingDialogOpen(true);
    }
  };

  const handleStationCardKeyDown =
    (station: StationWithDistance) => (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleStationClick(station);
      }
    };

  const handleChargingSuccess = () => {
    // Reload stations to update availability
    if (userLocation) {
      loadNearbyStations(userLocation.lat, userLocation.lng);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, chargePointId: string) => {
    e.stopPropagation();
    if (!user?.id) return;
    try {
      const isFavorite = favoriteIds.includes(chargePointId);
      if (isFavorite) {
        await usersApi.removeFavorite(user.id, chargePointId);
        setFavoriteIds((prev) => prev.filter((id) => id !== chargePointId));
      } else {
        await usersApi.addFavorite(user.id, chargePointId);
        setFavoriteIds((prev) => [...prev, chargePointId]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update favorites');
    }
  };

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: '1 1 200px', minWidth: 0 }}>
          <Typography
            variant="h6"
            component="h1"
            sx={dashboardPageTitleSx}
          >
            Find Charging Stations
          </Typography>
          <Typography variant="body2" sx={dashboardPageSubtitleSx}>
            Discover nearby EV charging stations in Ghana
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0, alignSelf: { xs: 'flex-end', sm: 'center' } }}>
          <Tooltip title="List view">
            <IconButton
              onClick={() => setViewMode('list')}
              color={viewMode === 'list' ? 'primary' : 'default'}
              aria-label="Switch to list view"
              sx={{ ...sxObject(theme, premiumIconButtonTouchSx) }}
            >
              <ListIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Map view (coming soon)">
            <span>
              <IconButton
                disabled
                color="default"
                aria-label="Map view coming soon"
                sx={{ ...sxObject(theme, premiumIconButtonTouchSx) }}
              >
                <MapIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      <CustomerQuickActions preset="stations" visible={isAuthenticated} />

      {locationError && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setLocationError(null)}>
          {locationError}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search and filter — mobile-first, full-width primary actions on xs */}
      <Paper
        elevation={0}
        sx={{
          ...jampackKpiCardBaseSx,
          p: { xs: 2, sm: 2.25 },
          mb: 3,
          boxShadow: `0 8px 28px ${alpha(theme.palette.text.primary, 0.06)}`,
        }}
      >
        <Grid container spacing={{ xs: 1.5, sm: 2 }} alignItems="stretch">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="City, address, region, or station ID…"
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
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
              sx={(th) => sxObject(th, authFormFieldSx)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Radius (km)"
              value={radius}
              onChange={(e) => setRadius(parseFloat(e.target.value) || 50)}
              inputProps={{ min: 1, max: 200 }}
              sx={(th) => sxObject(th, authFormFieldSx)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1, height: '100%' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSearch}
                startIcon={<SearchIcon />}
                fullWidth
                size="medium"
                disableElevation
                sx={compactContainedCtaSx}
              >
                Search
              </Button>
              {userLocation ? (
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleRefreshLocation}
                  startIcon={<MyLocationIcon />}
                  fullWidth
                  size="medium"
                  sx={compactOutlinedCtaSx}
                >
                  Near me
                </Button>
              ) : null}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* User Location Info */}
      {userLocation && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2" component="div">
            Showing stations within {radius} km of{' '}
            {userAreaLabel ? (
              <Box component="span" sx={{ fontWeight: 600 }}>
                {userAreaLabel}
              </Box>
            ) : (
              'your location'
            )}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
            GPS: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
          </Typography>
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Stations List */}
      {!loading && stations.length === 0 && !error && (
        <Paper elevation={0} sx={premiumEmptyStatePaperSx}>
          <Box
            sx={(t) => ({
              width: 72,
              height: 72,
              mx: 'auto',
              mb: 2,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: t.palette.action.hover,
              color: 'text.secondary',
            })}
          >
            <LocationOnIcon sx={{ fontSize: 36 }} />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            No stations found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {userLocation
              ? `No charging stations within ${radius} km. Try a larger radius or another search.`
              : 'Enable location or search by city, address, or station ID.'}
          </Typography>
        </Paper>
      )}

      {/* Stations — single column on phones, multi-column from sm */}
      {!loading && stations.length > 0 && (
        <Grid container spacing={{ xs: 2, sm: 2.5 }}>
          {stations.map((station) => (
            <Grid item xs={12} sm={6} lg={4} key={station.chargePointId}>
              <StationListCard
                station={station}
                isAuthenticated={isAuthenticated}
                isFavorite={favoriteIds.includes(station.chargePointId)}
                onOpenDetails={handleStationClick}
                onCardKeyDown={handleStationCardKeyDown(station)}
                onDirections={handleGetDirections}
                onStartCharging={handleStartCharging}
                onToggleFavorite={handleToggleFavorite}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Start Charging Dialog */}
      <StartChargingDialog
        open={startChargingDialogOpen}
        onClose={() => {
          setStartChargingDialogOpen(false);
          setSelectedStationForCharging(null);
        }}
        station={selectedStationForCharging}
        onSuccess={handleChargingSuccess}
      />

      {/* Station Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        scroll="paper"
        PaperProps={{ sx: (th) => sxObject(th, premiumDialogPaperSx) }}
      >
        {selectedStation && (
          <>
            <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: 1,
                }}
              >
                <Typography variant="subtitle1" sx={{ minWidth: 0, pr: 1, fontWeight: 600 }}>
                  {selectedStation.locationName || selectedStation.chargePointId}
                </Typography>
                <Chip
                  label={selectedStation.status}
                  color={getChargePointStatusColor(selectedStation.status)}
                  size="small"
                  sx={{ flexShrink: 0 }}
                />
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <List dense disablePadding sx={{ py: 0 }}>
                {selectedStation.locationAddress && (
                  <ListItem>
                    <ListItemText
                      primary="Address"
                      secondary={selectedStation.locationAddress}
                    />
                  </ListItem>
                )}
                {selectedStation.locationCity && selectedStation.locationRegion && (
                  <ListItem>
                    <ListItemText
                      primary="Location"
                      secondary={`${selectedStation.locationCity}, ${selectedStation.locationRegion}`}
                    />
                  </ListItem>
                )}
                <ListItem>
                  <ListItemText
                    primary="Distance"
                    secondary={`${selectedStation.distanceKm.toFixed(1)} km away`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Connectors"
                    secondary={`${selectedStation.availableConnectors} available out of ${selectedStation.totalConnectors} total`}
                  />
                </ListItem>
                {selectedStation.totalCapacityKw && (
                  <ListItem>
                    <ListItemText
                      primary="Capacity"
                      secondary={`${selectedStation.totalCapacityKw} kW`}
                    />
                  </ListItem>
                )}
                {selectedStation.pricePerKwh && (
                  <ListItem>
                    <ListItemText
                      primary="Price"
                      secondary={`${formatCurrency(Number(selectedStation.pricePerKwh), selectedStation.currency || 'GHS')} per kWh`}
                    />
                  </ListItem>
                )}
                {selectedStation.locationLandmarks && (
                  <ListItem>
                    <ListItemText
                      primary="Nearby Landmarks"
                      secondary={selectedStation.locationLandmarks}
                    />
                  </ListItem>
                )}
                {selectedStation.amenities && selectedStation.amenities.length > 0 && (
                  <ListItem>
                    <ListItemText
                      primary="Amenities"
                      secondary={selectedStation.amenities.join(', ')}
                    />
                  </ListItem>
                )}
              </List>
            </DialogContent>
            <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: 2, pt: 1, flexWrap: 'wrap', gap: 1 }}>
              <Button onClick={() => setDialogOpen(false)} sx={(th) => sxObject(th, compactOutlinedCtaSx)}>
                Close
              </Button>
              {selectedStation.locationLatitude && selectedStation.locationLongitude && (
                <Button
                  variant="outlined"
                  startIcon={<DirectionsIcon />}
                  onClick={(e) => selectedStation && handleGetDirections(e, selectedStation)}
                  sx={(th) => sxObject(th, compactOutlinedCtaSx)}
                >
                  Directions
                </Button>
              )}
              {selectedStation.status === 'Available' && (
                <Button
                  variant="contained"
                  color="primary"
                  disableElevation
                  startIcon={isAuthenticated ? <PlayArrowIcon /> : <LoginIcon />}
                  onClick={(e) => {
                    if (isAuthenticated && selectedStation) {
                      handleStartCharging(e, selectedStation);
                    } else if (selectedStation) {
                      openLoginPrompt(selectedStation);
                    }
                  }}
                  sx={(th) => ({ ...sxObject(th, compactContainedCtaSx), width: { xs: '100%', sm: 'auto' } })}
                >
                  {isAuthenticated ? 'Start charging' : 'Log in to start'}
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
      <Dialog
        open={loginPromptOpen}
        onClose={() => setLoginPromptOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: (th) => sxObject(th, premiumDialogPaperSx) }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem' }}>Log in required</DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            Log in to start charging. Continue to the login page?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, flexWrap: 'wrap', gap: 1 }}>
          <Button onClick={() => setLoginPromptOpen(false)} sx={(th) => sxObject(th, compactOutlinedCtaSx)}>
            Cancel
          </Button>
          <Button
            onClick={confirmLoginPrompt}
            variant="contained"
            disableElevation
            sx={(th) => sxObject(th, compactContainedCtaSx)}
          >
            Log in
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

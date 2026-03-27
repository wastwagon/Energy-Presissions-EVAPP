import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
  Stack,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import MapIcon from '@mui/icons-material/Map';
import ListIcon from '@mui/icons-material/List';
import DirectionsIcon from '@mui/icons-material/Directions';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import LoginIcon from '@mui/icons-material/Login';
import BoltIcon from '@mui/icons-material/Bolt';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { stationsApi, StationWithDistance } from '../services/stationsApi';
import { usersApi } from '../services/usersApi';
import { websocketService } from '../services/websocket';
import { StartChargingDialog } from '../components/StartChargingDialog';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

export function StationsPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [stations, setStations] = useState<StationWithDistance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
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

  // Check authentication status and load favorites
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    setIsAuthenticated(!!token);
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        usersApi.getFavorites(userData.id).then(setFavoriteIds).catch(() => setFavoriteIds([]));
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationError(null);
          loadNearbyStations(position.coords.latitude, position.coords.longitude);
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
      setStations((prev) =>
        prev.map((station) =>
          station.chargePointId === event.data.chargePointId
            ? { ...station, ...event.data }
            : station,
        ),
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
    } catch (err: any) {
      setError(err.message || 'Failed to load nearby stations');
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
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          loadNearbyStations(position.coords.latitude, position.coords.longitude);
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
      const results = await stationsApi.search(searchTerm, 50);
      // Convert search results to StationWithDistance format
      const stationsWithDistance = results.map((station: any) => ({
        ...station,
        distanceKm: userLocation
          ? calculateDistance(
              userLocation.lat,
              userLocation.lng,
              station.locationLatitude,
              station.locationLongitude,
            )
          : 0,
        availableConnectors: 0,
        totalConnectors: 0,
        activeSessions: 0,
      }));
      setStations(stationsWithDistance);
    } catch (err: any) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    if (!lat2 || !lng2) return 0;
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'success';
      case 'Charging':
      case 'Preparing':
      case 'Finishing':
        return 'info';
      case 'Offline':
      case 'Unavailable':
        return 'default';
      case 'Faulted':
        return 'error';
      default:
        return 'warning';
    }
  };

  const handleStationClick = (station: StationWithDistance) => {
    setSelectedStation(station);
    setDialogOpen(true);
  };

  const handleGetDirections = (e: React.MouseEvent, station: StationWithDistance) => {
    e.stopPropagation(); // Prevent card click
    if (station.locationLatitude && station.locationLongitude) {
      const lat = station.locationLatitude;
      const lng = station.locationLongitude;
      
      // Detect device type
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isMobile = isIOS || isAndroid;
      
      if (isMobile) {
        if (isAndroid) {
          // Android: Use intent URL that prompts to open in Google Maps app
          // This will show a dialog asking which app to use
          const intentUrl = `intent://maps.google.com/maps?daddr=${lat},${lng}&directionsmode=driving#Intent;scheme=https;package=com.google.android.apps.maps;S.browser_fallback_url=https://maps.google.com/maps?daddr=${lat},${lng};end`;
          window.location.href = intentUrl;
        } else if (isIOS) {
          // iOS: Use Google Maps web URL which prompts to open in app
          // Safari will show "Open in Google Maps" banner if app is installed
          const googleMapsUrl = `https://maps.google.com/maps?daddr=${lat},${lng}&directionsmode=driving`;
          window.location.href = googleMapsUrl;
        }
      } else {
        // Desktop: Use standard Google Maps URL
        const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        window.open(webUrl, '_blank');
      }
    }
  };

  const handleStartCharging = (e: React.MouseEvent, station: StationWithDistance) => {
    e.stopPropagation(); // Prevent card click
    if (!isAuthenticated) {
      // Prompt user to login
      if (window.confirm('You need to login to start charging. Would you like to login now?')) {
        // Store the station ID to return after login
        sessionStorage.setItem('returnToStation', station.chargePointId);
        navigate('/login');
      }
    } else {
      // For all authenticated users, show the wallet-based charging dialog
      setSelectedStationForCharging(station);
      setStartChargingDialogOpen(true);
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

  // Determine dashboard route based on user type
  const getDashboardRoute = () => {
    if (!user) return '/user/dashboard';
    if (user.accountType === 'SuperAdmin') return '/superadmin/dashboard';
    if (user.accountType === 'Admin') return '/admin/dashboard';
    return '/user/dashboard';
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: '1 1 200px', minWidth: 0 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 1 }}>
            {isAuthenticated && (
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate(getDashboardRoute())}
                sx={{
                  textTransform: 'none',
                  width: { xs: '100%', sm: 'auto' },
                }}
              >
                Back to Dashboard
              </Button>
            )}
          </Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              mb: 0.5,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
            }}
          >
            Find Charging Stations
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Discover nearby EV charging stations in Ghana
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0, alignSelf: { xs: 'flex-end', sm: 'center' } }}>
          <Tooltip title="List View">
            <IconButton
              onClick={() => setViewMode('list')}
              color={viewMode === 'list' ? 'primary' : 'default'}
            >
              <ListIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Map View (Coming Soon)">
            <span>
              <IconButton disabled color="default">
                <MapIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

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

      {/* Search and Filter Bar */}
      <Paper sx={{ p: { xs: 2, sm: 2 }, mb: 3 }}>
        <Grid container spacing={{ xs: 2, sm: 2 }} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by location, city, or region..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => {
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
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="number"
              label="Radius (km)"
              value={radius}
              onChange={(e) => setRadius(parseFloat(e.target.value) || 50)}
              inputProps={{ min: 1, max: 200 }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
              <Button
                variant="contained"
                onClick={handleSearch}
                startIcon={<SearchIcon />}
                fullWidth
              >
                Search
              </Button>
              {userLocation && (
                <Button
                  variant="outlined"
                  onClick={handleRefreshLocation}
                  startIcon={<MyLocationIcon />}
                  fullWidth
                >
                  Refresh
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* User Location Info */}
      {userLocation && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Showing stations within {radius}km of your location (
          {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)})
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
        <Paper sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
          <LocationOnIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No stations found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {userLocation
              ? `No charging stations found within ${radius}km of your location. Try increasing the search radius.`
              : 'Please enable location services or search for a specific location.'}
          </Typography>
        </Paper>
      )}

      {/* Stations Grid */}
      {!loading && stations.length > 0 && (
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {stations.map((station) => (
            <Grid item xs={12} sm={6} md={4} key={station.chargePointId}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  '@media (hover: hover) and (pointer: fine)': {
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: (theme) => theme.shadows[4],
                      borderColor: 'primary.main',
                    },
                  },
                }}
                onClick={() => handleStationClick(station)}
              >
                <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                  {/* Header with Icon and Status */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 2,
                          bgcolor: 'primary.main',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <LocalGasStationIcon fontSize="small" />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                          {station.locationName || station.chargePointId}
                        </Typography>
                        {station.locationAddress && (
                          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocationOnIcon fontSize="inherit" sx={{ fontSize: '0.9rem' }} />
                            {station.locationAddress}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {isAuthenticated && (
                        <Tooltip title={favoriteIds.includes(station.chargePointId) ? 'Remove from favorites' : 'Add to favorites'}>
                          <IconButton
                            size="small"
                            onClick={(e) => handleToggleFavorite(e, station.chargePointId)}
                            color={favoriteIds.includes(station.chargePointId) ? 'error' : 'default'}
                            sx={{ p: 0.5 }}
                          >
                            {favoriteIds.includes(station.chargePointId) ? (
                              <FavoriteIcon fontSize="small" />
                            ) : (
                              <FavoriteBorderIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                      )}
                      <Chip
                        label={station.status}
                        color={getStatusColor(station.status) as any}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Station Details */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <MyLocationIcon fontSize="small" />
                        Distance:
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        {station.distanceKm.toFixed(1)} km
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <BoltIcon fontSize="small" />
                        Available:
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {station.availableConnectors} / {station.totalConnectors}
                      </Typography>
                    </Box>
                    {station.totalCapacityKw && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          Capacity:
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {station.totalCapacityKw} kW
                        </Typography>
                      </Box>
                    )}
                    {station.pricePerKwh && (
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          p: 1.5,
                          borderRadius: 1,
                          bgcolor: 'primary.light',
                          color: 'primary.contrastText',
                          mt: 0.5,
                        }}
                      >
                        <Typography variant="body2" fontWeight="bold">
                          Price:
                        </Typography>
                        <Typography variant="body1" fontWeight="bold" sx={{ fontSize: '1.1rem', textAlign: 'right', wordBreak: 'break-word' }}>
                          {station.currency || 'GHS'} {station.pricePerKwh != null ? Number(station.pricePerKwh).toFixed(2) : '0.00'}/kWh
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {station.amenities && station.amenities.length > 0 && (
                    <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {station.amenities.slice(0, 3).map((amenity, idx) => (
                        <Chip key={idx} label={amenity} size="small" variant="outlined" />
                      ))}
                    </Box>
                  )}
                </CardContent>

                {/* Action Buttons */}
                <CardActions
                  sx={{
                    p: 2,
                    pt: 0,
                    gap: 1,
                    flexDirection: { xs: 'column', sm: 'row' },
                  }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<DirectionsIcon />}
                    onClick={(e) => handleGetDirections(e, station)}
                    disabled={!station.locationLatitude || !station.locationLongitude}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      width: { xs: '100%', sm: 'auto' },
                      flex: { sm: 1 },
                      minWidth: { sm: 0 },
                      '&:hover': {
                        borderColor: 'primary.dark',
                        bgcolor: 'primary.light',
                        color: 'primary.dark',
                      },
                    }}
                  >
                    Directions
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<PlayArrowIcon />}
                    onClick={(e) => handleStartCharging(e, station)}
                    disabled={station.status !== 'Available' || station.availableConnectors === 0}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      bgcolor: 'success.main',
                      width: { xs: '100%', sm: 'auto' },
                      flex: { sm: 1 },
                      minWidth: { sm: 0 },
                      '&:hover': {
                        bgcolor: 'success.dark',
                      },
                      '&:disabled': {
                        bgcolor: 'action.disabledBackground',
                      },
                    }}
                  >
                    Start Charging
                  </Button>
                </CardActions>
              </Card>
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
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth scroll="paper">
        {selectedStation && (
          <>
            <DialogTitle>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: 1,
                }}
              >
                <Typography variant="h6" sx={{ minWidth: 0, pr: 1 }}>
                  {selectedStation.locationName || selectedStation.chargePointId}
                </Typography>
                <Chip
                  label={selectedStation.status}
                  color={getStatusColor(selectedStation.status) as any}
                  size="small"
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <List>
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
                      secondary={`${selectedStation.currency || 'GHS'} ${selectedStation.pricePerKwh != null ? Number(selectedStation.pricePerKwh).toFixed(2) : '0.00'} per kWh`}
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
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>Close</Button>
              {selectedStation.locationLatitude && selectedStation.locationLongitude && (
                <Button
                  variant="outlined"
                  startIcon={<DirectionsIcon />}
                  onClick={(e) => selectedStation && handleGetDirections(e, selectedStation)}
                >
                  Get Directions
                </Button>
              )}
              {selectedStation.status === 'Available' && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={isAuthenticated ? <PlayArrowIcon /> : <LoginIcon />}
                  onClick={(e) => {
                    if (isAuthenticated && selectedStation) {
                      handleStartCharging(e, selectedStation);
                    } else {
                      if (window.confirm('You need to login to start charging. Would you like to login now?')) {
                        sessionStorage.setItem('returnToStation', selectedStation?.chargePointId || '');
                        navigate('/login');
                      }
                    }
                  }}
                  sx={{ ml: 1 }}
                >
                  {isAuthenticated ? 'Start Charging' : 'Login to Start Charging'}
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}

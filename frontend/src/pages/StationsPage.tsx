import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  CircularProgress,
  LinearProgress,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
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
  sxObject,
} from '../styles/authShell';
import {
  dashboardPageTitleSx,
  dashboardPageSubtitleSx,
  premiumEmptyStatePaperSx,
} from '../theme/jampackShell';
import { chargingBottomSheetPremiumSx, chargingMapChromeSx } from '../theme/chargingPremiumShell';
import { CUSTOMER_ROUTES } from '../config/customerNav.paths';
import { StationListCard } from '../components/stations/StationListCard';
import { StationsMapView, type MapViewportBounds } from '../components/stations/StationsMapView';
import { formatCurrency } from '../utils/formatters';
import { getChargePointStatusColor } from '../utils/statusColors';
import { getStoredUser, hasValidSession } from '../utils/authSession';
import {
  buildGoogleMapsDrivingDirectionsUrl,
  openGoogleMapsDirections,
} from '../utils/googleMapsDirections';
import { reverseGeocodeAreaLabel } from '../services/reverseGeocodeApi';
import { formatApiOrNetworkError } from '../utils/apiErrors';

type SortBy = 'distance' | 'price' | 'name';

/** Server-side search radius (km) when loading by GPS; not shown in the UI. */
const NEARBY_LOAD_RADIUS_KM = 50;

export function StationsPage() {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<SortBy>('distance');
  const [mapSelectionId, setMapSelectionId] = useState<string | null>(null);
  /** Increments when the map should re-fit to markers (load nearby, search, near me). Not for viewport (pan) refresh. */
  const [mapFitToken, setMapFitToken] = useState(0);
  /** Reject findInBounds until this time to avoid spurious fetches right after `fitBounds` / `flyTo`. */
  const [ignoreViewportBoundsMoveEndsBefore, setIgnoreViewportBoundsMoveEndsBefore] = useState(
    () => Date.now() + 2000,
  );
  const [viewportStationsLoading, setViewportStationsLoading] = useState(false);
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
  const searchTermRef = useRef(searchTerm);
  searchTermRef.current = searchTerm;
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

  const bumpMapFit = useCallback(() => {
    setMapFitToken((n) => n + 1);
    setIgnoreViewportBoundsMoveEndsBefore(Date.now() + 1500);
  }, []);

  const sortedStations = useMemo(() => {
    const list = [...stations];
    list.sort((a, b) => {
      if (sortBy === 'price') {
        const pa = a.pricePerKwh != null ? Number(a.pricePerKwh) : Number.POSITIVE_INFINITY;
        const pb = b.pricePerKwh != null ? Number(b.pricePerKwh) : Number.POSITIVE_INFINITY;
        if (Number.isFinite(pa) && Number.isFinite(pb) && pa !== pb) {
          return pa - pb;
        }
      }
      if (sortBy === 'name') {
        const na = (a.locationName || a.chargePointId).toLowerCase();
        const nb = (b.locationName || b.chargePointId).toLowerCase();
        return na.localeCompare(nb);
      }
      return a.distanceKm - b.distanceKm;
    });
    return list;
  }, [stations, sortBy]);

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

  const loadNearbyStations = useCallback(
    async (lat: number, lng: number) => {
      try {
        setLoading(true);
        setError(null);
        const nearbyStations = await stationsApi.findNearby({
          latitude: lat,
          longitude: lng,
          radiusKm: NEARBY_LOAD_RADIUS_KM,
          status: ['Available', 'Charging', 'Preparing', 'Finishing'], // Only show active stations
          limit: 50,
        });
        setStations(nearbyStations);
        bumpMapFit();
      } catch (err: unknown) {
        setError(formatApiOrNetworkError(err));
        console.error('Error loading nearby stations:', err);
      } finally {
        setLoading(false);
      }
    },
    [bumpMapFit],
  );

  const loadNearbyStationsRef = useRef(loadNearbyStations);
  loadNearbyStationsRef.current = loadNearbyStations;

  const handleViewportBoundsStable = useCallback(async (bounds: MapViewportBounds) => {
    if (searchTermRef.current.trim() !== '') {
      return;
    }
    const activeStatuses: string[] = ['Available', 'Charging', 'Preparing', 'Finishing'];
    setViewportStationsLoading(true);
    setError(null);
    try {
      const list = await stationsApi.findInBounds({
        ...bounds,
        status: activeStatuses,
      });
      if (searchTermRef.current.trim() === '') {
        setStations(list);
      }
    } catch (err: unknown) {
      setError(formatApiOrNetworkError(err));
    } finally {
      setViewportStationsLoading(false);
    }
  }, []);

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
          loadNearbyStationsRef.current(lat, lng);
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
      bumpMapFit();
    } catch (err: unknown) {
      setError(formatApiOrNetworkError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleStationClick = (station: StationWithDistance) => {
    setMapSelectionId(station.chargePointId);
    setSelectedStation(station);
    setDialogOpen(true);
  };

  const closeDetailsDialog = useCallback(() => {
    setDialogOpen(false);
    setMapSelectionId(null);
    setSelectedStation(null);
  }, []);

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
      <Box sx={{ mb: 3 }}>
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
        {isAuthenticated && (
          <Button
            component={RouterLink}
            to={CUSTOMER_ROUTES.charging}
            size="small"
            variant="outlined"
            sx={{
              mt: 1.25,
              textTransform: 'none',
              fontWeight: 600,
              width: { xs: '100%', sm: 'auto' },
              borderRadius: 1.5,
            }}
          >
            Charging hub
          </Button>
        )}
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

      {/* Map + bottom sheet (trip-planner style) */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
            mb: 2,
          }}
        >
          <Box
            sx={{
              height: { xs: '38dvh', sm: 400 },
              minHeight: 200,
              position: 'relative',
              borderRadius: { xs: 0, sm: 1 },
              overflow: 'hidden',
              mx: { xs: -2, sm: 0 },
              ...(isAuthenticated
                ? chargingMapChromeSx
                : { border: (t) => `1px solid ${t.palette.divider}` }),
            }}
          >
            {loading && (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(255,255,255,0.55)',
                }}
              >
                <CircularProgress />
              </Box>
            )}
            <StationsMapView
              stations={stations}
              userLocation={userLocation}
              selectedChargePointId={mapSelectionId}
              onSelectStation={handleStationClick}
              mapFitToken={mapFitToken}
              ignoreViewportBoundsMoveEndsBefore={ignoreViewportBoundsMoveEndsBefore}
              onViewportBoundsStable={handleViewportBoundsStable}
              viewportSearchEnabled={stations.length > 0 && !searchTerm.trim()}
            />
          </Box>
          <Paper
            elevation={3}
            sx={{
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              mt: { xs: -0.5, sm: 0 },
              p: { xs: 2, sm: 2.25 },
              flex: 1,
              minHeight: 180,
              maxHeight: { xs: 'min(48dvh, 480px)', sm: 'none' },
              overflow: 'auto',
              ...(isAuthenticated ? chargingBottomSheetPremiumSx : {}),
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
              Find stations
            </Typography>
            {viewportStationsLoading && (
              <LinearProgress
                color="primary"
                sx={{ mb: 1.5, borderRadius: 0.5, width: '100%' }}
                aria-label="Loading stations in map area"
              />
            )}
            <Grid container spacing={{ xs: 1.5, sm: 2 }} alignItems="stretch" sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search city, address, or ID…"
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
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" sx={(th) => sxObject(th, authFormFieldSx)}>
                  <InputLabel id="stations-sort-label-map">Sort</InputLabel>
                  <Select
                    labelId="stations-sort-label-map"
                    label="Sort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortBy)}
                  >
                    <MenuItem value="distance">Distance</MenuItem>
                    <MenuItem value="price">Price</MenuItem>
                    <MenuItem value="name">Name</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSearch}
                  startIcon={<SearchIcon />}
                  fullWidth
                  disableElevation
                  sx={compactContainedCtaSx}
                >
                  Search
                </Button>
              </Grid>
            </Grid>
            {loading && stations.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                Finding stations…
              </Typography>
            )}
            {!loading && stations.length === 0 && !error && (
              <Paper elevation={0} sx={{ ...premiumEmptyStatePaperSx, p: 2 }}>
                <Typography variant="body2" color="text.secondary" align="center">
                  {userLocation
                    ? 'No stations found for this area. Try a different search.'
                    : 'Enable location or search by area or station ID.'}
                </Typography>
              </Paper>
            )}
            {!loading && sortedStations.length > 0 && (
              <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                {sortedStations.map((station) => (
                  <Grid item xs={12} sm={6} key={station.chargePointId}>
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
          </Paper>
        </Box>

      {/* User Location Info */}
      {userLocation && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2" component="div">
            Showing stations near{' '}
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
              <Button onClick={closeDetailsDialog} sx={(th) => sxObject(th, compactOutlinedCtaSx)}>
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

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Skeleton,
  LinearProgress,
  Alert,
  TextField,
  InputAdornment,
  Button,
  Collapse,
  InputLabel,
  Link,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { stationsApi, StationWithDistance } from '../services/stationsApi';
import { usersApi } from '../services/usersApi';
import { websocketService } from '../services/websocket';
import { StartChargingDialog } from '../components/StartChargingDialog';
import {
  authFormFieldSx,
  compactContainedCtaSx,
  compactOutlinedCtaSx,
  sxObject,
} from '../styles/authShell';
import { premiumEmptyStatePaperSx, premiumPanelCardSx } from '../theme/jampackShell';
import { LivePageHeader } from '../components/dashboard/LivePageHeader';
import { useCustomerPullRefresh } from '../contexts/CustomerPullRefreshContext';
import { triggerHaptic } from '../utils/haptics';
import { CUSTOMER_ROUTES } from '../config/customerNav.paths';
import { StationListCard } from '../components/stations/StationListCard';
import { StationDetailsSheet } from '../components/stations/StationDetailsSheet';
import { LoginPromptSheet } from '../components/stations/LoginPromptSheet';
import { StationsMapView, type MapViewportBounds } from '../components/stations/StationsMapView';
import { getStoredUser, hasValidSession } from '../utils/authSession';
import {
  buildGoogleMapsDrivingDirectionsUrl,
  openGoogleMapsDirections,
} from '../utils/googleMapsDirections';
import { reverseGeocodeAreaLabel } from '../services/reverseGeocodeApi';
import { formatApiOrNetworkError } from '../utils/apiErrors';
import { visuallyHiddenSx } from '../styles/visuallyHidden';

/** Server-side search radius (km) when loading by GPS; not shown in the UI. */
const NEARBY_LOAD_RADIUS_KM = 50;

const STATIONS_SEARCH_FIELD_ID = 'stations-search-field';
const STATIONS_SEARCH_HINT_ID = 'stations-search-hint';
const STATIONS_MAP_HINT_ID = 'stations-map-hint';
const STATIONS_MAP_PANEL_ID = 'stations-map-panel';

export function StationsPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isNarrow = useMediaQuery(theme.breakpoints.down('sm'));
  const mapSectionRef = useRef<HTMLDivElement>(null);
  const [mapExpanded, setMapExpanded] = useState(() => !isNarrow);
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
  /** Open start-charging sheet after the station details sheet has closed (avoids stacked drawers on mobile). */
  const [pendingStartChargingStation, setPendingStartChargingStation] = useState<StationWithDistance | null>(null);
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

  /** Nearest-first (same as former default “Distance” sort). */
  const sortedStations = useMemo(() => {
    const list = [...stations];
    list.sort((a, b) => a.distanceKm - b.distanceKm);
    return list;
  }, [stations]);

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

  const handleSearch = useCallback(async () => {
    triggerHaptic('light');
    if (!searchTerm.trim()) {
      if (userLocation) {
        await loadNearbyStations(userLocation.lat, userLocation.lng);
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
  }, [searchTerm, userLocation, loadNearbyStations, bumpMapFit]);

  const refreshStations = useCallback(async () => {
    if (searchTerm.trim()) {
      await handleSearch();
      return;
    }
    if (userLocation) {
      await loadNearbyStations(userLocation.lat, userLocation.lng);
    }
  }, [searchTerm, userLocation, handleSearch, loadNearbyStations]);

  useCustomerPullRefresh(refreshStations);

  const closeDetailsDialog = useCallback(() => {
    setDialogOpen(false);
    setMapSelectionId(null);
    setSelectedStation(null);
  }, []);

  useEffect(() => {
    if (!dialogOpen && pendingStartChargingStation) {
      setSelectedStationForCharging(pendingStartChargingStation);
      setStartChargingDialogOpen(true);
      setPendingStartChargingStation(null);
    }
  }, [dialogOpen, pendingStartChargingStation]);

  const handleViewFullStationDetails = useCallback(
    (station: StationWithDistance) => {
      closeDetailsDialog();
      navigate(`${CUSTOMER_ROUTES.stations}/${station.chargePointId}`);
    },
    [closeDetailsDialog, navigate],
  );

  useEffect(() => {
    if (isNarrow) {
      setMapExpanded(false);
    } else {
      setMapExpanded(true);
    }
  }, [isNarrow]);

  useEffect(() => {
    if (!mapSelectionId) return;
    setMapExpanded(true);
    if (!mapSectionRef.current) return;
    mapSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [mapSelectionId]);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    handleSearch();
  };

  const handleStationClick = (station: StationWithDistance) => {
    triggerHaptic('light');
    setMapSelectionId(station.chargePointId);
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
    } else if (dialogOpen) {
      setPendingStartChargingStation(station);
      setDialogOpen(false);
      setMapSelectionId(null);
      setSelectedStation(null);
    } else {
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
      triggerHaptic('light');
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

  const listRefreshing = loading || viewportStationsLoading;
  const liveStatusMessage = useMemo(() => {
    if (loading && stations.length === 0) {
      return 'Finding nearby charging stations.';
    }
    if (viewportStationsLoading) {
      return 'Updating stations for the visible map area.';
    }
    if (!loading && stations.length === 0 && !error) {
      return 'No charging stations found. Try another search or open the map to explore.';
    }
    if (sortedStations.length > 0) {
      return `${sortedStations.length} charging station${sortedStations.length === 1 ? '' : 's'} listed, sorted by distance.`;
    }
    return '';
  }, [loading, viewportStationsLoading, stations.length, sortedStations.length, error]);

  const stationsSubtitle = userAreaLabel
    ? `Near ${userAreaLabel}`
    : userLocation
      ? 'Stations sorted by distance from you'
      : 'Search or enable location to find chargers';

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <LivePageHeader
        title="Stations"
        subtitle={stationsSubtitle}
        updatedAt={null}
        refreshing={listRefreshing}
        onRefresh={() => void refreshStations()}
        titleVariant="large"
        containerSx={{ mb: 2 }}
        refreshSx={{ width: { xs: '100%', sm: 'auto' } }}
        actions={
          isAuthenticated ? (
            <Button
              component={RouterLink}
              to={CUSTOMER_ROUTES.charging}
              variant="outlined"
              sx={(th) => ({
                ...sxObject(th, compactOutlinedCtaSx),
                width: { xs: '100%', sm: 'auto' },
              })}
            >
              Charging hub
            </Button>
          ) : undefined
        }
      />

      {locationError && (
        <Alert severity="warning" sx={{ mb: 2 }} role="alert" onClose={() => setLocationError(null)}>
          {locationError}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} role="alert" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box
        component="p"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        sx={visuallyHiddenSx}
      >
        {liveStatusMessage}
      </Box>

      {/* List-first (Uber/Bolt): pick a station from cards, then use the map for context */}
      <Paper
        elevation={0}
        component="section"
        aria-labelledby="stations-list-heading"
        sx={{ ...premiumPanelCardSx, mb: 2 }}
      >
        <Typography
          id="stations-list-heading"
          variant="subtitle1"
          component="h2"
          sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}
        >
          Nearby chargers
        </Typography>
        <Typography
          id={STATIONS_SEARCH_HINT_ID}
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2 }}
        >
          Search or browse available stations. The list is the easiest way to choose a charger; open the
          map for a geographic view. Keyboard users: use Tab to move between station cards.
        </Typography>
        <Box
          component="form"
          onSubmit={handleSearchSubmit}
          aria-describedby={STATIONS_SEARCH_HINT_ID}
          sx={{ mb: 2 }}
        >
          <InputLabel htmlFor={STATIONS_SEARCH_FIELD_ID} sx={visuallyHiddenSx}>
            Search stations by city, address, or charge point ID
          </InputLabel>
          <Grid container spacing={{ xs: 1.5, sm: 2 }} alignItems="stretch">
            <Grid item xs={12}>
              <TextField
                id={STATIONS_SEARCH_FIELD_ID}
                fullWidth
                placeholder="Search city, address, or ID…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" aria-hidden />
                    </InputAdornment>
                  ),
                }}
                sx={(th) => sxObject(th, authFormFieldSx)}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<SearchIcon />}
                fullWidth
                disableElevation
                sx={compactContainedCtaSx}
              >
                Search stations
              </Button>
            </Grid>
          </Grid>
        </Box>
        {viewportStationsLoading && (
          <LinearProgress
            color="primary"
            sx={{ mb: 1.5, borderRadius: 0.5, width: '100%' }}
            aria-label="Loading stations in map area"
          />
        )}
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
        {loading && stations.length === 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ py: 2, textAlign: 'center' }}
            role="status"
            aria-live="polite"
          >
            Finding stations…
          </Typography>
        )}
        {!loading && stations.length === 0 && !error && (
          <Paper elevation={0} sx={{ ...premiumEmptyStatePaperSx, p: 2, mb: 0 }}>
            <Typography variant="body2" color="text.secondary" align="center" component="div">
              {userLocation
                ? 'No stations found for this area. Try a different search or pan the map below.'
                : 'Enable location or search by area or station ID.'}
            </Typography>
            {userLocation && (
              <Typography
                variant="caption"
                color="text.secondary"
                align="center"
                component="div"
                sx={{ display: 'block', mt: 1.5, lineHeight: 1.5 }}
              >
                Operators: chargers only appear here when they have GPS coordinates, are in an active status
                (Available, Charging, Preparing, or Finishing), and are within range.
              </Typography>
            )}
          </Paper>
        )}
        {!loading && sortedStations.length > 0 ? (
          <>
            <Typography
              id="stations-results-count"
              variant="body2"
              color="text.secondary"
              sx={{ mb: 1.5 }}
              aria-live="polite"
            >
              {sortedStations.length} station{sortedStations.length === 1 ? '' : 's'} nearby, nearest
              first
            </Typography>
            <Box
              component="ul"
              aria-labelledby="stations-results-count"
              sx={{
                listStyle: 'none',
                m: 0,
                p: 0,
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  lg: 'repeat(3, 1fr)',
                },
                gap: { xs: 1.5, sm: 2 },
              }}
            >
              {sortedStations.map((station) => (
                <Box component="li" key={station.chargePointId}>
                  <StationListCard
                    station={station}
                    isAuthenticated={isAuthenticated}
                    isFavorite={favoriteIds.includes(station.chargePointId)}
                    selected={mapSelectionId === station.chargePointId}
                    onOpenDetails={handleStationClick}
                    onCardKeyDown={handleStationCardKeyDown(station)}
                    onDirections={handleGetDirections}
                    onStartCharging={handleStartCharging}
                    onToggleFavorite={handleToggleFavorite}
                  />
                </Box>
              ))}
            </Box>
          </>
        ) : null}

        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            aria-expanded={mapExpanded}
            aria-controls={STATIONS_MAP_PANEL_ID}
            onClick={() => setMapExpanded((v) => !v)}
            sx={(th) => ({
              ...sxObject(th, compactOutlinedCtaSx),
              width: { xs: '100%', sm: 'auto' },
            })}
          >
            {mapExpanded ? 'Hide map' : 'Show map'}
          </Button>
          {!mapExpanded ? (
            <Link href={`#${STATIONS_MAP_PANEL_ID}`} underline="hover" variant="body2" sx={{ alignSelf: 'center' }}>
              Skip to map section
            </Link>
          ) : null}
        </Box>
      </Paper>

      <Box
        ref={mapSectionRef}
        component="section"
        id={STATIONS_MAP_PANEL_ID}
        aria-labelledby="stations-map-heading"
        aria-describedby={STATIONS_MAP_HINT_ID}
        sx={{ mb: 2 }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'baseline' },
            justifyContent: 'space-between',
            gap: 0.5,
            mb: 1.25,
          }}
        >
          <Typography id="stations-map-heading" variant="subtitle1" component="h2" sx={{ fontWeight: 600 }}>
            Map view
          </Typography>
          <Typography id={STATIONS_MAP_HINT_ID} variant="caption" color="text.secondary" component="p">
            Pan and zoom to explore. Markers are not fully keyboard-accessible; use the station list
            above to select a charger.
          </Typography>
        </Box>
        <Collapse in={mapExpanded}>
        <Box
          role="application"
          aria-label="Map of nearby charging stations"
          tabIndex={0}
          sx={{
            height: { xs: 260, sm: 320, md: 380 },
            minHeight: 200,
            position: 'relative',
            borderRadius: 2,
            overflow: 'hidden',
            border: (t) => `1px solid ${t.palette.divider}`,
            bgcolor: 'background.paper',
            '&:focus-visible': {
              outline: (t) => `2px solid ${t.palette.primary.main}`,
              outlineOffset: 2,
            },
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
                p: 2,
                bgcolor: (t) => t.palette.action.hover,
              }}
              role="status"
              aria-busy="true"
              aria-label="Loading stations map"
            >
              <Skeleton
                variant="rounded"
                animation="wave"
                sx={{ width: 'min(92%, 440px)', height: 'min(55%, 240px)', borderRadius: 2 }}
              />
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
        </Collapse>
      </Box>

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

      <StationDetailsSheet
        open={dialogOpen}
        onClose={closeDetailsDialog}
        station={selectedStation}
        isAuthenticated={isAuthenticated}
        onDirections={handleGetDirections}
        onStartCharging={handleStartCharging}
        onLoginPrompt={openLoginPrompt}
        onViewFullDetails={handleViewFullStationDetails}
      />
      <LoginPromptSheet
        open={loginPromptOpen}
        onClose={() => setLoginPromptOpen(false)}
        onConfirm={confirmLoginPrompt}
      />
    </Box>
  );
}

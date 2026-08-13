import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Skeleton,
  LinearProgress,
  Alert,
  TextField,
  InputAdornment,
  InputLabel,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { stationsApi, StationWithDistance } from '../services/stationsApi';
import { usersApi } from '../services/usersApi';
import { websocketService } from '../services/websocket';
import { StartChargingDialog } from '../components/StartChargingDialog';
import { authFormFieldSx, sxObject } from '../styles/authShell';
import { premiumPanelCardSx } from '../theme/jampackShell';
import { LivePageHeader } from '../components/dashboard/LivePageHeader';
import { useCustomerPullRefresh } from '../contexts/CustomerPullRefreshContext';
import { triggerHaptic } from '../utils/haptics';
import { CUSTOMER_ROUTES } from '../config/customerNav.paths';
import { StationListCard } from '../components/stations/StationListCard';
import { StationDetailsSheet } from '../components/stations/StationDetailsSheet';
import { LoginPromptSheet } from '../components/stations/LoginPromptSheet';
import { StationsMapView, type MapViewportBounds } from '../components/stations/StationsMapView';
import { AppEmptyState } from '../components/ui/AppEmptyState';
import { CUSTOMER_IMAGES } from '../config/customerImagery';
import { getStoredUser, hasValidSession } from '../utils/authSession';
import {
  buildGoogleMapsDrivingDirectionsUrl,
  openGoogleMapsDirections,
} from '../utils/googleMapsDirections';
import { reverseGeocodeAreaLabel } from '../services/reverseGeocodeApi';
import { formatApiOrNetworkError } from '../utils/apiErrors';
import { formatUserFacingErrorMessage, UserMessages } from '../utils/userFriendlyErrors';
import { visuallyHiddenSx } from '../styles/visuallyHidden';
import { useCustomerActiveSessions } from '../hooks/useCustomerActiveSessions';
import { useWalletAvailableBalance } from '../hooks/useWalletAvailableBalance';
import { WalletTopUpAlert } from '../components/WalletTopUpAlert';
import { UserErrorAlert } from '../components/UserErrorAlert';

/** Server-side search radius (km) when loading by GPS; not shown in the UI. */
const NEARBY_LOAD_RADIUS_KM = 50;

const STATIONS_SEARCH_FIELD_ID = 'stations-search-field';
const STATIONS_SEARCH_HINT_ID = 'stations-search-hint';
const STATIONS_MAP_HINT_ID = 'stations-map-hint';
const STATIONS_MAP_PANEL_ID = 'stations-map-panel';

export function StationsPage() {
  const navigate = useNavigate();
  const mapSectionRef = useRef<HTMLDivElement>(null);
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
  /** Bumped on nearby/search loads so stale responses cannot overwrite the list. */
  const stationsLoadEpochRef = useRef(0);
  /** Viewport findInBounds only after the user pans/zooms the map (not programmatic fit). */
  const userAdjustedMapViewRef = useRef(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [pendingStationForLogin, setPendingStationForLogin] = useState<StationWithDistance | null>(null);

  const { byChargePointId: activeSessionsByStation, reload: reloadActiveSessions } =
    useCustomerActiveSessions(isAuthenticated);

  const { isBelowMinimum: walletBelowMinimum } = useWalletAvailableBalance(isAuthenticated);
  const hasActiveChargingSession = activeSessionsByStation.size > 0;

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
    userAdjustedMapViewRef.current = false;
    setMapFitToken((n) => n + 1);
    setIgnoreViewportBoundsMoveEndsBefore(Date.now() + 2500);
  }, []);

  const applyStationsIfCurrent = useCallback((epoch: number, list: StationWithDistance[]) => {
    if (epoch !== stationsLoadEpochRef.current) return;
    setStations(list);
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
      if (searchTermRef.current.trim() !== '') {
        return;
      }
      const epoch = ++stationsLoadEpochRef.current;
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
        applyStationsIfCurrent(epoch, nearbyStations);
        bumpMapFit();
      } catch (err: unknown) {
        if (epoch === stationsLoadEpochRef.current) {
          setError(formatApiOrNetworkError(err, 'stations'));
        }
        console.error('Error loading nearby stations:', err);
      } finally {
        if (epoch === stationsLoadEpochRef.current) {
          setLoading(false);
        }
      }
    },
    [applyStationsIfCurrent, bumpMapFit],
  );

  const loadNearbyStationsRef = useRef(loadNearbyStations);
  loadNearbyStationsRef.current = loadNearbyStations;

  const handleViewportBoundsStable = useCallback(
    async (bounds: MapViewportBounds) => {
      if (searchTermRef.current.trim() !== '' || !userAdjustedMapViewRef.current) {
        return;
      }
      const epoch = ++stationsLoadEpochRef.current;
      const activeStatuses: string[] = ['Available', 'Charging', 'Preparing', 'Finishing'];
      setViewportStationsLoading(true);
      setError(null);
      try {
        const list = await stationsApi.findInBounds({
          ...bounds,
          status: activeStatuses,
        });
        if (searchTermRef.current.trim() === '' && userAdjustedMapViewRef.current) {
          applyStationsIfCurrent(epoch, list);
        }
      } catch (err: unknown) {
        if (epoch === stationsLoadEpochRef.current) {
          setError(formatApiOrNetworkError(err, 'stations'));
        }
      } finally {
        if (epoch === stationsLoadEpochRef.current) {
          setViewportStationsLoading(false);
        }
      }
    },
    [applyStationsIfCurrent],
  );

  const handleUserAdjustedMapView = useCallback(() => {
    userAdjustedMapViewRef.current = true;
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
              ? 'Location access is off. Enable location in your browser settings to find nearby chargers, or search by name.'
              : 'We could not get your location. Search for a station by name or open the map.',
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
      setLocationError(
        'Your browser does not support location. Search for a station by name or browse the map.',
      );
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

    const epoch = ++stationsLoadEpochRef.current;
    userAdjustedMapViewRef.current = false;
    try {
      setLoading(true);
      setError(null);
      const results = await stationsApi.search(
        searchTerm.trim(),
        50,
        userLocation ? { latitude: userLocation.lat, longitude: userLocation.lng } : undefined,
      );
      applyStationsIfCurrent(epoch, results);
      bumpMapFit();
    } catch (err: unknown) {
      if (epoch === stationsLoadEpochRef.current) {
        setError(formatApiOrNetworkError(err));
      }
    } finally {
      if (epoch === stationsLoadEpochRef.current) {
        setLoading(false);
      }
    }
  }, [searchTerm, userLocation, loadNearbyStations, bumpMapFit, applyStationsIfCurrent]);

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
    if (!mapSelectionId) return;
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
    void reloadActiveSessions();
    if (userLocation && searchTermRef.current.trim() === '') {
      void loadNearbyStations(userLocation.lat, userLocation.lng);
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
      setError(formatUserFacingErrorMessage(err, 'stations') || UserMessages.favoritesFailed);
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
      return 'No charging stations found. Try another search or pan the map.';
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
        title="Map"
        subtitle={stationsSubtitle}
        updatedAt={null}
        refreshing={listRefreshing}
        onRefresh={() => void refreshStations()}
        titleVariant="large"
        containerSx={{ mb: 2 }}
        refreshSx={{ width: { xs: '100%', sm: 'auto' } }}
      />

      {locationError && (
        <Alert severity="warning" sx={{ mb: 2 }} role="alert" onClose={() => setLocationError(null)}>
          {locationError}
        </Alert>
      )}

      {error && (
        <UserErrorAlert error={error} context="stations" sx={{ mb: 2 }} onClose={() => setError(null)} />
      )}

      {isAuthenticated && walletBelowMinimum && (
        <WalletTopUpAlert
          variant={hasActiveChargingSession ? 'duringCharging' : 'belowMinimum'}
          sx={{ mb: 2 }}
        />
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

      <Box
        component="form"
        onSubmit={handleSearchSubmit}
        aria-describedby={STATIONS_SEARCH_HINT_ID}
        sx={{ mb: 1.5 }}
      >
        <Typography id={STATIONS_SEARCH_HINT_ID} sx={visuallyHiddenSx}>
          Search by city, address, or charge point ID. Press Search or Return to run the search.
        </Typography>
        <InputLabel htmlFor={STATIONS_SEARCH_FIELD_ID} sx={visuallyHiddenSx}>
          Search stations by city, address, or charge point ID
        </InputLabel>
        <TextField
          id={STATIONS_SEARCH_FIELD_ID}
          type="search"
          fullWidth
          placeholder="City, address, or ID"
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
      </Box>

      {viewportStationsLoading && (
        <LinearProgress
          color="primary"
          sx={{ mb: 1.5, borderRadius: 0.5, width: '100%' }}
          aria-label="Loading stations in map area"
        />
      )}

      <Paper
        elevation={0}
        component="section"
        aria-labelledby="stations-list-heading"
        sx={{ ...premiumPanelCardSx, mb: { xs: 1.5, sm: 2 } }}
      >
        <Typography
          id="stations-list-heading"
          variant="subtitle1"
          component="h2"
          sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}
        >
          Nearby chargers
        </Typography>
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
          <AppEmptyState
            variant="plain"
            sx={{ p: 2, mb: 0 }}
            illustrationSrc={CUSTOMER_IMAGES.stationHero}
            illustrationAlt=""
            title="No chargers here"
            description={
              userLocation
                ? 'Nothing in this area yet. Search another place or scroll to the map.'
                : 'Turn on location, or search by area or station ID.'
            }
          />
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
                    activeSession={activeSessionsByStation.get(station.chargePointId) ?? null}
                    onChargingStopped={() => {
                      void reloadActiveSessions();
                      void refreshStations();
                    }}
                    onLoginPrompt={(_, s) => openLoginPrompt(s)}
                  />
                </Box>
              ))}
            </Box>
          </>
        ) : null}
      </Paper>

      <Box
        ref={mapSectionRef}
        component="section"
        id={STATIONS_MAP_PANEL_ID}
        aria-labelledby="stations-map-heading"
        aria-describedby={STATIONS_MAP_HINT_ID}
        sx={{
          mb: 0,
          mx: { xs: -2, sm: 0 },
        }}
      >
        <Typography id="stations-map-heading" sx={visuallyHiddenSx}>
          Map of nearby charging stations
        </Typography>
        <Typography id={STATIONS_MAP_HINT_ID} sx={visuallyHiddenSx}>
          Pan and zoom to explore. Use the station list above to select a charger with the keyboard.
        </Typography>
        <Box
          role="application"
          aria-label="Map of nearby charging stations"
          tabIndex={0}
          sx={{
            height: { xs: 220, sm: 300, md: 380 },
            position: 'relative',
            borderRadius: { xs: 0, sm: 2 },
            overflow: 'hidden',
            border: 'none',
            borderTop: (t) => `1px solid ${t.palette.divider}`,
            bgcolor: 'background.paper',
            sm: {
              border: (t) => `1px solid ${t.palette.divider}`,
            },
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
            onUserAdjustedMapView={handleUserAdjustedMapView}
            viewportSearchEnabled={stations.length > 0 && searchTerm.trim() === ''}
          />
        </Box>
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
        activeSession={
          selectedStation
            ? activeSessionsByStation.get(selectedStation.chargePointId) ?? null
            : null
        }
        onChargingStopped={() => {
          void reloadActiveSessions();
          void refreshStations();
        }}
      />
      <LoginPromptSheet
        open={loginPromptOpen}
        onClose={() => setLoginPromptOpen(false)}
        onConfirm={confirmLoginPrompt}
      />
    </Box>
  );
}

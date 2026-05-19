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
  useMediaQuery,
  useTheme,
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
import { premiumEmptyStatePaperSx } from '../theme/jampackShell';
import { LivePageHeader } from '../components/dashboard/LivePageHeader';
import { useCustomerPullRefresh } from '../contexts/CustomerPullRefreshContext';
import { triggerHaptic } from '../utils/haptics';
import { chargingBottomSheetPremiumSx, chargingMapChromeSx } from '../theme/chargingPremiumShell';
import { SheetDragHandle } from '../components/ios/SheetDragHandle';
import { CUSTOMER_ROUTES } from '../config/customerNav.paths';
import { StationListCard } from '../components/stations/StationListCard';
import { StationSheetListItem } from '../components/stations/StationSheetListItem';
import { GroupedListSection } from '../components/ios/GroupedListSection';
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

/** Server-side search radius (km) when loading by GPS; not shown in the UI. */
const NEARBY_LOAD_RADIUS_KM = 50;

export function StationsPage() {
  const theme = useTheme();
  const useCompactStationList = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
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

  const handleViewFullStationDetails = useCallback(
    (station: StationWithDistance) => {
      closeDetailsDialog();
      navigate(`${CUSTOMER_ROUTES.stations}/${station.chargePointId}`);
    },
    [closeDetailsDialog, navigate],
  );

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
                  p: 2,
                  bgcolor: 'rgba(255,255,255,0.6)',
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
          <Paper
            elevation={0}
            role="region"
            aria-label="Station search and list"
            sx={{
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              mt: { xs: -0.5, sm: 0 },
              pt: { xs: 0.5, sm: 0 },
              px: { xs: 2, sm: 2.25 },
              pb: { xs: 2, sm: 2.25 },
              flex: 1,
              minHeight: 180,
              maxHeight: { xs: 'min(48dvh, 480px)', sm: 'none' },
              overflow: 'auto',
              WebkitOverflowScrolling: 'touch',
              ...(isAuthenticated ? chargingBottomSheetPremiumSx : {}),
            }}
          >
            {isAuthenticated ? <SheetDragHandle /> : null}
            <Typography
              variant="caption"
              component="h2"
              sx={{ display: 'block', fontWeight: 600, color: 'text.secondary', mb: 1.5, px: 0.25 }}
            >
              Nearby & search
            </Typography>
            {viewportStationsLoading && (
              <LinearProgress
                color="primary"
                sx={{ mb: 1.5, borderRadius: 0.5, width: '100%' }}
                aria-label="Loading stations in map area"
              />
            )}
            <Grid container spacing={{ xs: 1.5, sm: 2 }} alignItems="stretch" sx={{ mb: 2 }}>
              <Grid item xs={12}>
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
                <Typography variant="body2" color="text.secondary" align="center" component="div">
                  {userLocation
                    ? 'No stations found for this area. Try a different search or zoom the map.'
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
            {!loading && sortedStations.length > 0 && useCompactStationList ? (
              <GroupedListSection sx={{ mx: -0.5 }}>
                {sortedStations.map((station, index) => (
                  <StationSheetListItem
                    key={station.chargePointId}
                    station={station}
                    isAuthenticated={isAuthenticated}
                    isFavorite={favoriteIds.includes(station.chargePointId)}
                    divider={index < sortedStations.length - 1}
                    onOpen={handleStationClick}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </GroupedListSection>
            ) : null}
            {!loading && sortedStations.length > 0 && !useCompactStationList ? (
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
            ) : null}
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

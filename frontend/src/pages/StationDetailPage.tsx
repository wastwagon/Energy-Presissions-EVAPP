import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Alert,
  Button,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DirectionsIcon from '@mui/icons-material/Directions';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import BoltIcon from '@mui/icons-material/Bolt';
import { stationsApi, StationDetails } from '../services/stationsApi';
import { StartChargingDialog } from '../components/StartChargingDialog';
import { LivePageHeader } from '../components/dashboard/LivePageHeader';
import { premiumPanelCardSx } from '../theme/jampackShell';
import { compactContainedCtaSx, compactOutlinedCtaSx, sxObject } from '../styles/authShell';
import { formatCurrency } from '../utils/formatters';
import { getChargePointStatusColor } from '../utils/statusColors';
import { CUSTOMER_ROUTES } from '../config/customerNav.paths';
import {
  buildGoogleMapsDrivingDirectionsUrl,
  openGoogleMapsDirections,
  parseLatLng,
} from '../utils/googleMapsDirections';
import { StationDetailPageSkeleton } from '../components/dashboard/CustomerChromeSkeleton';
import { useCustomerPullRefresh } from '../contexts/CustomerPullRefreshContext';
import { GroupedListSection } from '../components/ios/GroupedListSection';
import { GroupedDetailRow } from '../components/ios/GroupedDetailRow';
import { triggerHaptic } from '../utils/haptics';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="overline"
      sx={{
        letterSpacing: '0.1em',
        color: 'text.secondary',
        fontWeight: 700,
        display: 'block',
        mb: 1.25,
        fontSize: '0.68rem',
      }}
    >
      {children}
    </Typography>
  );
}

export function StationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down('md'));
  const [station, setStation] = useState<StationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startChargingDialogOpen, setStartChargingDialogOpen] = useState(false);

  const loadStation = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      const data = await stationsApi.getDetails(id);
      setStation(data);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load station');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadStation();
  }, [loadStation]);

  useCustomerPullRefresh(useCallback(() => void loadStation(), [loadStation]));

  const handleGetDirections = () => {
    if (!station) return;
    triggerHaptic('light');
    const url = buildGoogleMapsDrivingDirectionsUrl(
      station.locationLatitude,
      station.locationLongitude,
      null,
    );
    if (url) {
      openGoogleMapsDirections(url);
    }
  };

  const backButton = (
    <Button
      startIcon={<ArrowBackIcon />}
      onClick={() => navigate(CUSTOMER_ROUTES.stations)}
      variant="outlined"
      color="primary"
      sx={(th) => ({
        ...sxObject(th, compactOutlinedCtaSx),
        width: { xs: '100%', sm: 'auto' },
      })}
    >
      Back
    </Button>
  );

  if (loading) {
    return <StationDetailPageSkeleton />;
  }

  if (!station || error) {
    return (
      <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
        <LivePageHeader
          title="Station"
          subtitle="Charger details"
          updatedAt={null}
          refreshing={false}
          onRefresh={() => void loadStation()}
          titleVariant="large"
          containerSx={{ mb: 2 }}
          actions={backButton}
        />
        <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
          {error || 'Station not found'}
        </Alert>
      </Box>
    );
  }

  const priceNum =
    station.pricePerKwh != null && !Number.isNaN(Number(station.pricePerKwh))
      ? Number(station.pricePerKwh)
      : null;

  const statusChip = (
    <Chip label={station.status} color={getChargePointStatusColor(station.status)} sx={{ fontWeight: 700 }} />
  );

  const startChargingButton = (
    <Button
      variant="contained"
      color="primary"
      fullWidth
      disableElevation
      startIcon={<PlayArrowIcon />}
      onClick={() => {
        triggerHaptic('light');
        setStartChargingDialogOpen(true);
      }}
      disabled={station.status !== 'Available' || station.availableConnectors === 0}
      sx={(th) => ({ ...sxObject(th, compactContainedCtaSx), width: { xs: '100%', sm: 'auto' } })}
    >
      Start charging
    </Button>
  );

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <LivePageHeader
        title={station.locationName || station.chargePointId}
        subtitle={station.chargePointId}
        updatedAt={null}
        refreshing={false}
        onRefresh={() => void loadStation()}
        refreshDisabled
        titleVariant="large"
        containerSx={{ mb: 2 }}
        actions={
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: { sm: 'flex-end' } }}>
            {backButton}
            {statusChip}
          </Box>
        }
      />

      {isCompact ? (
        <Stack spacing={0}>
          <GroupedListSection title="Location">
            <GroupedDetailRow
              label="Address"
              value={
                <Box component="span" sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, justifyContent: 'flex-end' }}>
                  <LocationOnIcon sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }} />
                  <span>{station.locationAddress || station.locationName || 'Not set'}</span>
                </Box>
              }
              divider={Boolean(station.locationCity || station.locationRegion)}
            />
            {(station.locationCity || station.locationRegion) && (
              <GroupedDetailRow
                label="Area"
                value={[station.locationCity, station.locationRegion].filter(Boolean).join(', ')}
                divider={Boolean(parseLatLng(station.locationLatitude, station.locationLongitude))}
              />
            )}
            {parseLatLng(station.locationLatitude, station.locationLongitude) && (
              <Box sx={{ px: 2, py: 1.5 }}>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<DirectionsIcon />}
                  onClick={handleGetDirections}
                  fullWidth
                  sx={(th) => sxObject(th, compactOutlinedCtaSx)}
                >
                  Directions
                </Button>
              </Box>
            )}
          </GroupedListSection>

          <GroupedListSection title="Connectors">
            <GroupedDetailRow
              label="Available"
              value={`${station.availableConnectors} of ${station.totalConnectors}`}
              divider={Boolean(station.connectors?.length)}
            />
            {station.connectors?.map((conn, idx) => (
              <GroupedDetailRow
                key={conn.id}
                label={`Connector ${conn.connectorId}`}
                value={
                  <Box sx={{ textAlign: 'right' }}>
                    <Chip label={conn.status} size="small" color={getChargePointStatusColor(conn.status)} />
                    {conn.connectorType ? (
                      <Typography variant="caption" display="block" color="text.secondary">
                        {conn.connectorType}
                        {conn.powerRatingKw != null ? ` · ${conn.powerRatingKw} kW` : ''}
                      </Typography>
                    ) : null}
                  </Box>
                }
                divider={idx < (station.connectors?.length ?? 0) - 1}
              />
            ))}
          </GroupedListSection>

          <GroupedListSection title="Tariff">
            <Box sx={{ px: 2, py: 2 }}>
              {priceNum != null ? (
                <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.03em', color: 'primary.main' }}>
                  {formatCurrency(priceNum, station.currency || 'GHS')}
                  <Typography component="span" variant="body1" sx={{ fontWeight: 600, ml: 0.5 }}>
                    /kWh
                  </Typography>
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No per-kWh rate is set for this charge point yet.
                </Typography>
              )}
            </Box>
          </GroupedListSection>

          <Box sx={{ pt: 1 }}>{startChargingButton}</Box>
        </Stack>
      ) : (
        <Stack spacing={2}>
          <Paper elevation={0} sx={premiumPanelCardSx}>
            <SectionLabel>Location</SectionLabel>
            <Typography
              variant="body2"
              sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2, lineHeight: 1.55 }}
            >
              <LocationOnIcon sx={{ fontSize: 20, mt: '2px', color: 'primary.main', flexShrink: 0 }} />
              {station.locationAddress || station.locationName || 'Address not set'}
            </Typography>
            {(station.locationCity || station.locationRegion) && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                {[station.locationCity, station.locationRegion].filter(Boolean).join(', ')}
              </Typography>
            )}
            {parseLatLng(station.locationLatitude, station.locationLongitude) && (
              <Button
                variant="outlined"
                color="primary"
                startIcon={<DirectionsIcon />}
                onClick={handleGetDirections}
                sx={(th) => ({
                  ...sxObject(th, compactOutlinedCtaSx),
                  width: { xs: '100%', sm: 'auto' },
                })}
              >
                Directions
              </Button>
            )}
          </Paper>

          <Paper elevation={0} sx={premiumPanelCardSx}>
            <SectionLabel>Connectors</SectionLabel>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 500 }}>
              {station.availableConnectors} of {station.totalConnectors} available
              {station.activeSessions ? ` · ${station.activeSessions} active session(s)` : ''}
            </Typography>
            <Stack spacing={1}>
              {station.connectors?.map((conn) => (
                <Box
                  key={conn.id}
                  sx={(th) => ({
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 1,
                    flexWrap: 'wrap',
                    py: 1.25,
                    px: 1.5,
                    borderRadius: 2,
                    bgcolor: alpha(th.palette.text.primary, 0.03),
                    border: `1px solid ${alpha(th.palette.divider, 0.9)}`,
                  })}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                    <BoltIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                    <Typography variant="body2" fontWeight={600}>
                      Connector {conn.connectorId}
                    </Typography>
                    {conn.connectorType ? (
                      <Typography variant="caption" color="text.secondary">
                        {conn.connectorType}
                      </Typography>
                    ) : null}
                    {conn.powerRatingKw != null ? (
                      <Typography variant="caption" color="text.secondary">
                        {conn.powerRatingKw} kW
                      </Typography>
                    ) : null}
                  </Box>
                  <Chip label={conn.status} size="small" color={getChargePointStatusColor(conn.status)} sx={{ fontWeight: 600 }} />
                </Box>
              ))}
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={(th) => ({
              ...premiumPanelCardSx,
              background:
                priceNum != null
                  ? `linear-gradient(135deg, ${alpha(th.palette.primary.main, 0.09)} 0%, ${alpha(
                      th.palette.primary.main,
                      0.03,
                    )} 100%)`
                  : undefined,
              borderColor: priceNum != null ? alpha(th.palette.primary.main, 0.2) : undefined,
            })}
          >
            <SectionLabel>Energy tariff</SectionLabel>
            {priceNum != null ? (
              <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.03em', color: 'primary.main' }}>
                {formatCurrency(priceNum, station.currency || 'GHS')}
                <Typography component="span" variant="body1" sx={{ fontWeight: 600, ml: 0.5, opacity: 0.9 }}>
                  /kWh
                </Typography>
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
                No per-kWh rate is set for this charge point yet.
              </Typography>
            )}
          </Paper>

          {startChargingButton}
        </Stack>
      )}

      <StartChargingDialog
        open={startChargingDialogOpen}
        onClose={() => setStartChargingDialogOpen(false)}
        station={station}
        onSuccess={() => {
          setStartChargingDialogOpen(false);
          void loadStation();
        }}
      />
    </Box>
  );
}

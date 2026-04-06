import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Stack,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DirectionsIcon from '@mui/icons-material/Directions';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import BoltIcon from '@mui/icons-material/Bolt';
import { stationsApi, StationDetails } from '../services/stationsApi';
import { StartChargingDialog } from '../components/StartChargingDialog';
import {
  dashboardPageTitleSx,
  dashboardPageSubtitleSx,
  premiumPanelCardSx,
} from '../theme/jampackShell';
import { compactContainedCtaSx, compactOutlinedCtaSx, sxObject } from '../styles/authShell';
import { formatCurrency } from '../utils/formatters';
import { getChargePointStatusColor } from '../utils/statusColors';

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
  const [station, setStation] = useState<StationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startChargingDialogOpen, setStartChargingDialogOpen] = useState(false);

  useEffect(() => {
    if (id) loadStation();
  }, [id]);

  const loadStation = async () => {
    if (!id) return;
    try {
      setError(null);
      const data = await stationsApi.getDetails(id);
      setStation(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load station');
    } finally {
      setLoading(false);
    }
  };

  const handleGetDirections = () => {
    if (station?.locationLatitude && station?.locationLongitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${station.locationLatitude},${station.locationLongitude}`;
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 360 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!station || error) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/stations')}
          variant="outlined"
          color="primary"
          sx={(th) => ({
            ...sxObject(th, compactOutlinedCtaSx),
            mb: 2,
            width: { xs: '100%', sm: 'auto' },
          })}
        >
          Back to stations
        </Button>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error || 'Station not found'}
        </Alert>
      </Box>
    );
  }

  const priceNum =
    station.pricePerKwh != null && !Number.isNaN(Number(station.pricePerKwh))
      ? Number(station.pricePerKwh)
      : null;

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'flex-start' }} sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/stations')}
          variant="outlined"
          color="primary"
          sx={(th) => ({
            ...sxObject(th, compactOutlinedCtaSx),
            width: { xs: '100%', sm: 'auto' },
            flexShrink: 0,
          })}
        >
          Back
        </Button>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="h6" component="h1" sx={dashboardPageTitleSx}>
            {station.locationName || station.chargePointId}
          </Typography>
          <Typography variant="body2" sx={dashboardPageSubtitleSx}>
            Location, connectors, tariff, and start charging.
          </Typography>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 0.75,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              color: 'text.secondary',
              letterSpacing: '0.02em',
            }}
          >
            {station.chargePointId}
          </Typography>
        </Box>
        <Chip
          label={station.status}
          color={getChargePointStatusColor(station.status)}
          sx={{ fontWeight: 700, alignSelf: { xs: 'flex-start', sm: 'center' } }}
        />
      </Stack>

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
          {station.locationLatitude && station.locationLongitude && (
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
                sx={(theme) => ({
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 1,
                  flexWrap: 'wrap',
                  py: 1.25,
                  px: 1.5,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.text.primary, 0.03),
                  border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
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
          sx={(theme) => ({
            ...premiumPanelCardSx,
            background:
              priceNum != null
                ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.09)} 0%, ${alpha(
                    theme.palette.primary.main,
                    0.03,
                  )} 100%)`
                : undefined,
            borderColor: priceNum != null ? alpha(theme.palette.primary.main, 0.2) : undefined,
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
              No per-kWh rate is set for this charge point yet. Operators can set it in admin or vendor device
              settings.
            </Typography>
          )}
        </Paper>

        <Button
          variant="contained"
          color="primary"
          fullWidth
          disableElevation
          startIcon={<PlayArrowIcon />}
          onClick={() => setStartChargingDialogOpen(true)}
          disabled={station.status !== 'Available' || station.availableConnectors === 0}
          sx={compactContainedCtaSx}
        >
          Start charging
        </Button>
      </Stack>

      <StartChargingDialog
        open={startChargingDialogOpen}
        onClose={() => setStartChargingDialogOpen(false)}
        station={station}
        onSuccess={() => {
          setStartChargingDialogOpen(false);
          loadStation();
        }}
      />
    </Box>
  );
}

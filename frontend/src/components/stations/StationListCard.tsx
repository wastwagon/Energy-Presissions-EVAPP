import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Stack,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DirectionsIcon from '@mui/icons-material/Directions';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import EvStationIcon from '@mui/icons-material/EvStation';
import BoltIcon from '@mui/icons-material/Bolt';
import StraightenIcon from '@mui/icons-material/Straighten';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import type { StationWithDistance } from '../../services/stationsApi';
import {
  compactContainedCtaSx,
  compactOutlinedCtaSx,
  premiumIconButtonTouchSx,
  sxObject,
} from '../../styles/authShell';
import { formatCurrency } from '../../utils/formatters';
import { getChargePointStatusColor } from '../../utils/statusColors';
import { parseLatLng } from '../../utils/googleMapsDirections';

export type StationListCardProps = {
  station: StationWithDistance;
  isAuthenticated: boolean;
  isFavorite: boolean;
  onOpenDetails: (station: StationWithDistance) => void;
  onCardKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  onDirections: (e: React.MouseEvent, station: StationWithDistance) => void;
  onStartCharging: (e: React.MouseEvent, station: StationWithDistance) => void;
  onToggleFavorite: (e: React.MouseEvent, chargePointId: string) => void;
};

function parsePrice(value: StationWithDistance['pricePerKwh']): number | null {
  if (value === undefined || value === null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function StationListCard({
  station,
  isAuthenticated,
  isFavorite,
  onOpenDetails,
  onCardKeyDown,
  onDirections,
  onStartCharging,
  onToggleFavorite,
}: StationListCardProps) {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const priceValue = parsePrice(station.pricePerKwh);
  const currency = station.currency || 'GHS';
  const title = station.locationName?.trim() || station.chargePointId;
  const locality =
    [station.locationCity, station.locationRegion].filter(Boolean).join(', ') || null;
  const canNavigate =
    parseLatLng(station.locationLatitude, station.locationLongitude) != null;
  const canStart =
    station.status === 'Available' && station.availableConnectors > 0;

  const metaRows: { label: string; value: string; icon?: React.ReactNode }[] = [
    {
      label: 'Distance',
      value:
        typeof station.distanceKm === 'number' &&
        Number.isFinite(station.distanceKm) &&
        station.distanceKm >= 0
          ? `${station.distanceKm.toFixed(1)} km`
          : '—',
      icon: <StraightenIcon sx={{ fontSize: 16, opacity: 0.75 }} />,
    },
    {
      label: 'Connectors',
      value: `${station.availableConnectors} free · ${station.totalConnectors} total`,
      icon: <BoltIcon sx={{ fontSize: 16, opacity: 0.75 }} />,
    },
  ];

  if (station.totalCapacityKw != null) {
    const kw = Number(station.totalCapacityKw);
    if (Number.isFinite(kw)) {
      metaRows.push({
        label: 'Max power',
        value: `${kw.toFixed(kw >= 10 ? 0 : 1)} kW`,
        icon: <EvStationIcon sx={{ fontSize: 16, opacity: 0.75 }} />,
      });
    }
  }

  return (
    <Box
      onClick={() => onOpenDetails(station)}
      onKeyDown={onCardKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Open details for ${title}`}
      sx={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: { xs: 2.5, sm: 3 },
        overflow: 'hidden',
        cursor: 'pointer',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: alpha(theme.palette.text.primary, 0.08),
        boxShadow: `0 1px 0 ${alpha(theme.palette.text.primary, 0.04)}, 0 12px 32px ${alpha(
          theme.palette.text.primary,
          0.07,
        )}`,
        transition: 'transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease',
        '@media (hover: hover) and (pointer: fine)': {
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: `0 1px 0 ${alpha(theme.palette.text.primary, 0.06)}, 0 20px 44px ${alpha(
              primary,
              0.14,
            )}`,
            borderColor: alpha(primary, 0.35),
          },
        },
      }}
    >
      <Box
        sx={{
          height: 4,
          width: '100%',
          background: `linear-gradient(90deg, ${primary} 0%, ${alpha(primary, 0.45)} 55%, ${alpha(
            primary,
            0.15,
          )} 100%)`,
        }}
      />

      <Box sx={{ p: { xs: 2, sm: 2.25 }, display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              minWidth: 48,
              borderRadius: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(primary, 0.1),
              color: primary,
              border: `1px solid ${alpha(primary, 0.2)}`,
            }}
          >
            <EvStationIcon sx={{ fontSize: 26 }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              component="h2"
              sx={{
                fontWeight: 700,
                letterSpacing: '-0.02em',
                lineHeight: 1.25,
                fontSize: { xs: '1.05rem', sm: '1.08rem' },
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: 'text.secondary',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: '0.7rem',
                mt: 0.25,
                letterSpacing: '0.02em',
              }}
            >
              {station.chargePointId}
            </Typography>
            {station.vendorName ? (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                {station.vendorName}
              </Typography>
            ) : null}
            {station.locationAddress ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 0.75,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 0.5,
                  lineHeight: 1.45,
                  fontSize: '0.8125rem',
                }}
              >
                <LocationOnIcon sx={{ fontSize: 16, mt: '2px', flexShrink: 0, opacity: 0.8 }} />
                <span>{station.locationAddress}</span>
              </Typography>
            ) : null}
            {locality ? (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block' }}>
                {locality}
              </Typography>
            ) : null}
          </Box>

          <Stack direction="row" spacing={0.5} alignItems="flex-start" sx={{ flexShrink: 0 }}>
            {isAuthenticated ? (
              <Tooltip title={isFavorite ? 'Remove from favorites' : 'Save to favorites'}>
                <IconButton
                  size="small"
                  onClick={(e) => onToggleFavorite(e, station.chargePointId)}
                  color={isFavorite ? 'error' : 'default'}
                  aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  sx={{
                    ...sxObject(theme, premiumIconButtonTouchSx),
                    color: isFavorite ? undefined : 'text.secondary',
                  }}
                >
                  {isFavorite ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            ) : null}
            <Chip
              label={station.status}
              color={getChargePointStatusColor(station.status)}
              size="small"
              sx={{ fontWeight: 700, fontSize: '0.7rem', height: 26 }}
            />
          </Stack>
        </Box>

        {station.activeSessions > 0 ? (
          <Box
            sx={{
              py: 0.75,
              px: 1.25,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.info.main, 0.08),
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'info.dark' }}>
              {station.activeSessions} active session{station.activeSessions === 1 ? '' : 's'} at this site
            </Typography>
          </Box>
        ) : null}

        <Stack spacing={1}>
          {metaRows.map((row) => (
            <Box
              key={row.label}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                py: 0.5,
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                '&:last-of-type': { borderBottom: 'none', pb: 0 },
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'flex', alignItems: 'center', gap: 0.75, fontWeight: 500 }}
              >
                {row.icon}
                {row.label}
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 700, color: 'text.primary', textAlign: 'right', fontSize: '0.8125rem' }}
              >
                {row.value}
              </Typography>
            </Box>
          ))}
        </Stack>

        <Box
          sx={{
            mt: 'auto',
            pt: 0.5,
            borderRadius: 2.5,
            px: 1.5,
            py: 1.25,
            background:
              priceValue != null
                ? `linear-gradient(135deg, ${alpha(primary, 0.12)} 0%, ${alpha(primary, 0.04)} 100%)`
                : alpha(theme.palette.text.primary, 0.04),
            border: `1px solid ${
              priceValue != null ? alpha(primary, 0.22) : alpha(theme.palette.text.primary, 0.08)
            }`,
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.04em' }}>
            ENERGY TARIFF
          </Typography>
          <Typography
            variant="h6"
            sx={{
              mt: 0.25,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: priceValue != null ? primary : 'text.secondary',
              fontSize: { xs: '1.125rem', sm: '1.2rem' },
            }}
          >
            {priceValue != null ? (
              <>
                {formatCurrency(priceValue, currency)}
                <Typography component="span" variant="body2" sx={{ fontWeight: 600, ml: 0.5, opacity: 0.85 }}>
                  /kWh
                </Typography>
              </>
            ) : (
              'Set in operator portal'
            )}
          </Typography>
          {priceValue == null ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, lineHeight: 1.4 }}>
              Pricing is configured per charge point in admin or vendor settings.
            </Typography>
          ) : null}
        </Box>

        {station.amenities && station.amenities.length > 0 ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {station.amenities.slice(0, 4).map((amenity, idx) => (
              <Chip
                key={`${amenity}-${idx}`}
                label={amenity}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: alpha(theme.palette.text.primary, 0.12),
                  fontSize: '0.7rem',
                  height: 24,
                }}
              />
            ))}
          </Box>
        ) : null}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.75} sx={{ pt: 0.5 }}>
          <Button
            variant="outlined"
            color="primary"
            fullWidth
            size="medium"
            startIcon={<DirectionsIcon />}
            onClick={(e) => onDirections(e, station)}
            disabled={!canNavigate}
            sx={compactOutlinedCtaSx}
          >
            Directions
          </Button>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            size="medium"
            disableElevation
            startIcon={<PlayArrowIcon />}
            onClick={(e) => onStartCharging(e, station)}
            disabled={!canStart}
            sx={compactContainedCtaSx}
          >
            Start charging
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}

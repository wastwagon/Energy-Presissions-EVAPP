import { IconButton, Stack } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import type { StationWithDistance } from '../../services/stationsApi';
import { GroupedListRow } from '../ios/GroupedListRow';
import { AppBadge, chipColorToBadgeTone } from '../ui/AppBadge';
import { premiumIconButtonTouchSx, sxObject } from '../../styles/authShell';
import { getChargePointStatusColor } from '../../utils/statusColors';

export type StationSheetListItemProps = {
  station: StationWithDistance;
  isAuthenticated: boolean;
  isFavorite: boolean;
  divider?: boolean;
  onOpen: (station: StationWithDistance) => void;
  onToggleFavorite: (e: React.MouseEvent, chargePointId: string) => void;
};

function formatDistanceKm(km: number | undefined): string {
  if (typeof km !== 'number' || !Number.isFinite(km) || km <= 0.0001) return '—';
  return `${km.toFixed(1)} km`;
}

export function StationSheetListItem({
  station,
  isAuthenticated,
  isFavorite,
  divider = false,
  onOpen,
  onToggleFavorite,
}: StationSheetListItemProps) {
  const title = station.locationName?.trim() || station.chargePointId;
  const ac = station.availableConnectors ?? 0;
  const tc = station.totalConnectors ?? 0;
  const locality = [station.locationCity, station.locationRegion].filter(Boolean).join(', ');
  const secondaryParts = [
    formatDistanceKm(station.distanceKm),
    `${ac}/${tc} free`,
    locality || null,
  ].filter(Boolean);

  return (
    <GroupedListRow
      primary={title}
      secondary={secondaryParts.join(' · ')}
      divider={divider}
      onClick={() => onOpen(station)}
      aria-label={`Open ${title}`}
      end={
        <Stack direction="row" alignItems="center" spacing={0.5} onClick={(e) => e.stopPropagation()}>
          <AppBadge
            label={station.status}
            tone={chipColorToBadgeTone(getChargePointStatusColor(station.status))}
            size="small"
            sx={{ fontWeight: 700, fontSize: '0.65rem' }}
          />
          {isAuthenticated ? (
            <IconButton
              size="small"
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              onClick={(e) => onToggleFavorite(e, station.chargePointId)}
              sx={(th) => ({
                ...sxObject(th, premiumIconButtonTouchSx),
                color: isFavorite ? 'error.main' : 'text.secondary',
              })}
            >
              {isFavorite ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
            </IconButton>
          ) : null}
        </Stack>
      }
      showChevron={false}
    />
  );
}

import {
  Box,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import DirectionsIcon from '@mui/icons-material/Directions';
import type { StationWithDistance } from '../../services/stationsApi';
import type { Transaction } from '../../services/transactionsApi';
import { AdaptiveSheet } from '../ios/AdaptiveSheet';
import { GroupedListSection } from '../ios/GroupedListSection';
import { GroupedDetailRow } from '../ios/GroupedDetailRow';
import { GroupedListRow } from '../ios/GroupedListRow';
import { compactOutlinedCtaSx, sxObject } from '../../styles/authShell';
import { formatCurrency } from '../../utils/formatters';
import { getChargePointStatusColor } from '../../utils/statusColors';
import { triggerHaptic } from '../../utils/haptics';
import { StationChargingButton } from './StationChargingButton';

export type StationDetailsSheetProps = {
  open: boolean;
  onClose: () => void;
  station: StationWithDistance | null;
  isAuthenticated: boolean;
  onDirections: (e: React.MouseEvent, station: StationWithDistance) => void;
  onStartCharging: (e: React.MouseEvent, station: StationWithDistance) => void;
  onLoginPrompt: (station: StationWithDistance) => void;
  onViewFullDetails?: (station: StationWithDistance) => void;
  activeSession?: Transaction | null;
  onChargingStopped?: () => void;
};

export function StationDetailsSheet({
  open,
  onClose,
  station,
  isAuthenticated,
  onDirections,
  onStartCharging,
  onLoginPrompt,
  onViewFullDetails,
  activeSession = null,
  onChargingStopped,
}: StationDetailsSheetProps) {
  const theme = useTheme();
  const useGrouped = useMediaQuery(theme.breakpoints.down('md'));

  if (!station) return null;

  const title = station.locationName || station.chargePointId;
  const statusChip = (
    <Chip label={station.status} color={getChargePointStatusColor(station.status)} size="small" />
  );

  const header = (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, minWidth: 0 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.25, minWidth: 0 }}>
        {title}
      </Typography>
      {statusChip}
    </Box>
  );

  const detailRows = (
    <>
      {station.locationAddress && (
        <GroupedDetailRow label="Address" value={station.locationAddress} divider />
      )}
      {station.locationCity && station.locationRegion && (
        <GroupedDetailRow
          label="Location"
          value={`${station.locationCity}, ${station.locationRegion}`}
          divider
        />
      )}
      <GroupedDetailRow label="Distance" value={`${station.distanceKm.toFixed(1)} km away`} divider />
      <GroupedDetailRow
        label="Connectors"
        value={`${station.availableConnectors} available · ${station.totalConnectors} total`}
        divider={Boolean(station.totalCapacityKw || station.pricePerKwh)}
      />
      {station.totalCapacityKw && (
        <GroupedDetailRow label="Capacity" value={`${station.totalCapacityKw} kW`} divider={Boolean(station.pricePerKwh)} />
      )}
      {station.pricePerKwh && (
        <GroupedDetailRow
          label="Price"
          value={formatCurrency(Number(station.pricePerKwh), station.currency || 'GHS') + ' / kWh'}
          divider={Boolean(station.locationLandmarks || (station.amenities && station.amenities.length > 0))}
        />
      )}
      {station.locationLandmarks && (
        <GroupedDetailRow label="Landmarks" value={station.locationLandmarks} divider={Boolean(station.amenities?.length)} />
      )}
      {station.amenities && station.amenities.length > 0 && (
        <GroupedDetailRow label="Amenities" value={station.amenities.join(', ')} />
      )}
    </>
  );

  const listBody = (
    <List dense disablePadding sx={{ py: 0 }}>
      {station.locationAddress && (
        <ListItem>
          <ListItemText primary="Address" secondary={station.locationAddress} />
        </ListItem>
      )}
      {station.locationCity && station.locationRegion && (
        <ListItem>
          <ListItemText primary="Location" secondary={`${station.locationCity}, ${station.locationRegion}`} />
        </ListItem>
      )}
      <ListItem>
        <ListItemText primary="Distance" secondary={`${station.distanceKm.toFixed(1)} km away`} />
      </ListItem>
      <ListItem>
        <ListItemText
          primary="Connectors"
          secondary={`${station.availableConnectors} available out of ${station.totalConnectors} total`}
        />
      </ListItem>
      {station.totalCapacityKw && (
        <ListItem>
          <ListItemText primary="Capacity" secondary={`${station.totalCapacityKw} kW`} />
        </ListItem>
      )}
      {station.pricePerKwh && (
        <ListItem>
          <ListItemText
            primary="Price"
            secondary={formatCurrency(Number(station.pricePerKwh), station.currency || 'GHS') + ' per kWh'}
          />
        </ListItem>
      )}
      {station.locationLandmarks && (
        <ListItem>
          <ListItemText primary="Nearby landmarks" secondary={station.locationLandmarks} />
        </ListItem>
      )}
      {station.amenities && station.amenities.length > 0 && (
        <ListItem>
          <ListItemText primary="Amenities" secondary={station.amenities.join(', ')} />
        </ListItem>
      )}
    </List>
  );

  return (
    <AdaptiveSheet
      open={open}
      onClose={onClose}
      title={title}
      header={header}
      tall
      maxWidth="sm"
      actions={
        <>
          <Button onClick={onClose} sx={(th) => sxObject(th, compactOutlinedCtaSx)}>
            Close
          </Button>
          {station.locationLatitude && station.locationLongitude && (
            <Button
              variant="outlined"
              startIcon={<DirectionsIcon />}
              onClick={(e) => {
                triggerHaptic('light');
                onDirections(e, station);
              }}
              sx={(th) => sxObject(th, compactOutlinedCtaSx)}
            >
              Directions
            </Button>
          )}
          <StationChargingButton
            station={station}
            isAuthenticated={isAuthenticated}
            activeSession={activeSession}
            onStart={(e) => onStartCharging(e, station)}
            onLoginPrompt={() => onLoginPrompt(station)}
            onStopped={onChargingStopped}
            fullWidth={false}
          />
        </>
      }
    >
      {useGrouped ? (
        <>
          <GroupedListSection>{detailRows}</GroupedListSection>
          {onViewFullDetails ? (
            <GroupedListSection>
              <GroupedListRow
                primary="Full station details"
                secondary="Connectors, tariff, and start charging"
                onClick={() => {
                  triggerHaptic('light');
                  onViewFullDetails(station);
                }}
              />
            </GroupedListSection>
          ) : null}
        </>
      ) : (
        listBody
      )}
    </AdaptiveSheet>
  );
}

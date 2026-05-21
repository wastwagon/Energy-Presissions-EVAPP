import { ReactNode } from 'react';
import { Box, Typography, Chip, Button, Divider, ListItem, CircularProgress, Tooltip } from '@mui/material';
import StopIcon from '@mui/icons-material/Stop';
import VisibilityIcon from '@mui/icons-material/Visibility';
import type { Transaction } from '../../services/transactionsApi';
import { formatElapsedDurationFromStart } from '../../utils/formatters';
import {
  activeSessionHasWalletHold,
  formatActiveSessionCost,
  formatActiveSessionEnergy,
  formatActiveSessionPurchased,
} from '../../utils/activeSessionMetrics';
import { getTransactionStatusColor } from '../../utils/statusColors';
import { iosGroupedRowDividerSx } from '../../theme/iosGroupedList';
import { compactContainedCtaSx, compactErrorContainedCtaSx, compactOutlinedCtaSx, sxObject } from '../../styles/authShell';

interface ActiveSessionListItemProps {
  transaction: Transaction;
  divider?: boolean;
  stopping: boolean;
  onView: () => void;
  onStop: () => void;
  viewLabel: string;
  stopDisabled: boolean;
  stopTooltip: string;
}

export function ActiveSessionListItem({
  transaction: tx,
  divider,
  stopping,
  onView,
  onStop,
  viewLabel,
  stopDisabled,
  stopTooltip,
}: ActiveSessionListItemProps) {
  return (
    <>
      <ListItem
        sx={{
          display: 'block',
          py: 1.75,
          px: 2,
        }}
        disablePadding
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 1.25 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
              {tx.chargePointId}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
              Connector {tx.connectorId}
              {tx.recordPending ? ' · syncing' : ''}
            </Typography>
          </Box>
          <Chip
            label={tx.recordPending ? 'Syncing' : tx.status}
            color={getTransactionStatusColor(tx.status)}
            size="small"
            sx={{ flexShrink: 0, height: 24 }}
          />
        </Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 1.25,
            mb: 1.5,
          }}
        >
          <Stat label="Duration" value={formatElapsedDurationFromStart(tx.startTime)} />
          <Stat label="Started" value={new Date(tx.startTime).toLocaleTimeString()} />
          <Stat label="Energy" value={formatActiveSessionEnergy(tx)} />
          <Stat label="Cost" value={formatActiveSessionCost(tx)} />
          {activeSessionHasWalletHold(tx) ? (
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Stat label="Purchased (max)" value={formatActiveSessionPurchased(tx)} />
            </Box>
          ) : null}
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button
            variant="outlined"
            disableElevation
            startIcon={<VisibilityIcon />}
            onClick={onView}
            sx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), width: '100%' })}
          >
            {viewLabel}
          </Button>
          <Tooltip title={stopTooltip}>
            <Box component="span" sx={{ width: '100%' }}>
              <Button
                variant="contained"
                disableElevation
                startIcon={stopping ? <CircularProgress size={16} color="inherit" /> : <StopIcon />}
                onClick={onStop}
                disabled={stopDisabled || stopping}
                sx={(th) => ({ ...sxObject(th, compactErrorContainedCtaSx), width: '100%' })}
              >
                {stopping ? 'Stopping…' : 'Stop charging'}
              </Button>
            </Box>
          </Tooltip>
        </Box>
      </ListItem>
      {divider ? <Divider sx={iosGroupedRowDividerSx} /> : null}
    </>
  );
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.6875rem' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.25 }}>
        {value}
      </Typography>
    </Box>
  );
}

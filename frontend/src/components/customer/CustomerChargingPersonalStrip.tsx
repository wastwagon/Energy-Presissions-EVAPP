import { Box, Paper, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { premiumPanelCardSx } from '../../theme/jampackShell';
import { formatCurrency } from '../../utils/formatters';
import { CUSTOMER_ROUTES } from '../../config/customerNav.paths';
import { AppBadge } from '../ui/AppBadge';

type CustomerChargingPersonalStripProps = {
  availableBalance: number | null;
  currency?: string;
  activeCount: number;
  lastEnergyLabel?: string | null;
};

/**
 * Compact personal metrics under the Charge title — balance, live sessions, last charge.
 */
export function CustomerChargingPersonalStrip({
  availableBalance,
  currency = 'GHS',
  activeCount,
  lastEnergyLabel,
}: CustomerChargingPersonalStripProps) {
  const navigate = useNavigate();

  return (
    <Paper
      elevation={0}
      sx={(th) => ({
        ...premiumPanelCardSx,
        mb: 2,
        p: { xs: 1.75, sm: 2 },
        borderColor: alpha(th.palette.primary.main, 0.14),
        background: `linear-gradient(165deg, ${alpha(th.palette.primary.main, 0.06)} 0%, ${th.palette.background.paper} 70%)`,
      })}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 1,
          mb: 1.5,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
            Snapshot
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Balance, live sessions, last charge
          </Typography>
        </Box>
        {activeCount > 0 ? <AppBadge label={`${activeCount} live`} tone="info" /> : null}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' },
          gap: { xs: 1.25, sm: 1.5 },
        }}
      >
        <Box
          component="button"
          type="button"
          onClick={() => navigate(CUSTOMER_ROUTES.wallet)}
          aria-label="Open wallet"
          sx={{
            all: 'unset',
            cursor: 'pointer',
            minWidth: 0,
            borderRadius: 1,
            '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: 'block' }}>
            Balance
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 700, letterSpacing: '-0.02em', mt: 0.25 }}>
            {availableBalance == null ? '—' : formatCurrency(availableBalance, currency)}
          </Typography>
        </Box>

        <Box
          component="button"
          type="button"
          onClick={() => navigate(CUSTOMER_ROUTES.sessionsActive)}
          aria-label="Open live charging"
          sx={{
            all: 'unset',
            cursor: 'pointer',
            minWidth: 0,
            borderRadius: 1,
            '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: 'block' }}>
            Live
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 700, letterSpacing: '-0.02em', mt: 0.25 }}>
            {activeCount}
          </Typography>
        </Box>

        <Box
          component="button"
          type="button"
          onClick={() => navigate(CUSTOMER_ROUTES.sessionsHistory)}
          aria-label="Open charge history"
          sx={{
            all: 'unset',
            cursor: 'pointer',
            minWidth: 0,
            borderRadius: 1,
            gridColumn: { xs: '1 / -1', sm: 'auto' },
            '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: 'block' }}>
            Last charge
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 700, letterSpacing: '-0.02em', mt: 0.25 }}>
            {lastEnergyLabel || '—'}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

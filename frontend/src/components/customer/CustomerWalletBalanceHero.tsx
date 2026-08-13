import { Box, Button, Paper, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import { premiumPanelCardSx } from '../../theme/jampackShell';
import { compactContainedCtaSx, sxObject } from '../../styles/authShell';
import { formatCurrency } from '../../utils/formatters';
import { MiniSparkline } from '../dashboard/MiniSparkline';
import { CUSTOMER_IMAGES } from '../../config/customerImagery';
import { triggerHaptic } from '../../utils/haptics';

export type CustomerWalletFunds = {
  available: number;
  reserved: number;
  total: number;
  currency: string;
};

type CustomerWalletBalanceHeroProps = {
  funds: CustomerWalletFunds;
  activityValues: number[];
  periodSpend: number;
  periodDays?: number;
  onTopUp: () => void;
};

/**
 * Balance-first wallet hero (Untitled UI light “Your balance” pattern).
 * Large available amount first; reserved secondary; optional activity sparkline; full-width top-up CTA.
 */
export function CustomerWalletBalanceHero({
  funds,
  activityValues,
  periodSpend,
  periodDays = 14,
  onTopUp,
}: CustomerWalletBalanceHeroProps) {
  const hasActivity = activityValues.some((v) => v > 0);

  return (
    <Paper
      elevation={0}
      sx={(th) => ({
        ...premiumPanelCardSx,
        mb: 2.5,
        overflow: 'hidden',
        position: 'relative',
        p: { xs: 2, sm: 2.5 },
        background: `linear-gradient(165deg, ${alpha(th.palette.primary.main, 0.1)} 0%, ${th.palette.background.paper} 55%)`,
        borderColor: alpha(th.palette.primary.main, 0.16),
      })}
    >
      <Box
        component="img"
        src={CUSTOMER_IMAGES.walletEnergy}
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        sx={{
          position: 'absolute',
          right: { xs: -24, sm: 0 },
          top: { xs: -8, sm: 0 },
          width: { xs: 140, sm: 180 },
          height: { xs: 100, sm: 120 },
          objectFit: 'cover',
          opacity: 0.22,
          pointerEvents: 'none',
          maskImage: 'linear-gradient(to left, black 20%, transparent 95%)',
          WebkitMaskImage: 'linear-gradient(to left, black 20%, transparent 95%)',
        }}
      />

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ fontWeight: 500, letterSpacing: '-0.01em', position: 'relative' }}
      >
        Your balance
      </Typography>

      <Typography
        variant="h3"
        sx={{
          fontWeight: 700,
          color: 'text.primary',
          fontSize: { xs: '2rem', sm: '2.5rem' },
          letterSpacing: '-0.03em',
          lineHeight: 1.15,
          mt: 0.5,
          mb: 1,
          wordBreak: 'break-word',
          position: 'relative',
        }}
      >
        {formatCurrency(funds.available, funds.currency)}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ position: 'relative', mb: hasActivity ? 1.5 : 2 }}>
        {funds.reserved > 0 ? (
          <>
            <Box component="span" sx={{ color: 'warning.dark', fontWeight: 600 }}>
              {formatCurrency(funds.reserved, funds.currency)} on hold
            </Box>
            {' · '}
          </>
        ) : null}
        Wallet total {formatCurrency(funds.total, funds.currency)}
      </Typography>

      {hasActivity ? (
        <Box sx={{ position: 'relative', mb: 2 }}>
          <Box sx={{ width: '100%', height: { xs: 56, sm: 64 }, mb: 0.75 }}>
            <MiniSparkline
              values={activityValues}
              label={`Wallet activity last ${periodDays} days`}
              width={320}
              height={64}
              fillParent
            />
          </Box>
          <Typography variant="caption" color="text.secondary">
            {periodSpend > 0
              ? `${formatCurrency(periodSpend, funds.currency)} spent in the last ${periodDays} days`
              : `Activity in the last ${periodDays} days`}
          </Typography>
        </Box>
      ) : null}

      <Button
        variant="contained"
        disableElevation
        fullWidth
        startIcon={<AddIcon />}
        onClick={() => {
          triggerHaptic('light');
          onTopUp();
        }}
        sx={(th) => ({
          ...sxObject(th, compactContainedCtaSx),
          position: 'relative',
          minHeight: 48,
          width: '100%',
        })}
      >
        Top up wallet
      </Button>
    </Paper>
  );
}

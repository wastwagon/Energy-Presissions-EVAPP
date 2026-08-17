import { Box, Button, Paper, Skeleton, Stack, Typography } from '@mui/material';
import AccountBalanceWalletOutlined from '@mui/icons-material/AccountBalanceWalletOutlined';
import { Link as RouterLink } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';
import { iosGroupedPaperSx } from '../../theme/iosGroupedList';
import { staffNumericSx } from '../../theme/staffChrome';
import type { VendorPayoutSummary } from '../../services/vendorApi';

function formatPayoutDate(iso: string | null): string {
  if (!iso) return 'Not scheduled';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return iso;
  }
}

type VendorPayoutSummaryCardProps = {
  summary: VendorPayoutSummary | null;
  loading?: boolean;
  /** Hide the MoMo/bank CTA when the card is already on Settings. */
  hideMethodCta?: boolean;
};

/**
 * Next payout for this vendor: matured (past hold) sales minus payouts already recorded.
 * Independent of the dashboard sales period filter (7 / 30 / 90 days).
 */
export function VendorPayoutSummaryCard({ summary, loading, hideMethodCta }: VendorPayoutSummaryCardProps) {
  if (loading && !summary) {
    return <Skeleton variant="rounded" height={220} sx={{ borderRadius: '12px' }} />;
  }
  if (!summary) return null;

  const methodReady = summary.payoutMethodReady;
  const nextDate = formatPayoutDate(summary.nextPayoutAt);
  const holdDays = summary.payoutHoldDays;

  return (
    <Paper
      elevation={0}
      sx={{
        ...iosGroupedPaperSx,
        p: { xs: 2, sm: 2.5 },
      }}
    >
      <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: '0.06em', fontWeight: 700 }}>
        Next payout
      </Typography>
      <Typography
        variant="h4"
        sx={{
          ...staffNumericSx,
          fontWeight: 700,
          letterSpacing: '-0.04em',
          lineHeight: 1.15,
          fontSize: { xs: '2rem', sm: '2.25rem' },
          mt: 0.5,
        }}
      >
        {formatCurrency(summary.eligible, summary.currency)}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.45 }}>
        Matured amount ready for {summary.payoutCycleLabel.toLowerCase()} payout on {nextDate}.
      </Typography>

      <Stack spacing={1} sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Payout cycle
          </Typography>
          <Typography variant="body2" fontWeight={600} textAlign="right">
            {summary.payoutCycleLabel}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Next payout date
          </Typography>
          <Typography variant="body2" fontWeight={600} textAlign="right">
            {nextDate}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Matured (all time)
          </Typography>
          <Typography variant="body2" fontWeight={600} textAlign="right" sx={staffNumericSx}>
            {formatCurrency(summary.matured ?? summary.eligible, summary.currency)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Still maturing
          </Typography>
          <Typography variant="body2" fontWeight={600} textAlign="right" sx={staffNumericSx}>
            {formatCurrency(summary.inHold, summary.currency)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Paid to date
          </Typography>
          <Typography variant="body2" fontWeight={600} textAlign="right" sx={staffNumericSx}>
            {formatCurrency(summary.paidToDate, summary.currency)}
          </Typography>
        </Box>
        {methodReady && summary.payoutDestinationLabel ? (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Pays to
            </Typography>
            <Typography variant="body2" fontWeight={600} textAlign="right">
              {summary.payoutDestinationLabel}
            </Typography>
          </Box>
        ) : null}
      </Stack>

      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.75, lineHeight: 1.45 }}>
        {holdDays === 0
          ? 'Completed sales are included in your next payout as soon as they finish.'
          : `Sales mature ${holdDays} day${holdDays === 1 ? '' : 's'} after the session ends. Until then they stay in still maturing and are not in this payout.`}
      </Typography>

      {!methodReady && !hideMethodCta ? (
        <Button
          component={RouterLink}
          to="/vendor/settings"
          variant="contained"
          startIcon={<AccountBalanceWalletOutlined />}
          sx={{ mt: 2, minHeight: 44, width: { xs: '100%', sm: 'auto' } }}
        >
          Add MoMo or bank
        </Button>
      ) : null}
    </Paper>
  );
}

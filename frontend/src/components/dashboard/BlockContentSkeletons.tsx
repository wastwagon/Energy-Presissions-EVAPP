import { Box, Grid, Paper, Skeleton } from '@mui/material';
import { premiumPanelCardSx } from '../../theme/jampackShell';

/** Modal / dialog: toolbar row + stacked list lines (history, logs, etc.). */
export function DialogDenseRowsSkeleton({
  rows = 6,
  ariaLabel = 'Loading',
  showToolbar = true,
}: {
  rows?: number;
  ariaLabel?: string;
  showToolbar?: boolean;
}) {
  return (
    <Box
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={ariaLabel}
      sx={{ py: 2, width: '100%', minWidth: 0 }}
    >
      {showToolbar ? <Skeleton variant="rounded" height={40} sx={{ mb: 1.5 }} /> : null}
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} variant="rounded" height={36} sx={{ mb: i === rows - 1 ? 0 : 1 }} />
      ))}
    </Box>
  );
}

/** Transaction summary dialog body while `getById` is in flight. */
export function TransactionSummaryBodySkeleton() {
  return (
    <Box role="status" aria-busy="true" aria-label="Loading session details" sx={{ pt: 0.5 }}>
      <Skeleton variant="rounded" height={96} sx={{ mb: 2, borderRadius: 2 }} />
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Skeleton variant="rounded" height={80} sx={{ borderRadius: 2 }} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Skeleton variant="rounded" height={80} sx={{ borderRadius: 2 }} />
        </Grid>
        <Grid item xs={12}>
          <Skeleton variant="rounded" height={132} sx={{ borderRadius: 2 }} />
        </Grid>
      </Grid>
    </Box>
  );
}

/** CMS & branding tab: two panels + save row. */
export function FormBrandingTwoColumnSkeleton({
  ariaLabel = 'Loading branding settings',
}: {
  ariaLabel?: string;
}) {
  return (
    <Box role="status" aria-busy="true" aria-label={ariaLabel} sx={{ py: { xs: 1, sm: 2 }, width: '100%' }}>
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={premiumPanelCardSx}>
            <Skeleton variant="rounded" width="52%" height={28} sx={{ mb: 2 }} />
            <Skeleton variant="rounded" height={56} sx={{ mb: 2 }} />
            <Skeleton variant="rounded" height={88} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={premiumPanelCardSx}>
            <Skeleton variant="rounded" width="42%" height={28} sx={{ mb: 2 }} />
            <Skeleton variant="rounded" height={112} sx={{ mb: 2 }} />
            <Skeleton variant="rounded" height={44} />
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Skeleton variant="rounded" width={200} height={44} />
        </Grid>
      </Grid>
    </Box>
  );
}

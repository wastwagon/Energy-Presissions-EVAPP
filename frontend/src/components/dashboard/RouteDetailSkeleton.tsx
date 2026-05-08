import { Box, Paper, Skeleton } from '@mui/material';
import { premiumPanelCardSx } from '../../theme/jampackShell';

/** Ops pages using `LivePageHeader` + `OpsQuickActions` + stacked sections (sessions detail, charge point). */
export function OpsLiveDetailSkeleton({ ariaLabel }: { ariaLabel: string }) {
  return (
    <Box
      sx={{ minWidth: 0, maxWidth: '100%' }}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={ariaLabel}
    >
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 2,
        }}
      >
        <Box sx={{ flex: '1 1 220px', minWidth: 0 }}>
          <Skeleton variant="rounded" height={32} sx={{ maxWidth: 320, mb: 1 }} />
          <Skeleton variant="rounded" height={22} sx={{ maxWidth: 460 }} />
          <Skeleton variant="rounded" height={17} sx={{ width: 160, mt: 1 }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'stretch', sm: 'flex-end' } }}>
          <Skeleton variant="rounded" width={112} height={44} sx={{ flex: { xs: '1 1 100%', sm: 'none' } }} />
          <Skeleton variant="rounded" width={100} height={36} sx={{ alignSelf: 'center', display: { xs: 'none', sm: 'block' } }} />
          <Skeleton variant="rounded" width={120} height={44} />
        </Box>
      </Box>
      <Skeleton variant="rounded" height={108} sx={{ mb: 2, borderRadius: 2 }} />
      {[0, 1, 2].map((i) => (
        <Paper key={i} elevation={0} sx={{ ...premiumPanelCardSx, mb: 2 }}>
          <Skeleton variant="rounded" height={26} sx={{ width: '40%', mb: 2 }} />
          <Skeleton variant="rounded" height={120} sx={{ borderRadius: 1 }} />
        </Paper>
      ))}
    </Box>
  );
}

import { Box, Grid, Skeleton } from '@mui/material';
import { premiumPanelCardSx } from '../../theme/jampackShell';

type Variant = 'admin' | 'superadmin';

/** Initial load placeholder — matches KPI + chart + table density */
export function DashboardStaffHomeSkeleton({ variant }: { variant: Variant }) {
  const count = variant === 'admin' ? 4 : 5;
  return (
    <Box
      sx={{ minWidth: 0, maxWidth: '100%' }}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      <Box sx={{ mb: 3 }}>
        <Skeleton variant="rounded" height={36} sx={{ maxWidth: 280, mb: 1 }} />
        <Skeleton variant="rounded" height={22} sx={{ maxWidth: 420 }} />
        <Skeleton variant="rounded" height={36} sx={{ width: 180, mt: 1.5 }} />
      </Box>
      <Grid container spacing={{ xs: 2, sm: 2.5 }} sx={{ mb: 2.5 }}>
        {Array.from({ length: count }, (_, i) => (
          <Grid
            item
            key={i}
            xs={12}
            sm={variant === 'admin' ? 6 : 6}
            md={variant === 'superadmin' ? 3 : 4}
          >
            <Skeleton
              variant="rounded"
              animation="wave"
              height={112}
              sx={{ ...premiumPanelCardSx }}
            />
          </Grid>
        ))}
      </Grid>
      <Skeleton variant="rounded" animation="wave" height={280} sx={{ ...premiumPanelCardSx, mb: 2.5 }} />
      <Skeleton variant="rounded" animation="wave" height={220} sx={{ ...premiumPanelCardSx }} />
    </Box>
  );
}

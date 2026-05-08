import { Box, Grid, Skeleton } from '@mui/material';
import { jampackKpiCardBaseSx } from '../../theme/jampackShell';

type Variant = 'admin' | 'superadmin';

/** Initial load placeholder — matches KPI grid density for reduced layout shift */
export function DashboardStaffHomeSkeleton({ variant }: { variant: Variant }) {
  const count = variant === 'admin' ? 3 : 4;
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
        <Skeleton variant="rounded" height={18} sx={{ width: 160, mt: 1.5 }} />
      </Box>
      <Skeleton variant="rounded" height={112} sx={{ mb: 2, borderRadius: 2 }} />
      <Grid container spacing={{ xs: 2, sm: 2.5 }}>
        {Array.from({ length: count }, (_, i) => (
          <Grid
            item
            key={i}
            xs={12}
            sm={variant === 'admin' ? 4 : 6}
            {...(variant === 'superadmin' ? { md: 3 } : {})}
          >
            <Skeleton
              variant="rounded"
              animation="wave"
              height={108}
              sx={{ ...jampackKpiCardBaseSx }}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

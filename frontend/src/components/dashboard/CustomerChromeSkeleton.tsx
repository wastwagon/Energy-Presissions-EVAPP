import { Box, Grid, Paper, Skeleton, Stack } from '@mui/material';
import { premiumPanelCardSx, premiumTableSurfaceSx } from '../../theme/jampackShell';
import {
  chargingHeroShellSx,
  chargingLastSessionCardSx,
  chargingNavListPaperSx,
} from '../../theme/chargingPremiumShell';

function StatusWrap({ ariaLabel, children }: { ariaLabel: string; children: React.ReactNode }) {
  return (
    <Box
      sx={{ minWidth: 0, maxWidth: '100%' }}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={ariaLabel}
    >
      {children}
    </Box>
  );
}

function HeaderBlock({ asideCount }: { asideCount: number }) {
  return (
    <Box
      sx={{
        mb: 2,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'flex-start' },
        justifyContent: 'space-between',
        gap: 2,
      }}
    >
      <Box sx={{ flex: '1 1 220px', minWidth: 0 }}>
        <Skeleton variant="rounded" height={30} sx={{ maxWidth: 260, mb: 1 }} />
        <Skeleton variant="rounded" height={22} sx={{ maxWidth: 400 }} />
        <Skeleton variant="rounded" height={17} sx={{ width: 150, mt: 1.5 }} />
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: { xs: 'stretch', sm: 'flex-end' } }}>
        {Array.from({ length: asideCount }, (_, i) => (
          <Skeleton key={i} variant="rounded" height={44} sx={{ flex: { xs: '1 1 100%', sm: '0 0 auto' }, minWidth: { sm: 120 } }} />
        ))}
      </Box>
    </Box>
  );
}

function QuickBar() {
  return <Skeleton variant="rounded" height={96} sx={{ mb: 2, borderRadius: 2 }} />;
}

function TableBlock({ rows }: { rows: number }) {
  return (
    <Paper elevation={0} sx={premiumTableSurfaceSx}>
      <Skeleton variant="rounded" height={48} sx={{ borderRadius: 0 }} />
      <Box sx={{ p: { xs: 2, sm: 2 } }}>
        {Array.from({ length: rows }, (_, r) => (
          <Skeleton key={r} variant="rounded" height={34} sx={{ mb: r === rows - 1 ? 0 : 1 }} />
        ))}
      </Box>
    </Paper>
  );
}

function FavoriteRowSkeletons({ count }: { count: number }) {
  return (
    <Stack spacing={2}>
      {Array.from({ length: count }, (_, i) => (
        <Paper key={i} elevation={0} sx={premiumPanelCardSx}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Skeleton variant="rounded" width={48} height={48} sx={{ flexShrink: 0 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Skeleton variant="rounded" height={22} sx={{ mb: 1 }} />
              <Skeleton variant="rounded" height={18} sx={{ width: '70%' }} />
            </Box>
            <Skeleton variant="rounded" width={44} height={44} sx={{ flexShrink: 0 }} />
          </Box>
        </Paper>
      ))}
    </Stack>
  );
}

export type CustomerChromePreset =
  | 'sessionHistory'
  | 'paymentHistory'
  | 'activeSessions'
  | 'favorites'
  | 'wallet'
  | 'profile'
  | 'paymentMethods'
  | 'topUp'
  | 'chargingHub';

const labels: Record<CustomerChromePreset, string> = {
  sessionHistory: 'Loading session history',
  paymentHistory: 'Loading payment history',
  activeSessions: 'Loading active sessions',
  favorites: 'Loading favorites',
  wallet: 'Loading wallet',
  profile: 'Loading profile',
  paymentMethods: 'Loading payment methods',
  topUp: 'Loading top up',
  chargingHub: 'Loading charging home',
};

export function CustomerChromeSkeleton({ preset }: { preset: CustomerChromePreset }) {
  switch (preset) {
    case 'chargingHub': {
      const sk = { bgcolor: 'rgba(255, 255, 255, 0.11)' };
      return (
        <StatusWrap ariaLabel={labels.chargingHub}>
          <Paper component="div" elevation={0} sx={chargingHeroShellSx}>
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Skeleton variant="rounded" height={34} sx={{ ...sk, maxWidth: 200, mb: 1 }} />
              <Skeleton variant="rounded" height={22} sx={{ ...sk, maxWidth: '92%', mb: 1 }} />
              <Skeleton variant="rounded" height={44} width={132} sx={sk} />
            </Box>
          </Paper>
          <Paper elevation={0} sx={chargingNavListPaperSx}>
            <Stack spacing={0}>
              {Array.from({ length: 5 }, (_, i) => (
                <Box
                  key={i}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    px: 2,
                    py: 1.75,
                    borderBottom:
                      i < 4 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
                  }}
                >
                  <Skeleton variant="rounded" width={40} height={40} sx={sk} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Skeleton variant="rounded" height={20} sx={{ ...sk, mb: 0.75 }} />
                    <Skeleton variant="rounded" height={16} width="72%" sx={sk} />
                  </Box>
                  <Skeleton variant="rounded" width={22} height={22} sx={sk} />
                </Box>
              ))}
            </Stack>
          </Paper>
          <Paper elevation={0} sx={chargingLastSessionCardSx}>
            <Skeleton variant="rounded" width={76} height={14} sx={{ ...sk, mb: 1.5 }} />
            <Skeleton variant="rounded" height={22} sx={{ ...sk, mb: 1.75, width: '88%', maxWidth: 340 }} />
            <Skeleton variant="rounded" height={36} width="46%" sx={{ ...sk, mb: 2 }} />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Skeleton variant="rounded" height={44} sx={{ ...sk, flex: 1 }} />
              <Skeleton variant="rounded" height={44} sx={{ ...sk, flex: 1 }} />
            </Box>
          </Paper>
        </StatusWrap>
      );
    }
    case 'sessionHistory':
    case 'paymentHistory':
      return (
        <StatusWrap ariaLabel={labels[preset]}>
          <HeaderBlock asideCount={1} />
          <QuickBar />
          <TableBlock rows={8} />
        </StatusWrap>
      );
    case 'activeSessions':
      return (
        <StatusWrap ariaLabel={labels[preset]}>
          <HeaderBlock asideCount={1} />
          <QuickBar />
          <Stack spacing={2}>
            {Array.from({ length: 3 }, (_, i) => (
              <Paper key={i} elevation={0} sx={premiumPanelCardSx}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                  <Skeleton variant="rounded" height={26} sx={{ flex: 1 }} />
                  <Skeleton variant="rounded" width={72} height={32} />
                </Box>
                <Grid container spacing={1.5}>
                  {[0, 1, 2, 3].map((c) => (
                    <Grid item xs={6} sm={3} key={c}>
                      <Skeleton variant="text" height={13} sx={{ mb: 0.5 }} />
                      <Skeleton variant="rounded" height={22} />
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            ))}
          </Stack>
        </StatusWrap>
      );
    case 'favorites':
      return (
        <StatusWrap ariaLabel={labels[preset]}>
          <HeaderBlock asideCount={1} />
          <QuickBar />
          <FavoriteRowSkeletons count={4} />
        </StatusWrap>
      );
    case 'wallet':
      return (
        <StatusWrap ariaLabel={labels[preset]}>
          <HeaderBlock asideCount={1} />
          <Skeleton variant="rounded" height={44} sx={{ mb: 2, maxWidth: { xs: '100%', sm: 240 } }} />
          <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={premiumPanelCardSx}>
                <Skeleton variant="text" width="50%" sx={{ mb: 1 }} />
                <Skeleton variant="rounded" width="66%" height={40} />
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={premiumPanelCardSx}>
                <Skeleton variant="text" width="44%" sx={{ mb: 1 }} />
                <Skeleton variant="rounded" width="55%" height={40} />
              </Paper>
            </Grid>
          </Grid>
          <TableBlock rows={7} />
        </StatusWrap>
      );
    case 'profile':
      return (
        <StatusWrap ariaLabel={labels[preset]}>
          <HeaderBlock asideCount={1} />
          <Paper elevation={0} sx={premiumPanelCardSx}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Skeleton variant="circular" width={72} height={72} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="rounded" height={26} sx={{ mb: 1 }} />
                <Skeleton variant="rounded" height={20} sx={{ maxWidth: 220 }} />
              </Box>
            </Box>
            {[0, 1, 2, 3, 4].map((r) => (
              <Skeleton key={r} variant="rounded" height={56} sx={{ mb: 1.5 }} />
            ))}
          </Paper>
        </StatusWrap>
      );
    case 'paymentMethods':
      return (
        <StatusWrap ariaLabel={labels[preset]}>
          <HeaderBlock asideCount={2} />
          <Stack spacing={2}>
            {Array.from({ length: 4 }, (_, i) => (
              <Paper key={i} elevation={0} sx={premiumPanelCardSx}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                  <Skeleton variant="rounded" height={56} sx={{ flex: 1 }} />
                  <Skeleton variant="rounded" width={120} height={40} />
                </Box>
              </Paper>
            ))}
          </Stack>
        </StatusWrap>
      );
    case 'topUp':
      return (
        <StatusWrap ariaLabel={labels[preset]}>
          <HeaderBlock asideCount={1} />
          <QuickBar />
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            <Grid item xs={12} md={5}>
              <Paper sx={premiumPanelCardSx}>
                <Skeleton variant="text" sx={{ mb: 1 }} />
                <Skeleton variant="rounded" height={56} sx={{ mb: 2 }} />
                <Skeleton variant="rounded" height={140} />
              </Paper>
            </Grid>
            <Grid item xs={12} md={7}>
              <Paper sx={premiumPanelCardSx}>
                {[0, 1, 2].map((r) => (
                  <Skeleton key={r} variant="rounded" height={48} sx={{ mb: 1.5 }} />
                ))}
                <Skeleton variant="rounded" height={52} sx={{ mt: 1 }} />
              </Paper>
            </Grid>
          </Grid>
        </StatusWrap>
      );
  }
}

export function CustomerTransactionDetailSkeleton() {
  return (
    <StatusWrap ariaLabel="Loading transaction details">
      <Skeleton variant="rounded" width={100} height={44} sx={{ mb: 2 }} />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start', mb: 2 }}>
        <Box sx={{ flex: '1 1 220px', minWidth: 0 }}>
          <Skeleton variant="rounded" height={30} sx={{ mb: 1 }} />
          <Skeleton variant="rounded" height={22} sx={{ maxWidth: 300 }} />
          <Skeleton variant="rounded" height={17} sx={{ width: 140, mt: 1 }} />
        </Box>
        <Skeleton variant="rounded" width={120} height={44} />
      </Box>
      <QuickBar />
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={premiumPanelCardSx}>
            {[0, 1, 2, 3, 4, 5].map((r) => (
              <Skeleton key={r} variant="rounded" height={34} sx={{ mb: 1 }} />
            ))}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={premiumPanelCardSx}>
            {[0, 1, 2].map((r) => (
              <Skeleton key={r} variant="rounded" height={80} sx={{ mb: 1.5 }} />
            ))}
          </Paper>
        </Grid>
      </Grid>
    </StatusWrap>
  );
}

/** Station detail hub — back row, title chip row, quick actions, stacked panels. */
export function StationDetailPageSkeleton() {
  return (
    <StatusWrap ariaLabel="Loading station details">
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <Skeleton variant="rounded" width={120} height={44} sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' } }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Skeleton variant="rounded" height={30} sx={{ mb: 1, maxWidth: 320 }} />
          <Skeleton variant="rounded" height={22} sx={{ maxWidth: 400, mb: 1 }} />
          <Skeleton variant="rounded" height={17} sx={{ width: 180 }} />
        </Box>
        <Skeleton variant="rounded" width={88} height={36} />
      </Stack>
      <QuickBar />
      <Stack spacing={2}>
        {Array.from({ length: 4 }, (_, i) => (
          <Paper key={i} elevation={0} sx={premiumPanelCardSx}>
            <Skeleton variant="rounded" height={22} sx={{ width: '32%', mb: 2 }} />
            <Skeleton variant="rounded" height={20} sx={{ mb: 1 }} />
            <Skeleton variant="rounded" height={20} sx={{ width: '88%' }} />
          </Paper>
        ))}
      </Stack>
    </StatusWrap>
  );
}

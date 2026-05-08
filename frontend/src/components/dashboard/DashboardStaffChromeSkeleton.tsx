import { Box, Grid, Paper, Skeleton, Stack } from '@mui/material';
import { premiumPanelCardSx, premiumTableSurfaceSx } from '../../theme/jampackShell';

const statusBoxSx = {
  minWidth: 0,
  maxWidth: '100%',
};

const presets = {
  operations: {
    ariaLabel: 'Loading operations dashboard',
    asideButtons: 1,
    kpiCount: 4,
    tabsInPaper: 0,
    tableRows: 5,
    analyticsWideCard: false,
  },
  sessions: {
    ariaLabel: 'Loading sessions',
    asideButtons: 1,
    kpiCount: 0,
    tabsInPaper: 2,
    tableRows: 6,
    analyticsWideCard: false,
  },
  devices: {
    ariaLabel: 'Loading devices',
    asideButtons: 2,
    kpiCount: 0,
    tabsInPaper: 0,
    tableRows: 8,
    analyticsWideCard: false,
  },
  adminReports: {
    ariaLabel: 'Loading reports',
    asideButtons: 2,
    kpiCount: 4,
    tabsInPaper: 4,
    tableRows: 5,
    analyticsWideCard: false,
  },
  superReports: {
    ariaLabel: 'Loading reports',
    asideButtons: 2,
    kpiCount: 4,
    tabsInPaper: 4,
    tableRows: 5,
    analyticsWideCard: false,
  },
  analytics: {
    ariaLabel: 'Loading analytics',
    asideButtons: 1,
    kpiCount: 0,
    tabsInPaper: 0,
    tableRows: 0,
    analyticsWideCard: true,
  },
  tariffs: {
    ariaLabel: 'Loading tariffs',
    asideButtons: 1,
    kpiCount: 0,
    tabsInPaper: 3,
    tableRows: 8,
    analyticsWideCard: false,
  },
  userManagement: {
    ariaLabel: 'Loading users',
    asideButtons: 2,
    kpiCount: 0,
    tabsInPaper: 0,
    tableRows: 10,
    analyticsWideCard: false,
  },
  vendorManagement: {
    ariaLabel: 'Loading vendors',
    asideButtons: 2,
    kpiCount: 0,
    tabsInPaper: 0,
    tableRows: 10,
    analyticsWideCard: false,
  },
  walletManagement: {
    ariaLabel: 'Loading wallet management',
    asideButtons: 2,
    kpiCount: 0,
    tabsInPaper: 0,
    tableRows: 0,
    analyticsWideCard: false,
    walletSplit: true,
  },
  adminPayments: {
    ariaLabel: 'Loading payments',
    asideButtons: 1,
    kpiCount: 2,
    tabsInPaper: 0,
    tableRows: 10,
    analyticsWideCard: false,
  },
  systemHealth: {
    ariaLabel: 'Loading system health',
    asideButtons: 1,
    kpiCount: 3,
    tabsInPaper: 0,
    tableRows: 4,
    analyticsWideCard: false,
  },
  connectionLogs: {
    ariaLabel: 'Loading connection logs',
    asideButtons: 1,
    kpiCount: 4,
    tabsInPaper: 0,
    tableRows: 8,
    analyticsWideCard: false,
  },
  auditLogs: {
    ariaLabel: 'Loading security logs',
    asideButtons: 1,
    kpiCount: 0,
    tabsInPaper: 0,
    tableRows: 12,
    analyticsWideCard: false,
  },
  reservationsList: {
    ariaLabel: 'Loading reservations',
    asideButtons: 1,
    kpiCount: 0,
    tabsInPaper: 0,
    tableRows: 10,
    analyticsWideCard: false,
  },
  billingTabs: {
    ariaLabel: 'Loading billing',
    asideButtons: 1,
    kpiCount: 0,
    tabsInPaper: 2,
    tableRows: 8,
    analyticsWideCard: false,
  },
  vendorSettings: {
    ariaLabel: 'Loading vendor settings',
    asideButtons: 1,
    kpiCount: 0,
    tabsInPaper: 0,
    tableRows: 0,
    analyticsWideCard: false,
    settingsStack: true,
  },
} as const;

export type StaffChromeSkeletonPreset = keyof typeof presets;

type InnerProps = (typeof presets)[StaffChromeSkeletonPreset] & {
  walletSplit?: boolean;
  settingsStack?: boolean;
};

function SkeletonHeaderRow({ asideButtons }: { asideButtons: number }) {
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
        <Skeleton variant="rounded" height={32} sx={{ maxWidth: 280, mb: 1 }} />
        <Skeleton variant="rounded" height={22} sx={{ maxWidth: 420 }} />
        <Skeleton variant="rounded" height={18} sx={{ width: 160, mt: 1.5 }} />
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: { xs: 'stretch', sm: 'flex-end' } }}>
        {Array.from({ length: asideButtons }, (_, i) => (
          <Skeleton key={i} variant="rounded" height={44} sx={{ flex: { xs: '1 1 100%', sm: '0 0 auto' }, minWidth: { sm: 120 } }} />
        ))}
      </Box>
    </Box>
  );
}

function SkeletonKpiTiles({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 2 }}>
      {Array.from({ length: count }, (_, i) => (
        <Grid item xs={12} sm={6} md={3} key={i}>
          <Paper elevation={0} sx={premiumPanelCardSx}>
            <Skeleton variant="text" width="45%" height={22} sx={{ mb: 1 }} />
            <Skeleton variant="rounded" width="70%" height={40} />
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}

function SkeletonAnalyticsGrid() {
  return (
    <Grid container spacing={{ xs: 2, sm: 3 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <Grid item xs={12} sm={6} md={3} key={i}>
          <Paper elevation={0} sx={premiumPanelCardSx}>
            <Skeleton variant="text" width="55%" height={22} sx={{ mb: 1 }} />
            <Skeleton variant="rounded" width="65%" height={36} />
          </Paper>
        </Grid>
      ))}
      <Grid item xs={12}>
        <Paper elevation={0} sx={premiumPanelCardSx}>
          <Skeleton variant="text" width="40%" height={28} sx={{ mb: 1.5 }} />
          <Skeleton variant="rounded" height={72} />
        </Paper>
      </Grid>
    </Grid>
  );
}

function SkeletonTablePaper({ tabsInPaper, rows }: { tabsInPaper: number; rows: number }) {
  return (
    <Paper elevation={0} sx={premiumTableSurfaceSx}>
      {tabsInPaper > 0 ? (
        <Box sx={{ display: 'flex', gap: 1.5, px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          {Array.from({ length: tabsInPaper }, (_, i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={40}
              sx={{ flex: tabsInPaper > 3 ? '0 0 auto' : '1 1 0', minWidth: 88 }}
            />
          ))}
        </Box>
      ) : (
        <Skeleton variant="rounded" height={52} sx={{ borderRadius: 0 }} />
      )}
      <Box sx={{ p: { xs: 2, sm: 2 } }}>
        {Array.from({ length: rows }, (_, r) => (
          <Skeleton key={r} variant="rounded" height={36} sx={{ mb: r === rows - 1 ? 0 : 1 }} />
        ))}
      </Box>
    </Paper>
  );
}

function SkeletonSettingsFormStack({ asideButtons }: { asideButtons: number }) {
  return (
    <>
      <SkeletonHeaderRow asideButtons={asideButtons} />
      <Stack spacing={2}>
        {Array.from({ length: 3 }, (_, i) => (
          <Paper key={i} elevation={0} sx={premiumPanelCardSx}>
            <Skeleton variant="rounded" height={24} sx={{ width: '38%', mb: 2 }} />
            <Grid container spacing={2}>
              {Array.from({ length: 4 }, (_, j) => (
                <Grid item xs={12} sm={6} key={j}>
                  <Skeleton variant="rounded" height={56} />
                </Grid>
              ))}
            </Grid>
          </Paper>
        ))}
      </Stack>
    </>
  );
}

function SkeletonWalletManagementSplit({ asideButtons }: { asideButtons: number }) {
  return (
    <>
      <SkeletonHeaderRow asideButtons={asideButtons} />
      <Skeleton variant="rounded" height={52} sx={{ mb: 2, maxWidth: { xs: '100%', md: 400 } }} />
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={premiumTableSurfaceSx}>
            <Skeleton variant="rounded" height={48} sx={{ borderRadius: 0 }} />
            <Box sx={{ p: { xs: 2, sm: 2 } }}>
              {Array.from({ length: 8 }, (_, r) => (
                <Skeleton key={r} variant="rounded" height={36} sx={{ mb: r === 7 ? 0 : 1 }} />
              ))}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={premiumPanelCardSx}>
            <Skeleton variant="rounded" height={26} sx={{ width: '44%', mb: 2 }} />
            <Skeleton variant="rounded" height={100} sx={{ mb: 2 }} />
            <Skeleton variant="rounded" height={200} />
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}

function InnerSkeleton(p: InnerProps) {
  if (p.walletSplit) {
    return <SkeletonWalletManagementSplit asideButtons={p.asideButtons} />;
  }
  if (p.settingsStack) {
    return <SkeletonSettingsFormStack asideButtons={p.asideButtons} />;
  }
  return (
    <>
      <SkeletonHeaderRow asideButtons={p.asideButtons} />
      {p.analyticsWideCard ? (
        <SkeletonAnalyticsGrid />
      ) : (
        <>
          <SkeletonKpiTiles count={p.kpiCount} />
          <SkeletonTablePaper tabsInPaper={p.tabsInPaper} rows={p.tableRows} />
        </>
      )}
    </>
  );
}

/** Tab panel / padded section loader (tabs already visible above). */
export function StaffChromeTabPanelSkeleton({
  rows,
  tabsInPaper = 0,
  ariaLabel = 'Loading',
}: {
  rows: number;
  tabsInPaper?: number;
  ariaLabel?: string;
}) {
  return (
    <Box
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={ariaLabel}
      sx={{ py: { xs: 2, md: 3 }, px: { xs: 1, sm: 2 }, width: '100%', minWidth: 0 }}
    >
      <SkeletonTablePaper tabsInPaper={tabsInPaper} rows={rows} />
    </Box>
  );
}

/** Staff / ops list & report pages — layout-matched placeholders to reduce CLS. */
export function DashboardStaffChromeSkeleton({ preset }: { preset: StaffChromeSkeletonPreset }) {
  const p = presets[preset];
  return (
    <Box
      sx={statusBoxSx}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={p.ariaLabel}
    >
      <InnerSkeleton {...p} />
    </Box>
  );
}

import { Box, Skeleton, Stack, Typography } from '@mui/material';
import { CustomerChromeSkeleton } from '../dashboard/CustomerChromeSkeleton';
import { DashboardStaffChromeSkeleton } from '../dashboard/DashboardStaffChromeSkeleton';

/** Default full-viewport shell while lazy main layout or home loads. */
export function MainShellRouteFallback() {
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        px: { xs: 2, sm: 3 },
        py: { xs: 3, sm: 4 },
        bgcolor: 'background.default',
      }}
      role="status"
      aria-busy="true"
      aria-label="Loading application"
    >
      <Skeleton variant="rounded" height={32} sx={{ width: 'min(72%, 260px)', mb: 2 }} />
      <Skeleton variant="rounded" height={20} sx={{ width: 'min(88%, 380px)', mb: 3 }} />
      <Stack spacing={1.5} sx={{ flex: 1, maxWidth: 520, width: '100%' }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} variant="rounded" height={48} />
        ))}
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 3 }}>
        Loading dashboard…
      </Typography>
    </Box>
  );
}

/** Login / register / forgot-password chunk. */
export function AuthChromeRouteFallback() {
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 4,
        bgcolor: 'background.default',
      }}
      role="status"
      aria-busy="true"
      aria-label="Loading sign in"
    >
      <Skeleton variant="rounded" width={72} height={72} sx={{ borderRadius: 2, mb: 3 }} />
      <Skeleton variant="rounded" width="min(100%, 320px)" height={52} sx={{ mb: 2 }} />
      <Skeleton variant="rounded" width="min(100%, 320px)" height={52} sx={{ mb: 2 }} />
      <Skeleton variant="rounded" width="min(100%, 320px)" height={52} />
    </Box>
  );
}

/** Legal / support static pages. */
export function MarketingDocumentRouteFallback() {
  return (
    <Box
      sx={{ minHeight: '100dvh', p: { xs: 2, sm: 4 }, bgcolor: 'background.default' }}
      role="status"
      aria-busy="true"
      aria-label="Loading document"
    >
      <Skeleton height={40} width="min(80%, 360px)" sx={{ mb: 3 }} />
      <Stack spacing={1.25}>
        {Array.from({ length: 10 }, (_, i) => (
          <Skeleton
            key={i}
            variant="rounded"
            height={14}
            sx={{ width: i % 3 === 0 ? '100%' : i % 3 === 1 ? '92%' : '88%' }}
          />
        ))}
      </Stack>
    </Box>
  );
}

/** Vendor status pages (`/suspended`, `/disabled`). */
export function StatusNoticeRouteFallback() {
  return (
    <Box
      sx={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2, py: 4 }}
      role="status"
      aria-busy="true"
      aria-label="Loading"
    >
      <Stack spacing={2} sx={{ width: '100%', maxWidth: 420 }}>
        <Skeleton variant="rounded" height={36} sx={{ width: '70%' }} />
        <Skeleton variant="rounded" height={72} />
        <Skeleton variant="rounded" height={44} width={160} />
      </Stack>
    </Box>
  );
}

export function GenericInAppRouteFallback() {
  return (
    <Box
      sx={{
        minHeight: 280,
        px: 2,
        py: 3,
        width: '100%',
      }}
      role="status"
      aria-busy="true"
      aria-label="Loading screen"
    >
      <Skeleton variant="rounded" height={28} sx={{ width: 'min(55%, 220px)', mb: 2 }} />
      <Stack spacing={1.25}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rounded" height={44} />
        ))}
      </Stack>
    </Box>
  );
}

/** `/user/**` dashboard layout lazy chunk. */
export function CustomerDashboardSuspenseFallback() {
  return (
    <Box
      sx={{ width: '100%', minHeight: '40dvh', minWidth: 0, px: { xs: 2, sm: 2 } }}
      role="status"
      aria-busy="true"
      aria-label="Loading customer dashboard"
    >
      <CustomerChromeSkeleton preset="chargingHub" />
    </Box>
  );
}

/** `/admin/**`, `/vendor/**`, `/superadmin/**` layout lazy chunks. */
export function StaffDashboardSuspenseFallback() {
  return (
    <Box sx={{ width: '100%', minHeight: 280, minWidth: 0, p: { xs: 2, sm: 2 } }}>
      <DashboardStaffChromeSkeleton preset="operations" />
    </Box>
  );
}

export function resolveFullPageSuspenseFallback(pathname: string) {
  const p = pathname.toLowerCase();
  if (/^\/(?:login|register|forgot-password)(?:\/|$)/.test(p)) {
    return <AuthChromeRouteFallback />;
  }
  if (p.startsWith('/privacy') || p.startsWith('/terms') || p.startsWith('/support')) {
    return <MarketingDocumentRouteFallback />;
  }
  if (p.startsWith('/suspended') || p.startsWith('/disabled')) {
    return <StatusNoticeRouteFallback />;
  }
  return <MainShellRouteFallback />;
}

export function resolveInAppSuspenseFallback(pathname: string) {
  const p = pathname.toLowerCase();
  if (p.startsWith('/user')) {
    return <CustomerDashboardSuspenseFallback />;
  }
  if (p.startsWith('/admin') || p.startsWith('/vendor') || p.startsWith('/superadmin')) {
    return <StaffDashboardSuspenseFallback />;
  }
  return <GenericInAppRouteFallback />;
}

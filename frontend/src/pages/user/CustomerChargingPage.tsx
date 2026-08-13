import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import type { SvgIconComponent } from '@mui/icons-material';
import { Box, Typography, Paper, Button } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BarChartIcon from '@mui/icons-material/BarChart';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import { transactionsApi, type Transaction } from '../../services/transactionsApi';
import { pickLastEndedChargingSession } from '../../utils/chargingSession';
import { getStoredUser } from '../../utils/authSession';
import { CUSTOMER_ROUTES } from '../../config/customerNav.paths';
import {
  formatSessionCost,
  formatSessionEnergy,
  isNoEnergyCompleted,
  sessionStatusLabel,
} from '../../utils/sessionDisplay';
import { mobileMainLayoutBottomMarginSx, premiumPanelCardSx } from '../../theme/jampackShell';
import { compactContainedCtaSx, compactOutlinedCtaSx, sxObject } from '../../styles/authShell';
import { useLiveRefresh } from '../../hooks/useLiveRefresh';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { LIVE_DATA_LABELS } from '../../constants/liveDataLabels';
import { useCustomerPullRefresh } from '../../contexts/CustomerPullRefreshContext';
import { GroupedListSection } from '../../components/ios/GroupedListSection';
import { GroupedListRow } from '../../components/ios/GroupedListRow';
import { DashboardPageLoading } from '../../components/dashboard/DashboardPageLoading';
import { TableSurfaceProgress } from '../../components/dashboard/TableSurfaceProgress';
import { WalletTopUpAlert } from '../../components/WalletTopUpAlert';
import { UserErrorAlert } from '../../components/UserErrorAlert';
import { useWalletAvailableBalance } from '../../hooks/useWalletAvailableBalance';
import { formatUserFacingErrorMessage } from '../../utils/userFriendlyErrors';
import { AppEmptyState } from '../../components/ui/AppEmptyState';
import { AppBadge } from '../../components/ui/AppBadge';
import { CustomerHeroBanner } from '../../components/customer/CustomerHeroBanner';
import { CustomerChargingPersonalStrip } from '../../components/customer/CustomerChargingPersonalStrip';
import { CUSTOMER_IMAGES } from '../../config/customerImagery';
import { iosRadii } from '../../theme/iosMobileTokens';
import { PLATFORM_CURRENCY } from '../../constants/platform';

type NavItem = {
  id: string;
  primary: string;
  secondary?: string;
  to: string;
  Icon: SvgIconComponent;
};

const NAV: NavItem[] = [
  {
    id: 'find',
    primary: 'Find chargers',
    secondary: 'Map & nearby search',
    to: CUSTOMER_ROUTES.stations,
    Icon: LocationOnIcon,
  },
  {
    id: 'stats',
    primary: 'Charge history',
    secondary: 'Past sessions & costs',
    to: CUSTOMER_ROUTES.sessionsHistory,
    Icon: BarChartIcon,
  },
  {
    id: 'live',
    primary: 'Live charging',
    secondary: 'Active sessions',
    to: CUSTOMER_ROUTES.sessionsActive,
    Icon: BatteryChargingFullIcon,
  },
  {
    id: 'wallet',
    primary: 'Wallet',
    secondary: 'Balance & top up',
    to: CUSTOMER_ROUTES.wallet,
    Icon: AccountBalanceWalletIcon,
  },
  {
    id: 'pay',
    primary: 'Payment methods',
    secondary: 'Cards & mobile money',
    to: CUSTOMER_ROUTES.paymentMethods,
    Icon: CreditCardIcon,
  },
];

const listIconSx = {
  width: 40,
  height: 40,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  mr: 1.5,
  bgcolor: (t: Theme) => alpha(t.palette.primary.main, 0.1),
  color: 'primary.main',
};

export function CustomerChargingPage() {
  const navigate = useNavigate();
  const { loading, refreshing, updatedAt, runWithRefresh } = useLiveRefresh();
  const [chargingDataReady, setChargingDataReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSession, setLastSession] = useState<Transaction | null>(null);
  const [activeCount, setActiveCount] = useState(0);

  const { available, isBelowMinimum } = useWalletAvailableBalance(true);
  const storedUser = getStoredUser();
  const greetingName = storedUser?.firstName || storedUser?.name || null;

  const loadChargingData = useCallback(async (silent?: boolean) => {
    await runWithRefresh(async () => {
      try {
        const user = getStoredUser();
        const userId = typeof user?.id === 'number' ? user.id : null;
        if (!userId) {
          setLastSession(null);
          setActiveCount(0);
          return false;
        }

        try {
          setError(null);
          const [listRes, active] = await Promise.all([
            transactionsApi.getAll(20, 0, undefined, undefined, userId),
            transactionsApi.getActive(undefined, userId),
          ]);
          const txs = listRes?.transactions && Array.isArray(listRes.transactions) ? listRes.transactions : [];
          setLastSession(pickLastEndedChargingSession(txs));
          setActiveCount(active?.length ?? 0);
          return true;
        } catch (e: unknown) {
          setError(formatUserFacingErrorMessage(e, 'charging'));
          return false;
        }
      } finally {
        setChargingDataReady(true);
      }
    }, silent);
  }, [runWithRefresh]);

  useEffect(() => {
    void loadChargingData();
  }, [loadChargingData]);

  useCustomerPullRefresh(useCallback(() => void loadChargingData(true), [loadChargingData]));

  const lastLine = useMemo(() => {
    if (!lastSession?.stopTime) return null;
    const d = new Date(lastSession.stopTime);
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  }, [lastSession]);

  const lastEnergyLabel = useMemo(() => {
    if (!lastSession) return null;
    return formatSessionEnergy(lastSession);
  }, [lastSession]);

  if (loading && !chargingDataReady) {
    return <DashboardPageLoading />;
  }

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden', position: 'relative', ...mobileMainLayoutBottomMarginSx }}>
      <TableSurfaceProgress active={loading && chargingDataReady} ariaLabel="Loading charging hub" />
      {error && (
        <UserErrorAlert error={error} context="charging" sx={{ mb: 2 }} onClose={() => setError(null)} />
      )}

      {isBelowMinimum && (
        <WalletTopUpAlert
          variant={activeCount > 0 ? 'duringCharging' : 'belowMinimum'}
          sx={{ mb: 2 }}
        />
      )}

      <LivePageHeader
        title="Charging"
        subtitle={
          activeCount > 0
            ? `${activeCount} live session${activeCount === 1 ? '' : 's'} in progress`
            : 'Charge, pay, and go'
        }
        updatedAt={updatedAt}
        liveLabel={LIVE_DATA_LABELS.charging}
        refreshing={refreshing}
        onRefresh={() => void loadChargingData(true)}
        titleVariant="large"
        containerSx={{ mb: 1.5 }}
        refreshSx={{ width: { xs: '100%', sm: 'auto' } }}
        actions={
          activeCount > 0 ? (
            <AppBadge label={`${activeCount} live`} tone="info" sx={{ alignSelf: 'center' }} />
          ) : undefined
        }
      />

      <CustomerHeroBanner
        src={CUSTOMER_IMAGES.chargingHubHero}
        alt="Electric vehicle charging at a modern station"
        title="Power when you need it"
        subtitle="Find a charger, start a session, and pay from your wallet."
      />

      <CustomerChargingPersonalStrip
        greetingName={greetingName}
        availableBalance={available}
        currency={PLATFORM_CURRENCY}
        activeCount={activeCount}
        lastEnergyLabel={lastEnergyLabel}
      />

      {activeCount === 0 && !lastSession ? (
        <AppEmptyState
          sx={{ mb: 2 }}
          illustrationSrc={CUSTOMER_IMAGES.emptyReadyCharge}
          illustrationAlt="Ready to charge"
          title="Ready when you are"
          description="Find a nearby charger to start. Your last session will show here."
          primaryAction={{
            label: 'Find chargers',
            onClick: () => navigate(CUSTOMER_ROUTES.stations),
            startIcon: <LocationOnIcon />,
          }}
          secondaryAction={{
            label: 'Top up wallet',
            onClick: () => navigate(CUSTOMER_ROUTES.walletTopUp),
            variant: 'secondary',
          }}
        />
      ) : null}

      <GroupedListSection title="Shortcuts" sx={{ mb: 2 }}>
        {NAV.map((item, index) => {
          const Icon = item.Icon;
          return (
            <GroupedListRow
              key={item.id}
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                  <Box sx={listIconSx} aria-hidden>
                    <Icon sx={{ fontSize: 20 }} />
                  </Box>
                  <Box component="span" sx={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                    {item.primary}
                  </Box>
                </Box>
              }
              secondary={item.secondary}
              onClick={() => navigate(item.to)}
              divider={index < NAV.length - 1}
            />
          );
        })}
      </GroupedListSection>

      {lastSession && lastLine && (
        <Paper
          elevation={0}
          sx={{
            ...premiumPanelCardSx,
            p: { xs: 2, sm: 2.25 },
            background: (t) =>
              `linear-gradient(165deg, ${alpha(t.palette.primary.main, 0.08)} 0%, ${t.palette.background.paper} 48%)`,
            borderColor: (t) => alpha(t.palette.primary.main, 0.16),
          }}
        >
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ fontWeight: 600, letterSpacing: '-0.01em', mb: 0.5 }}
          >
            Last charge
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {lastLine}
            {lastSession.chargePointId ? ` · ${lastSession.chargePointId}` : ''}
          </Typography>
          {isNoEnergyCompleted(lastSession) && (
            <Typography variant="caption" color="warning.main" sx={{ display: 'block', mb: 1 }}>
              {sessionStatusLabel(lastSession)}
            </Typography>
          )}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 1, mb: 1.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '-0.02em' }}>
              {formatSessionCost(lastSession)}
            </Typography>
            <Typography variant="body2" component="span" color="text.secondary">
              {formatSessionEnergy(lastSession)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1, mt: 1 }}>
            <Button
              component={RouterLink}
              to={`${CUSTOMER_ROUTES.sessionsRoot}/${lastSession.transactionId}`}
              variant="outlined"
              size="medium"
              fullWidth
              sx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), borderRadius: `${iosRadii.sm}px` })}
            >
              Details
            </Button>
            <Button
              component={RouterLink}
              to={CUSTOMER_ROUTES.sessionsHistory}
              variant="contained"
              size="medium"
              fullWidth
              disableElevation
              sx={(th) => sxObject(th, compactContainedCtaSx)}
            >
              History
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
}

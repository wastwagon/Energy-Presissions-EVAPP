import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import type { SvgIconComponent } from '@mui/icons-material';
import { Box, Typography, Paper, Alert, Button } from '@mui/material';
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
import { formatCurrency } from '../../utils/formatters';
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
    secondary: 'Map and search nearby chargers',
    to: CUSTOMER_ROUTES.stations,
    Icon: LocationOnIcon,
  },
  {
    id: 'stats',
    primary: 'Charge stats',
    secondary: 'Session history and costs',
    to: CUSTOMER_ROUTES.sessionsHistory,
    Icon: BarChartIcon,
  },
  {
    id: 'live',
    primary: 'Live charging',
    secondary: 'Active sessions and stop',
    to: CUSTOMER_ROUTES.sessionsActive,
    Icon: BatteryChargingFullIcon,
  },
  {
    id: 'wallet',
    primary: 'Wallet & top up',
    to: CUSTOMER_ROUTES.wallet,
    Icon: AccountBalanceWalletIcon,
  },
  {
    id: 'pay',
    primary: 'Manage payment',
    secondary: 'Payment methods',
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

  const { isBelowMinimum } = useWalletAvailableBalance(true);

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
            ? `${activeCount} live session${activeCount === 1 ? '' : 's'} — open Live charging below to manage`
            : 'Find chargers, manage sessions, and wallet'
        }
        updatedAt={updatedAt}
        liveLabel={LIVE_DATA_LABELS.charging}
        refreshing={refreshing}
        onRefresh={() => void loadChargingData(true)}
        titleVariant="large"
        containerSx={{ mb: 2 }}
        refreshSx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), width: { xs: '100%', sm: 'auto' } })}
      />

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
        <Paper elevation={0} sx={{ ...premiumPanelCardSx, p: { xs: 2, sm: 2.25 } }}>
          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: '0.12em' }}>
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
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
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
              sx={(th) => sxObject(th, compactOutlinedCtaSx)}
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

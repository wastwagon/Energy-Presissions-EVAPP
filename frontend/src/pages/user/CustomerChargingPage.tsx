import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import EvStationOutlinedIcon from '@mui/icons-material/EvStationOutlined';
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
import { CustomerChargingPersonalStrip } from '../../components/customer/CustomerChargingPersonalStrip';
import { PLATFORM_CURRENCY } from '../../constants/platform';
import { CUSTOMER_IMAGES } from '../../config/customerImagery';

type NavItem = {
  id: string;
  primary: string;
  secondary?: string;
  to: string;
};

const NAV: NavItem[] = [
  {
    id: 'live',
    primary: 'Live charging',
    secondary: 'Sessions in progress',
    to: CUSTOMER_ROUTES.sessionsActive,
  },
  {
    id: 'stats',
    primary: 'Charge history',
    secondary: 'Past sessions & costs',
    to: CUSTOMER_ROUTES.sessionsHistory,
  },
];

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
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden', position: 'relative' }}>
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
        title="Charge"
        subtitle={
          activeCount > 0
            ? `${activeCount} live session${activeCount === 1 ? '' : 's'}`
            : greetingName
              ? `Hi ${greetingName.split(/\s+/)[0]}`
              : 'Ready when you are'
        }
        updatedAt={updatedAt}
        liveLabel={LIVE_DATA_LABELS.charging}
        refreshing={refreshing}
        onRefresh={() => void loadChargingData(true)}
        titleVariant="large"
        containerSx={{ mb: 1.25 }}
        showLiveMeta={false}
      />

      <CustomerChargingPersonalStrip
        availableBalance={available}
        currency={PLATFORM_CURRENCY}
        activeCount={activeCount}
        lastEnergyLabel={lastEnergyLabel}
      />

      {activeCount === 0 && !lastSession ? (
        <AppEmptyState
          variant="plain"
          illustrationSrc={CUSTOMER_IMAGES.emptyReadyCharge}
          illustrationAlt=""
          icon={<EvStationOutlinedIcon />}
          title="No recent charge"
          description="Plug in at a station to start. Your last session will show here."
          primaryAction={{
            label: 'Find a charger',
            onClick: () => navigate(CUSTOMER_ROUTES.stations),
            startIcon: <LocationOnOutlinedIcon />,
          }}
        />
      ) : null}

      <GroupedListSection title="Charging">
        {NAV.map((item, index) => (
          <GroupedListRow
            key={item.id}
            primary={item.primary}
            secondary={item.secondary}
            onClick={() => navigate(item.to)}
            divider={index < NAV.length - 1}
          />
        ))}
      </GroupedListSection>

      {lastSession && lastLine && (
        <GroupedListSection title="Last charge">
          <GroupedListRow
            primary={formatSessionCost(lastSession)}
            secondary={
              <>
                {lastLine}
                {lastSession.chargePointId ? ` · ${lastSession.chargePointId}` : ''}
                {` · ${formatSessionEnergy(lastSession)}`}
                {isNoEnergyCompleted(lastSession) ? ` · ${sessionStatusLabel(lastSession)}` : ''}
              </>
            }
            onClick={() => navigate(`${CUSTOMER_ROUTES.sessionsRoot}/${lastSession.transactionId}`)}
            divider
          />
          <GroupedListRow
            primary="See all history"
            onClick={() => navigate(CUSTOMER_ROUTES.sessionsHistory)}
          />
        </GroupedListSection>
      )}
    </Box>
  );
}


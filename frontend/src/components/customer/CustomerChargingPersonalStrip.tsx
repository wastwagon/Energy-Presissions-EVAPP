import { useNavigate } from 'react-router-dom';
import { Typography } from '@mui/material';
import { formatCurrency } from '../../utils/formatters';
import { CUSTOMER_ROUTES } from '../../config/customerNav.paths';
import { GroupedListSection } from '../ios/GroupedListSection';
import { GroupedListRow } from '../ios/GroupedListRow';

type CustomerChargingPersonalStripProps = {
  availableBalance: number | null;
  currency?: string;
  activeCount: number;
  lastEnergyLabel?: string | null;
};

/** Wallet / live / last charge as a Settings-style grouped list. */
export function CustomerChargingPersonalStrip({
  availableBalance,
  currency = 'GHS',
  activeCount,
  lastEnergyLabel,
}: CustomerChargingPersonalStripProps) {
  const navigate = useNavigate();

  return (
    <GroupedListSection>
      <GroupedListRow
        primary="Balance"
        end={
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '1rem' }}>
            {availableBalance == null ? '—' : formatCurrency(availableBalance, currency)}
          </Typography>
        }
        onClick={() => navigate(CUSTOMER_ROUTES.wallet)}
        divider
      />
      <GroupedListRow
        primary="Live"
        end={
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '1rem' }}>
            {activeCount}
          </Typography>
        }
        onClick={() => navigate(CUSTOMER_ROUTES.sessionsActive)}
        divider
      />
      <GroupedListRow
        primary="Last charge"
        end={
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '1rem' }}>
            {lastEnergyLabel || '—'}
          </Typography>
        }
        onClick={() => navigate(CUSTOMER_ROUTES.sessionsHistory)}
      />
    </GroupedListSection>
  );
}

import { Link as RouterLink } from 'react-router-dom';
import { Alert, Button, type AlertProps } from '@mui/material';
import { CUSTOMER_ROUTES } from '../config/customerNav.paths';
import { MIN_WALLET_START_BALANCE } from '../constants/chargingWallet';
import { formatCurrency } from '../utils/formatters';
import { triggerHaptic } from '../utils/haptics';

export type WalletTopUpAlertVariant = 'belowMinimum' | 'duringCharging' | 'sessionStopped';

type WalletTopUpAlertProps = {
  variant?: WalletTopUpAlertVariant;
  severity?: AlertProps['severity'];
  onTopUpClick?: () => void;
  sx?: AlertProps['sx'];
};

const COPY: Record<WalletTopUpAlertVariant, string> = {
  belowMinimum: `Top up your wallet to start charging. Minimum balance is ${formatCurrency(MIN_WALLET_START_BALANCE, 'GHS')}.`,
  duringCharging:
    'Your wallet balance is running low. Top up now to avoid your charging session stopping unexpectedly.',
  sessionStopped:
    'Charging stopped because your wallet balance is too low. Top up your wallet to charge again.',
};

export function WalletTopUpAlert({
  variant = 'belowMinimum',
  severity = 'warning',
  onTopUpClick,
  sx,
}: WalletTopUpAlertProps) {
  return (
    <Alert
      severity={severity}
      sx={sx}
      action={
        <Button
          component={RouterLink}
          to={CUSTOMER_ROUTES.walletTopUp}
          size="small"
          color="inherit"
          onClick={() => {
            triggerHaptic('light');
            onTopUpClick?.();
          }}
        >
          Top up wallet
        </Button>
      }
    >
      {COPY[variant]}
    </Alert>
  );
}

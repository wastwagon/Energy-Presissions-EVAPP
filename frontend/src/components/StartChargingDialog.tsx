import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Skeleton,
  Paper,
  Divider,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { StationDetails, StationWithDistance } from '../services/stationsApi';
import { walletApi } from '../services/walletApi';
import { chargePointsApi } from '../services/chargePointsApi';
import { requireStoredUserId } from '../utils/authSession';
import { formatCurrency } from '../utils/formatters';
import {
  compactContainedCtaSx,
  compactTertiaryCtaSx,
  sxObject,
} from '../styles/authShell';
import { AdaptiveSheet } from './ios/AdaptiveSheet';
import { WalletTopUpAlert } from './WalletTopUpAlert';
import { UserErrorAlert } from './UserErrorAlert';
import { triggerHaptic } from '../utils/haptics';
import { UserMessages, formatUserFacingErrorMessage } from '../utils/userFriendlyErrors';
import { CUSTOMER_ROUTES } from '../config/customerNav.paths';
import { MIN_WALLET_START_BALANCE } from '../constants/chargingWallet';
import BoltIcon from '@mui/icons-material/Bolt';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

interface StartChargingDialogProps {
  open: boolean;
  onClose: () => void;
  station: StationWithDistance | StationDetails | null;
  onSuccess: () => void;
}

export function StartChargingDialog({ open, onClose, station, onSuccess }: StartChargingDialogProps) {
  const theme = useTheme();
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [availableBalance, setAvailableBalance] = useState<number | null>(null);
  const [reservedBalance, setReservedBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const pricePerKwh = station?.pricePerKwh ? parseFloat(station.pricePerKwh.toString()) : 0;
  const displayPricePerKwh =
    typeof pricePerKwh === 'number' && !isNaN(pricePerKwh)
      ? pricePerKwh
      : station?.pricePerKwh
        ? parseFloat(station.pricePerKwh.toString())
        : 0;

  const holdBalance = availableBalance ?? walletBalance;
  const insufficientFunds = holdBalance !== null && holdBalance < MIN_WALLET_START_BALANCE;
  const canStartSession = !starting && holdBalance !== null && holdBalance >= MIN_WALLET_START_BALANCE;

  useEffect(() => {
    if (open && station) {
      void loadWalletBalance();
      setError(null);
      setInfoMessage(null);
    }
  }, [open, station]);

  const loadWalletBalance = async () => {
    try {
      setLoadingBalance(true);
      const available = await walletApi.getAvailableBalance();
      setAvailableBalance(available.available);
      setReservedBalance(available.reserved);
      setWalletBalance(available.total);
    } catch {
      try {
        const balance = await walletApi.getBalance();
        setWalletBalance(balance.balance);
        setAvailableBalance(balance.balance);
        setReservedBalance(0);
      } catch {
        setError(UserMessages.loadWalletFailed);
      }
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleStart = async () => {
    if (!station) return;

    const balanceToCheck = availableBalance !== null ? availableBalance : walletBalance;
    if (balanceToCheck !== null && balanceToCheck < MIN_WALLET_START_BALANCE) {
      setError(UserMessages.walletMinToStart);
      return;
    }

    if (!station.chargePointId) {
      setError(UserMessages.invalidChargePoint);
      return;
    }

    try {
      triggerHaptic('light');
      setStarting(true);
      setError(null);
      setInfoMessage(null);
      const userId = requireStoredUserId();
      const result = await chargePointsApi.walletStart(station.chargePointId, 1, userId);

      if (result.success) {
        if (result.pendingSession) {
          setInfoMessage(
            result.message ||
              'Remote start was sent. Plug your vehicle into the connector — your session will appear when the charger confirms.',
          );
          setStarting(false);
          return;
        }
        triggerHaptic('success');
        onClose();
        onSuccess();
      } else {
        throw new Error(result.message || 'Failed to start charging session');
      }
    } catch (err: unknown) {
      setError(formatUserFacingErrorMessage(err, 'charging'));
      setStarting(false);
    }
  };

  const sheetHeader = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        }}
      >
        <BoltIcon sx={{ color: 'primary.main', fontSize: 22 }} />
      </Box>
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.25 }}>
          Start charging
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Pay as you charge from your wallet
        </Typography>
      </Box>
    </Box>
  );

  return (
    <AdaptiveSheet
      open={open}
      onClose={onClose}
      title="Start charging"
      header={sheetHeader}
      tall
      disableClose={starting}
      maxWidth="sm"
      actions={
        <>
          <Button
            onClick={onClose}
            variant="text"
            disabled={starting}
            sx={(th) => sxObject(th, compactTertiaryCtaSx)}
          >
            Cancel
          </Button>
          {infoMessage ? (
            <Button
              variant="contained"
              disableElevation
              onClick={() => {
                triggerHaptic('light');
                onClose();
                onSuccess();
              }}
              sx={(th) => sxObject(th, compactContainedCtaSx)}
            >
              Done
            </Button>
          ) : (
            <Button
              onClick={handleStart}
              variant="contained"
              disableElevation
              disabled={!canStartSession}
              aria-busy={starting || undefined}
              startIcon={starting ? <CircularProgress size={16} color="inherit" /> : <BoltIcon sx={{ fontSize: 18 }} />}
              sx={(th) => sxObject(th, compactContainedCtaSx)}
            >
              {starting ? 'Starting…' : 'Start charging'}
            </Button>
          )}
        </>
      }
    >
      <Box
        sx={{
          height: 3,
          width: '100%',
          mb: 1.5,
          borderRadius: 1,
          background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.main, 0.35)} 100%)`,
        }}
      />
      {error && (
        <UserErrorAlert
          error={error}
          context="charging"
          sx={{ mb: 1.5 }}
          onClose={() => setError(null)}
          onAction={onClose}
        />
      )}
      {infoMessage && (
        <Alert severity="info" sx={{ mb: 1.5 }}>
          {infoMessage}
        </Alert>
      )}

      {station && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>{station.locationName || station.chargePointId}</strong>
            </Typography>
            <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
              {station.currency || 'GHS'} {displayPricePerKwh.toFixed(2)}/kWh
            </Typography>
          </Box>

          <Divider sx={{ my: 1.5 }} />

          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 1.5,
              borderRadius: 2.5,
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountBalanceWalletIcon sx={{ fontSize: 22, color: 'primary.main' }} />
                <Typography variant="body2" fontWeight={700}>
                  {reservedBalance > 0 ? 'Available balance' : 'Wallet balance'}
                </Typography>
              </Box>
              <Typography variant="h6" fontWeight={800} sx={{ fontSize: '1.125rem' }}>
                {loadingBalance ? (
                  <Skeleton variant="rounded" width={100} height={28} />
                ) : (
                  formatCurrency(holdBalance ?? walletBalance, 'GHS')
                )}
              </Typography>
            </Box>
            {!loadingBalance && insufficientFunds && (
              <WalletTopUpAlert variant="belowMinimum" sx={{ mt: 1.5 }} onTopUpClick={onClose} />
            )}
            {reservedBalance > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mt: 1,
                  pt: 1,
                  borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                }}
              >
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Available {formatCurrency(availableBalance, 'GHS')}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Reserved {formatCurrency(reservedBalance, 'GHS')}
                </Typography>
              </Box>
            )}
          </Paper>

          <Alert severity="info" sx={{ py: 0.75 }}>
            Your wallet is charged as energy is delivered. Charging stops when you tap Stop, your balance runs low, or your vehicle finishes.
          </Alert>
        </Box>
      )}
    </AdaptiveSheet>
  );
}

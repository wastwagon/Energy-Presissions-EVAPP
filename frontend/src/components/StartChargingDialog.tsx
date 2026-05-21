import { useState, useEffect, useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Skeleton,
  Grid,
  Paper,
  Divider,
  InputAdornment,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { StationDetails, StationWithDistance } from '../services/stationsApi';
import { walletApi } from '../services/walletApi';
import { chargePointsApi } from '../services/chargePointsApi';
import { requireStoredUserId } from '../utils/authSession';
import { formatCurrency } from '../utils/formatters';
import {
  authFormFieldSx,
  compactContainedCtaSx,
  compactOutlinedCtaSx,
  sxObject,
} from '../styles/authShell';
import { premiumPanelCardSx } from '../theme/jampackShell';
import { GroupedListSection } from './ios/GroupedListSection';
import { AdaptiveSheet } from './ios/AdaptiveSheet';
import { triggerHaptic } from '../utils/haptics';
import { CUSTOMER_ROUTES } from '../config/customerNav.paths';
import BoltIcon from '@mui/icons-material/Bolt';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

interface StartChargingDialogProps {
  open: boolean;
  onClose: () => void;
  station: StationWithDistance | StationDetails | null;
  onSuccess: () => void;
}

export function StartChargingDialog({ open, onClose, station, onSuccess }: StartChargingDialogProps) {
  const theme = useTheme();
  const [amount, setAmount] = useState('');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [availableBalance, setAvailableBalance] = useState<number | null>(null);
  const [reservedBalance, setReservedBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [quickAmount, setQuickAmount] = useState<number | null>(null);

  const QUICK_AMOUNTS = [25, 50, 100, 200] as const;

  const pricePerKwh = station?.pricePerKwh ? parseFloat(station.pricePerKwh.toString()) : 0;
  const capacityKw = station?.totalCapacityKw ? parseFloat(station.totalCapacityKw.toString()) : 0;
  const amountNum = parseFloat(amount) || 0;
  const capacityKwh = pricePerKwh > 0 ? amountNum / pricePerKwh : 0;
  const estimatedHours = capacityKw > 0 ? capacityKwh / capacityKw : 0;

  const displayPricePerKwh =
    typeof pricePerKwh === 'number' && !isNaN(pricePerKwh)
      ? pricePerKwh
      : station?.pricePerKwh
        ? parseFloat(station.pricePerKwh.toString())
        : 0;

  const holdBalance = availableBalance ?? walletBalance;
  const insufficientFunds = useMemo(
    () => holdBalance !== null && amountNum > 0 && amountNum > holdBalance,
    [holdBalance, amountNum],
  );
  const canStartSession =
    !starting &&
    amountNum > 0 &&
    holdBalance !== null &&
    amountNum <= holdBalance;

  useEffect(() => {
    if (open && station) {
      void loadWalletBalance();
      setAmount('');
      setQuickAmount(null);
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
        setError('Failed to load wallet balance. Please try again.');
      }
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleStart = async () => {
    if (!station) return;

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const parsed = parseFloat(amount);
    const balanceToCheck = availableBalance !== null ? availableBalance : walletBalance;
    if (balanceToCheck !== null && parsed > balanceToCheck) {
      const balanceText =
        reservedBalance > 0
          ? `Available: ${formatCurrency(availableBalance, 'GHS')} (${formatCurrency(reservedBalance, 'GHS')} reserved)`
          : `${formatCurrency(walletBalance, 'GHS')}`;
      setError(`Insufficient available balance. Your ${balanceText}`);
      return;
    }

    if (!station.chargePointId) {
      setError('Invalid charge point');
      return;
    }

    try {
      triggerHaptic('light');
      setStarting(true);
      setError(null);
      setInfoMessage(null);
      const userId = requireStoredUserId();
      const result = await chargePointsApi.walletStart(station.chargePointId, 1, userId, parsed);

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
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to start charging session');
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
          Wallet hold · session starts when confirmed
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
            variant="outlined"
            disabled={starting}
            sx={(th) => sxObject(th, compactOutlinedCtaSx)}
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
              startIcon={starting ? <CircularProgress size={16} color="inherit" /> : <BoltIcon sx={{ fontSize: 18 }} />}
              sx={(th) => sxObject(th, compactContainedCtaSx)}
            >
              {starting ? 'Starting…' : 'Start session'}
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
        <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError(null)}>
          {error}
        </Alert>
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
              <Alert
                severity="warning"
                sx={{ mt: 1.5 }}
                action={
                  <Button
                    component={RouterLink}
                    to={CUSTOMER_ROUTES.walletTopUp}
                    size="small"
                    color="inherit"
                    onClick={() => {
                      triggerHaptic('light');
                      onClose();
                    }}
                  >
                    Top up
                  </Button>
                }
              >
                Add funds to cover {formatCurrency(amountNum, 'GHS')} before starting a session.
              </Alert>
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

          <GroupedListSection title="Session amount" sx={{ mb: 1.5 }}>
            <Grid container spacing={1.25} sx={{ p: 2, pt: 1 }}>
              {QUICK_AMOUNTS.map((value) => (
                <Grid item xs={6} key={value}>
                  <Button
                    fullWidth
                    disableElevation
                    variant={quickAmount === value ? 'contained' : 'outlined'}
                    onClick={() => {
                      triggerHaptic('light');
                      setQuickAmount(value);
                      setAmount(String(value));
                      setError(null);
                    }}
                    sx={(th) =>
                      quickAmount === value
                        ? { ...sxObject(th, compactContainedCtaSx), minHeight: 48 }
                        : { ...sxObject(th, compactOutlinedCtaSx), minHeight: 48 }
                    }
                  >
                    {formatCurrency(value, 'GHS')}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </GroupedListSection>

          <TextField
            label="Custom amount (GHS)"
            type="number"
            fullWidth
            value={amount}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
                setAmount(value);
                setQuickAmount(null);
                setError(null);
              }
            }}
            inputProps={{ min: 0, step: 0.01 }}
            helperText={amountNum > 0 ? undefined : 'Enter amount to reserve for this session'}
            sx={(th) => ({ ...sxObject(th, authFormFieldSx), mb: 1.5 })}
            size="small"
            InputProps={{
              startAdornment: <InputAdornment position="start">GHS</InputAdornment>,
            }}
          />

          {amountNum > 0 && pricePerKwh > 0 && (
            <Paper elevation={0} sx={{ ...premiumPanelCardSx, mb: 1, p: 2 }}>
              <Grid container spacing={1.5} sx={{ mb: 1 }}>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <BoltIcon color="primary" fontSize="small" />
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Capacity
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {capacityKwh.toFixed(2)} kWh
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <AccessTimeIcon color="primary" fontSize="small" />
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Time
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {estimatedHours >= 1
                          ? `${Math.floor(estimatedHours)}h ${Math.round((estimatedHours % 1) * 60)}m`
                          : `${Math.round(estimatedHours * 60)}m`}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
              <Alert severity="info" sx={{ py: 0.5 }}>
                Auto-stops when amount is exhausted
              </Alert>
            </Paper>
          )}
        </Box>
      )}
    </AdaptiveSheet>
  );
}

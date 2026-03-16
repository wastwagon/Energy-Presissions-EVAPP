import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Grid,
  Paper,
  Divider,
} from '@mui/material';
import { StationWithDistance } from '../services/stationsApi';
import { walletApi } from '../services/walletApi';
import { chargePointsApi } from '../services/chargePointsApi';
import BoltIcon from '@mui/icons-material/Bolt';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

interface StartChargingDialogProps {
  open: boolean;
  onClose: () => void;
  station: StationWithDistance | null;
  onSuccess: () => void;
}

export function StartChargingDialog({
  open,
  onClose,
  station,
  onSuccess,
}: StartChargingDialogProps) {
  const [amount, setAmount] = useState('');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [availableBalance, setAvailableBalance] = useState<number | null>(null);
  const [reservedBalance, setReservedBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate capacity and hours based on amount
  // Ensure pricePerKwh and capacityKw are numbers (may come as strings from API)
  const pricePerKwh = station?.pricePerKwh ? parseFloat(station.pricePerKwh.toString()) : 0;
  const capacityKw = station?.totalCapacityKw ? parseFloat(station.totalCapacityKw.toString()) : 0;
  const amountNum = parseFloat(amount) || 0;
  const capacityKwh = pricePerKwh > 0 ? amountNum / pricePerKwh : 0;
  const estimatedHours = capacityKw > 0 ? capacityKwh / capacityKw : 0;

  // Ensure displayPricePerKwh is always a number for safe display
  const displayPricePerKwh = typeof pricePerKwh === 'number' && !isNaN(pricePerKwh) 
    ? pricePerKwh 
    : (station?.pricePerKwh ? parseFloat(station.pricePerKwh.toString()) : 0);

  useEffect(() => {
    if (open && station) {
      loadWalletBalance();
      setAmount('');
      setError(null);
    }
  }, [open, station]);

  const loadWalletBalance = async () => {
    try {
      setLoadingBalance(true);
      // Get available balance (excludes pending reservations)
      const available = await walletApi.getAvailableBalance();
      setAvailableBalance(available.available);
      setReservedBalance(available.reserved);
      setWalletBalance(available.total);
    } catch (err: any) {
      console.error('Failed to load wallet balance:', err);
      // Fallback to regular balance if available balance fails
      try {
        const balance = await walletApi.getBalance();
        setWalletBalance(balance.balance);
        setAvailableBalance(balance.balance);
        setReservedBalance(0);
      } catch (fallbackErr: any) {
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

    const amountNum = parseFloat(amount);
    const balanceToCheck = availableBalance !== null ? availableBalance : walletBalance;
    if (balanceToCheck !== null && amountNum > balanceToCheck) {
      const balanceText = reservedBalance > 0 
        ? `Available: ${availableBalance?.toFixed(2)} GHS (${reservedBalance.toFixed(2)} GHS reserved)`
        : `${walletBalance?.toFixed(2)} GHS`;
      setError(`Insufficient available balance. Your ${balanceText}`);
      return;
    }

    if (!station.chargePointId) {
      setError('Invalid charge point');
      return;
    }

    try {
      setStarting(true);
      setError(null);

      // Get user ID from localStorage
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        throw new Error('User not logged in');
      }
      const user = JSON.parse(userStr);
      const userId = user.id;

      // Use the first available connector (connectorId 1)
      const connectorId = 1;

      // Start wallet-based charging (reserves amount and starts session)
      const result = await chargePointsApi.walletStart(
        station.chargePointId,
        connectorId,
        userId,
        amountNum,
      );

      if (result.success) {
        // Close dialog first
        onClose();
        // Then refresh stations and show success
        onSuccess();
        // Show success message after a brief delay to ensure dialog closes
        setTimeout(() => {
          alert(result.message || 'Charging session started successfully!');
        }, 200);
      } else {
        throw new Error(result.message || 'Failed to start charging session');
      }
    } catch (err: any) {
      console.error('Error starting charging session:', err);
      setError(err.response?.data?.message || err.message || 'Failed to start charging session');
      setStarting(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '90vh',
          margin: { xs: 1, sm: 2 },
        }
      }}
    >
      <DialogTitle sx={{ pb: 1, pt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BoltIcon color="primary" fontSize="small" />
          <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
            Start Charging
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 1.5, fontSize: { xs: '0.75rem', sm: '0.875rem' }, py: { xs: 0.5, sm: 1 } }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {station && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                <strong>{station.locationName || station.chargePointId}</strong>
              </Typography>
              <Typography variant="body2" color="primary" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                {station.currency || 'GHS'} {displayPricePerKwh.toFixed(2)}/kWh
              </Typography>
            </Box>

            <Divider sx={{ my: 1.5 }} />

            {/* Wallet Balance - Compact */}
            <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 1.5, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <AccountBalanceWalletIcon sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }} />
                  <Typography variant="body2" fontWeight="bold" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    Balance:
                  </Typography>
                </Box>
                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  {loadingBalance ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    `GHS ${walletBalance?.toFixed(2) || '0.00'}`
                  )}
                </Typography>
              </Box>
              {reservedBalance > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.75, pt: 0.75, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                  <Typography variant="caption" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                    Available: GHS {availableBalance?.toFixed(2) || '0.00'}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                    Reserved: GHS {reservedBalance.toFixed(2)}
                  </Typography>
                </Box>
              )}
            </Paper>

            {/* Amount Input */}
            <TextField
              label="Amount (GHS)"
              type="number"
              fullWidth
              value={amount}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
                  setAmount(value);
                  setError(null);
                }
              }}
              inputProps={{ min: 0, step: 0.01 }}
              helperText={amountNum > 0 ? undefined : "Enter amount to charge"}
              sx={{ mb: 1.5 }}
              size="small"
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1, fontSize: { xs: '0.875rem', sm: '1rem' } }}>GHS</Typography>,
              }}
            />

            {/* Calculations - Compact */}
            {amountNum > 0 && pricePerKwh > 0 && (
              <Paper sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', mb: 1 }}>
                <Grid container spacing={1.5} sx={{ mb: 1 }}>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <BoltIcon color="primary" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, display: 'block' }}>
                          Capacity
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                          {typeof capacityKwh === 'number' && !isNaN(capacityKwh) ? capacityKwh.toFixed(2) : '0.00'} kWh
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <AccessTimeIcon color="primary" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, display: 'block' }}>
                          Time
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                          {estimatedHours >= 1
                            ? `${Math.floor(estimatedHours)}h ${Math.round((estimatedHours % 1) * 60)}m`
                            : `${Math.round(estimatedHours * 60)}m`}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
                <Alert severity="info" sx={{ mt: 1, py: 0.5, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Auto-stops when amount is exhausted
                </Alert>
              </Paper>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 }, gap: 1 }}>
        <Button 
          onClick={onClose} 
          variant="outlined"
          disabled={starting}
          size="small"
          sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, minWidth: { xs: '80px', sm: '100px' } }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleStart}
          variant="contained"
          disabled={starting || !amount || parseFloat(amount) <= 0 || (availableBalance !== null && parseFloat(amount) > availableBalance) || (walletBalance !== null && parseFloat(amount) > walletBalance)}
          startIcon={starting ? <CircularProgress size={16} /> : <BoltIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />}
          size="small"
          sx={{ 
            fontSize: { xs: '0.875rem', sm: '1rem' },
            minWidth: { xs: '120px', sm: '140px' },
            px: { xs: 2, sm: 3 }
          }}
        >
          {starting ? 'Starting...' : 'Start'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

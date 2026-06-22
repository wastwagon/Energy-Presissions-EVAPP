import { useEffect, useRef, useState } from 'react';
import {
  Button,
  Typography,
  Box,
  Grid,
  Paper,
  Divider,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BoltIcon from '@mui/icons-material/Bolt';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { transactionsApi, Transaction } from '../services/transactionsApi';
import { walletApi } from '../services/walletApi';
import { getStoredUserId } from '../utils/authSession';
import { formatCurrency } from '../utils/formatters';
import {
  formatSessionCost,
  formatSessionDuration,
  formatSessionEnergy,
  formatSessionReserved,
  isNoEnergyCompleted,
  sessionStatusLabel,
} from '../utils/sessionDisplay';
import { premiumPanelCardSx } from '../theme/jampackShell';
import { compactContainedCtaSx, premiumIconButtonTouchSx, sxObject } from '../styles/authShell';
import { TransactionSummaryBodySkeleton } from './dashboard/BlockContentSkeletons';
import { AdaptiveSheet } from './ios/AdaptiveSheet';
import { WalletTopUpAlert } from './WalletTopUpAlert';
import { triggerHaptic } from '../utils/haptics';
import { MIN_WALLET_START_BALANCE } from '../constants/chargingWallet';

interface TransactionSummaryDialogProps {
  open: boolean;
  onClose: () => void;
  transactionId: number;
  onRefresh?: () => void;
}

export function TransactionSummaryDialog({
  open,
  onClose,
  transactionId,
  onRefresh,
}: TransactionSummaryDialogProps) {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    if (!open || !transactionId) {
      if (!open) {
        setTransaction(null);
        setWalletBalance(null);
        setRefundAmount(0);
      }
      return;
    }

    let cancelled = false;

    const loadWalletBalance = async () => {
      try {
        const userId = getStoredUserId();
        if (!userId) return;
        const balance = await walletApi.getAvailableBalance(userId);
        if (!cancelled) {
          setWalletBalance(balance.available);
        }
      } catch (err) {
        console.error('Failed to load wallet balance:', err);
      }
    };

    const loadTransaction = async () => {
      setLoading(true);
      setTransaction(null);
      try {
        const data = await transactionsApi.getById(transactionId);
        if (cancelled) return;
        setTransaction(data);
        if (data.walletReservedAmount && data.totalCost) {
          setRefundAmount(Math.max(0, data.walletReservedAmount - data.totalCost));
        } else {
          setRefundAmount(0);
        }
        triggerHaptic('success');
        onRefreshRef.current?.();
      } catch (err: any) {
        console.error('Failed to load transaction:', err);
        if (!cancelled) {
          setTransaction(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadWalletBalance();
    void loadTransaction();

    return () => {
      cancelled = true;
    };
  }, [open, transactionId]);

  if (!open) {
    return null;
  }

  const sheetHeader = (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
        {!loading && transaction && <CheckCircleIcon color="success" sx={{ flexShrink: 0 }} />}
        <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
          {loading ? 'Loading session…' : 'Session complete'}
        </Typography>
      </Box>
      <IconButton onClick={onClose} aria-label="Close" sx={(th) => sxObject(th, premiumIconButtonTouchSx)}>
        <CloseIcon />
      </IconButton>
    </Box>
  );

  return (
    <AdaptiveSheet
      open={open}
      onClose={onClose}
      title="Charging session complete"
      header={sheetHeader}
      tall
      maxWidth="md"
      actions={
        <Button onClick={onClose} variant="contained" disableElevation sx={(th) => sxObject(th, compactContainedCtaSx)}>
          Done
        </Button>
      }
    >
      {loading || !transaction ? (
        <TransactionSummaryBodySkeleton />
      ) : (
        <>
          <Paper sx={{ p: 2, mb: 2, bgcolor: 'success.light', color: 'success.contrastText', borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Transaction #{transaction.transactionId}
            </Typography>
            <Typography variant="body2">
              Status: <strong>{sessionStatusLabel(transaction)}</strong>
            </Typography>
            {isNoEnergyCompleted(transaction) && (
              <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.9 }}>
                No meter energy was recorded for this session.
              </Typography>
            )}
          </Paper>

          <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600, mb: 1.5 }}>
            <BoltIcon color="primary" fontSize="small" />
            Charging details
          </Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <Paper sx={{ ...premiumPanelCardSx, p: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Energy
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  {formatSessionEnergy(transaction)}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6}>
              <Paper sx={{ ...premiumPanelCardSx, p: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Duration
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {formatSessionDuration(transaction)}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600, mb: 1.5 }}>
            <ReceiptIcon color="primary" fontSize="small" />
            Billing
          </Typography>
          <Paper sx={{ ...premiumPanelCardSx, p: 2, mb: 2 }}>
            <SummaryRow label="Charge point" value={transaction.chargePointId} />
            {transaction.startTime && (
              <SummaryRow label="Start" value={new Date(transaction.startTime).toLocaleString()} />
            )}
            {transaction.stopTime && <SummaryRow label="End" value={new Date(transaction.stopTime).toLocaleString()} />}
            {transaction.walletReservedAmount != null && Number(transaction.walletReservedAmount) > 0 && (
              <SummaryRow
                label="Purchased (max)"
                value={formatSessionReserved(transaction)}
              />
            )}
            <Divider sx={{ my: 1 }} />
            <SummaryRow label="Total cost" value={formatSessionCost(transaction)} bold />
            {refundAmount > 0 && (
              <Box sx={{ mt: 1.5, p: 1.25, bgcolor: 'success.light', borderRadius: 1 }}>
                <SummaryRow
                  label="Refunded"
                  value={formatCurrency(refundAmount, transaction.currency || 'GHS')}
                  bold
                />
              </Box>
            )}
          </Paper>

          {walletBalance !== null && (
            <Paper sx={{ ...premiumPanelCardSx, p: 2, bgcolor: 'primary.light', color: 'primary.contrastText', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccountBalanceWalletIcon fontSize="small" />
                  <Typography variant="body2" fontWeight={600}>
                    Wallet balance
                  </Typography>
                </Box>
                <Typography variant="h6" fontWeight="bold">
                  {formatCurrency(walletBalance, 'GHS')}
                </Typography>
              </Box>
            </Paper>
          )}

          {walletBalance !== null && walletBalance < MIN_WALLET_START_BALANCE && (
            <WalletTopUpAlert variant="sessionStopped" onTopUpClick={onClose} />
          )}
        </>
      )}
    </AdaptiveSheet>
  );
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75, gap: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={bold ? 700 : 500} textAlign="right">
        {value}
      </Typography>
    </Box>
  );
}

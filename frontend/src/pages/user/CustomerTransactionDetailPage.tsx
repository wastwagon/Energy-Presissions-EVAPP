import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Alert,
  Button,
  Divider,
  LinearProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { transactionsApi, Transaction } from '../../services/transactionsApi';
import PaymentIcon from '@mui/icons-material/Payment';
import { PaystackPayment } from '../../components/PaystackPayment';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { AppBadge, chipColorToBadgeTone } from '../../components/ui/AppBadge';
import { premiumPanelCardSx } from '../../theme/jampackShell';
import { compactContainedCtaSx, compactOutlinedCtaSx, sxObject } from '../../styles/authShell';
import { getStoredUser } from '../../utils/authSession';
import { CUSTOMER_ROUTES } from '../../config/customerNav.paths';
import { formatCurrency } from '../../utils/formatters';
import {
  formatSessionCost,
  formatSessionDuration,
  formatSessionEnergy,
  formatSessionReserved,
  sessionStatusChipColor,
  sessionStatusLabel,
} from '../../utils/sessionDisplay';
import { useLiveRefresh } from '../../hooks/useLiveRefresh';
import { useCustomerNavBack } from '../../hooks/useCustomerNavBack';
import { LIVE_DATA_LABELS } from '../../constants/liveDataLabels';
import { CustomerTransactionDetailSkeleton } from '../../components/dashboard/CustomerChromeSkeleton';
import { useCustomerPullRefresh } from '../../contexts/CustomerPullRefreshContext';
import { GroupedListSection } from '../../components/ios/GroupedListSection';
import { GroupedDetailRow } from '../../components/ios/GroupedDetailRow';
import { GroupedListRow } from '../../components/ios/GroupedListRow';
import { UserErrorAlert } from '../../components/UserErrorAlert';
import { formatUserFacingErrorMessage, UserMessages } from '../../utils/userFriendlyErrors';

export function CustomerTransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down('md'));
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const { loading, refreshing, updatedAt, runWithRefresh } = useLiveRefresh();
  const [error, setError] = useState<string | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const loadTransaction = useCallback(async (silent?: boolean) => {
    await runWithRefresh(async () => {
      try {
        setError(null);
        const txId = Number(id);
        if (!Number.isFinite(txId)) {
          setError(UserMessages.loadTransactionFailed);
          return false;
        }
        const tx = await transactionsApi.getById(txId);
        const user = getStoredUser();
        if (typeof user?.id !== 'number' || tx.userId !== user.id) {
          setError(UserMessages.loadTransactionFailed);
          return false;
        }
        setTransaction(tx);
        return true;
      } catch (err: unknown) {
        setError(formatUserFacingErrorMessage(err, 'sessions'));
        console.error('Error loading transaction:', err);
        return false;
      }
    }, silent);
  }, [id, runWithRefresh]);

  useEffect(() => {
    if (!id) return;
    void loadTransaction();
  }, [id, loadTransaction]);

  useCustomerPullRefresh(useCallback(() => void loadTransaction(true), [loadTransaction]));

  const goBack = useCallback(() => navigate(CUSTOMER_ROUTES.sessionsHistory), [navigate]);
  useCustomerNavBack(goBack, 'Back to session history');

  const backButton = !isCompact ? (
    <Button
      startIcon={<ArrowBackIcon />}
      onClick={goBack}
      sx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), width: { xs: '100%', sm: 'auto' } })}
    >
      Back
    </Button>
  ) : null;

  if (loading) {
    return <CustomerTransactionDetailSkeleton />;
  }

  if (error || !transaction) {
    return (
      <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
        <LivePageHeader
          title="Transaction"
          subtitle="Session details"
          updatedAt={null}
          refreshing={refreshing}
          onRefresh={() => void loadTransaction(true)}
          titleVariant="large"
          containerSx={{ mb: 2 }}
          actions={backButton}
        />
        <UserErrorAlert
          error={error || UserMessages.loadTransactionFailed}
          context="sessions"
          sx={{ mb: 3 }}
        />
      </Box>
    );
  }

  const statusLabel = sessionStatusLabel(transaction);
  const statusChip = (
    <AppBadge
      label={statusLabel}
      tone={chipColorToBadgeTone(sessionStatusChipColor(statusLabel))}
      size="small"
    />
  );

  const payCta =
    transaction.status === 'Completed' && transaction.totalCost ? (
      <Button
        variant="contained"
        disableElevation
        startIcon={<PaymentIcon />}
        onClick={() => setPaymentDialogOpen(true)}
        sx={(th) => ({
          ...sxObject(th, compactContainedCtaSx),
          width: { xs: '100%', sm: 'auto' },
          mt: 1,
        })}
      >
        Pay now
      </Button>
    ) : null;

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      {refreshing && (
        <LinearProgress sx={{ mb: 2, borderRadius: 1 }} aria-label="Updating transaction details" />
      )}

      <LivePageHeader
        title="Transaction"
        subtitle={`ID ${transaction.transactionId}`}
        updatedAt={updatedAt}
        liveLabel={LIVE_DATA_LABELS.transaction}
        refreshing={refreshing}
        onRefresh={() => void loadTransaction(true)}
        titleVariant="large"
        containerSx={{ mb: 2 }}
        actions={backButton}
      />

      {isCompact ? (
        <>
          <GroupedListSection title="Charging session">
            <GroupedDetailRow label="Charge point" value={transaction.chargePointId} divider />
            <GroupedDetailRow label="Connector" value={transaction.connectorId} divider />
            <GroupedDetailRow label="Status" value={statusChip} divider />
            <GroupedDetailRow label="Energy" value={formatSessionEnergy(transaction)} divider />
            <GroupedDetailRow label="Duration" value={formatSessionDuration(transaction)} divider />
            {transaction.status === 'Active' && (
              <GroupedDetailRow label="Purchased (max)" value={formatSessionReserved(transaction)} divider />
            )}
            <GroupedDetailRow
              label="Start"
              value={new Date(transaction.startTime).toLocaleString()}
              divider={Boolean(transaction.stopTime)}
            />
            {transaction.stopTime && (
              <GroupedDetailRow label="End" value={new Date(transaction.stopTime).toLocaleString()} />
            )}
          </GroupedListSection>

          <GroupedListSection title="Payment">
            <Box sx={{ px: 2, py: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Total cost
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main', my: 0.75 }}>
                {formatSessionCost(transaction)}
              </Typography>
              {payCta}
            </Box>
          </GroupedListSection>

          <GroupedListSection>
            <GroupedListRow
              primary="View charge point"
              onClick={() => navigate(`${CUSTOMER_ROUTES.stations}/${transaction.chargePointId}`)}
              divider
            />
            {!isCompact && (
              <GroupedListRow
                primary="Back to history"
                onClick={() => navigate(CUSTOMER_ROUTES.sessionsHistory)}
                showChevron={false}
              />
            )}
          </GroupedListSection>
        </>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper elevation={0} sx={premiumPanelCardSx}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 3 }}>
                Charging session
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Charge point
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.25 }}>
                    {transaction.chargePointId}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Connector
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.25 }}>
                    {transaction.connectorId}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Status
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>{statusChip}</Box>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Energy consumed
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.25 }}>
                    {formatSessionEnergy(transaction)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Duration
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.25 }}>
                    {formatSessionDuration(transaction)}
                  </Typography>
                </Grid>
                {transaction.status === 'Active' && (
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      Purchased (max)
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.25 }}>
                      {formatSessionReserved(transaction)}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Start time
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.25 }}>
                    {new Date(transaction.startTime).toLocaleString()}
                  </Typography>
                </Grid>
                {transaction.stopTime && (
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      End time
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.25 }}>
                      {new Date(transaction.stopTime).toLocaleString()}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Box
                sx={(th) => ({
                  mt: 2,
                  p: { xs: 2, sm: 2.25 },
                  borderRadius: 2,
                  border: `1px solid ${alpha(th.palette.primary.main, 0.15)}`,
                  background: `linear-gradient(135deg, ${alpha(th.palette.primary.main, 0.08)} 0%, ${alpha(
                    th.palette.primary.main,
                    0.02,
                  )} 100%)`,
                })}
              >
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Total cost
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', my: 1 }}>
                  {formatSessionCost(transaction)}
                </Typography>
                {payCta}
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={premiumPanelCardSx}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Related
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate(`${CUSTOMER_ROUTES.stations}/${transaction.chargePointId}`)}
                  sx={(th) => sxObject(th, compactOutlinedCtaSx)}
                >
                  View charge point
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate(CUSTOMER_ROUTES.sessionsHistory)}
                  sx={(th) => sxObject(th, compactOutlinedCtaSx)}
                >
                  Back to history
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {paymentDialogOpen && transaction && (
        <PaystackPayment
          open={paymentDialogOpen}
          onClose={() => setPaymentDialogOpen(false)}
          transactionId={transaction.transactionId}
          amount={transaction.totalCost || 0}
          currency={transaction.currency}
          onSuccess={() => {
            setPaymentDialogOpen(false);
            void loadTransaction(true);
          }}
          onError={(err) => setError(err)}
        />
      )}
    </Box>
  );
}

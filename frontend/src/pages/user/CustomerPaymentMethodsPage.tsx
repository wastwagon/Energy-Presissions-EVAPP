import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  IconButton,
  TextField,
  FormControlLabel,
  Radio,
  RadioGroup,
  useTheme,
  useMediaQuery,
  ListItem,
  Divider,
} from '@mui/material';
import { GroupedListSection } from '../../components/ios/GroupedListSection';
import { GroupedListRow } from '../../components/ios/GroupedListRow';
import { SwipeableGroupedListRow } from '../../components/ios/SwipeableGroupedListRow';
import { iosGroupedRowDividerSx } from '../../theme/iosGroupedList';
import { AdaptiveSheet } from '../../components/ios/AdaptiveSheet';
import { useCustomerPullRefresh } from '../../contexts/CustomerPullRefreshContext';
import { triggerHaptic } from '../../utils/haptics';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { paymentMethodsApi, PaymentMethod } from '../../services/paymentMethodsApi';
import {
  authFormFieldSx,
  authPageBodySx,
  compactContainedCtaSx,
  compactErrorContainedCtaSx,
  compactOutlinedCtaSx,
  premiumIconButtonTouchSx,
  sxObject,
} from '../../styles/authShell';
import { getStoredUser } from '../../utils/authSession';
import { useLiveRefresh } from '../../hooks/useLiveRefresh';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { LIVE_DATA_LABELS } from '../../constants/liveDataLabels';
import { CustomerChromeSkeleton } from '../../components/dashboard/CustomerChromeSkeleton';
import { TableSurfaceProgress } from '../../components/dashboard/TableSurfaceProgress';
import { UserErrorAlert } from '../../components/UserErrorAlert';
import { formatUserFacingErrorMessage } from '../../utils/userFriendlyErrors';
import { AppEmptyState } from '../../components/ui/AppEmptyState';
import { CUSTOMER_IMAGES } from '../../config/customerImagery';

export function CustomerPaymentMethodsPage() {
  const theme = useTheme();
  const useGroupedList = useMediaQuery(theme.breakpoints.down('md'));
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const { loading, refreshing, updatedAt, runWithRefresh } = useLiveRefresh();
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newType, setNewType] = useState<'card' | 'mobile_money'>('mobile_money');
  const [newPhone, setNewPhone] = useState('');
  const [newLastFour, setNewLastFour] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const getCurrentUserId = () => {
    const user = getStoredUser();
    return typeof user?.id === 'number' ? user.id : null;
  };

  const loadMethods = useCallback(async (silent?: boolean) => {
    await runWithRefresh(async () => {
      try {
        setError(null);
        const userId = getCurrentUserId();
        if (!userId) return false;
        const data = await paymentMethodsApi.getByUser(userId);
        setMethods(data);
        return true;
      } catch (err: unknown) {
        setError(formatUserFacingErrorMessage(err, 'payments'));
        return false;
      }
    }, silent);
  }, [runWithRefresh]);

  useEffect(() => {
    void loadMethods();
  }, [loadMethods]);

  useCustomerPullRefresh(useCallback(() => void loadMethods(true), [loadMethods]));

  const handleAdd = async () => {
    try {
      setSaving(true);
      setError(null);
      const userId = getCurrentUserId();
      if (!userId) return;
      await paymentMethodsApi.create(userId, {
        type: newType,
        provider: newType === 'mobile_money' ? 'mtn' : 'paystack',
        phone: newType === 'mobile_money' ? newPhone : undefined,
        lastFour: newType === 'card' ? newLastFour : undefined,
        isDefault: methods.length === 0,
      });
      triggerHaptic('success');
      setDialogOpen(false);
      setNewPhone('');
      setNewLastFour('');
      void loadMethods(true);
    } catch (err: unknown) {
      setError(formatUserFacingErrorMessage(err, 'payments'));
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) return;
      await paymentMethodsApi.setDefault(userId, id);
      triggerHaptic('light');
      void loadMethods(true);
    } catch (err: unknown) {
      setError(formatUserFacingErrorMessage(err, 'payments'));
    }
  };

  const handleDelete = (id: number) => {
    setPendingDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (pendingDeleteId == null) return;
    try {
      const userId = getCurrentUserId();
      if (!userId) return;
      await paymentMethodsApi.delete(userId, pendingDeleteId);
      triggerHaptic('success');
      setDeleteDialogOpen(false);
      setPendingDeleteId(null);
      void loadMethods(true);
    } catch (err: unknown) {
      setError(formatUserFacingErrorMessage(err, 'payments'));
    }
  };

  const getProviderLabel = (p?: string) => {
    if (!p) return '';
    const m: Record<string, string> = { mtn: 'MTN', vodafone: 'Vodafone', airteltigo: 'AirtelTigo', paystack: 'Card' };
    return m[p.toLowerCase()] || p;
  };

  if (loading && methods.length === 0) {
    return <CustomerChromeSkeleton preset="paymentMethods" />;
  }

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <LivePageHeader
        title="Payment Methods"
        subtitle="Manage your saved payment methods for quick top-ups"
        updatedAt={updatedAt}
        liveLabel={LIVE_DATA_LABELS.payments}
        refreshing={refreshing}
        onRefresh={() => void loadMethods(true)}
        titleVariant="large"
        refreshSx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), width: { xs: '100%', sm: 'auto' } })}
        actions={
          <Button
            variant="contained"
            disableElevation
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
            sx={(th) => ({
              ...sxObject(th, compactContainedCtaSx),
              width: { xs: '100%', sm: 'auto' },
            })}
          >
            Add method
          </Button>
        }
      />

      {error && (
        <UserErrorAlert error={error} context="payments" sx={{ mb: 3 }} onClose={() => setError(null)} />
      )}

      {methods.length === 0 ? (
        <AppEmptyState
          illustrationSrc={CUSTOMER_IMAGES.walletEnergy}
          illustrationAlt="Wallet payments"
          title="No payment methods yet"
          description="Save mobile money or a card for faster top-ups."
          primaryAction={{
            label: 'Add payment method',
            onClick: () => setDialogOpen(true),
            startIcon: <AddIcon />,
          }}
        />
      ) : useGroupedList ? (
        <Box sx={{ position: 'relative' }}>
          <TableSurfaceProgress active={loading && methods.length > 0} ariaLabel="Loading payment methods" />
          <GroupedListSection title="Saved methods">
            {methods.map((pm, index) => (
              <ListItem key={pm.id} disablePadding sx={{ display: 'block' }}>
                <SwipeableGroupedListRow
                  onDelete={() => handleDelete(pm.id)}
                  deleteAriaLabel="Remove payment method"
                >
                  <GroupedListRow
                    divider={false}
                    showChevron={false}
                    primary={
                      <>
                        {getProviderLabel(pm.provider)}{' '}
                        {pm.type === 'card' && pm.lastFour ? `•••• ${pm.lastFour}` : ''}
                        {pm.type === 'mobile_money' && pm.phone ? pm.phone : ''}
                      </>
                    }
                    secondary={pm.isDefault ? 'Default' : pm.type === 'mobile_money' ? 'Mobile money' : 'Card'}
                    end={
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleSetDefault(pm.id);
                        }}
                        aria-label={pm.isDefault ? 'Default payment method' : 'Set as default payment method'}
                        sx={(th) => ({ ...sxObject(th, premiumIconButtonTouchSx) })}
                      >
                        {pm.isDefault ? <StarIcon color="primary" /> : <StarBorderIcon />}
                      </IconButton>
                    }
                  />
                </SwipeableGroupedListRow>
                {index < methods.length - 1 ? <Divider sx={iosGroupedRowDividerSx} /> : null}
              </ListItem>
            ))}
          </GroupedListSection>
        </Box>
      ) : (
        <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TableSurfaceProgress active={loading && methods.length > 0} ariaLabel="Loading payment methods" />
          {methods.map((pm) => (
            <Paper key={pm.id} elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {getProviderLabel(pm.provider)}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <IconButton onClick={() => handleSetDefault(pm.id)} sx={(th) => sxObject(th, premiumIconButtonTouchSx)}>
                    {pm.isDefault ? <StarIcon color="primary" /> : <StarBorderIcon />}
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDelete(pm.id)} sx={(th) => sxObject(th, premiumIconButtonTouchSx)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      <AdaptiveSheet
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Add payment method"
        disableClose={saving}
        actions={
          <>
            <Button onClick={() => setDialogOpen(false)} disabled={saving} sx={(th) => sxObject(th, compactOutlinedCtaSx)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              disableElevation
              onClick={handleAdd}
              disabled={saving || (newType === 'mobile_money' ? !newPhone.trim() : newLastFour.length !== 4)}
              sx={(th) => sxObject(th, compactContainedCtaSx)}
            >
              {saving ? 'Adding…' : 'Add'}
            </Button>
          </>
        }
      >
        <RadioGroup value={newType} onChange={(e) => setNewType(e.target.value as 'card' | 'mobile_money')} sx={{ my: 1 }}>
          <FormControlLabel value="mobile_money" control={<Radio />} label="Mobile money" />
          <FormControlLabel value="card" control={<Radio />} label="Card (last 4 digits)" />
        </RadioGroup>
        {newType === 'mobile_money' && (
          <TextField
            fullWidth
            label="Phone number"
            placeholder="0244123456"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            sx={(th) => ({ ...sxObject(th, authFormFieldSx), mt: 2 })}
          />
        )}
        {newType === 'card' && (
          <TextField
            fullWidth
            label="Last 4 digits"
            placeholder="4242"
            value={newLastFour}
            onChange={(e) => setNewLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))}
            inputProps={{ maxLength: 4 }}
            sx={(th) => ({ ...sxObject(th, authFormFieldSx), mt: 2 })}
          />
        )}
      </AdaptiveSheet>

      <AdaptiveSheet
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title="Remove payment method?"
        maxWidth="xs"
        actions={
          <>
            <Button onClick={() => setDeleteDialogOpen(false)} sx={(th) => sxObject(th, compactOutlinedCtaSx)}>
              Cancel
            </Button>
            <Button onClick={confirmDelete} variant="contained" disableElevation sx={(th) => sxObject(th, compactErrorContainedCtaSx)}>
              Remove
            </Button>
          </>
        }
      >
        <Typography component="p" sx={authPageBodySx}>
          This saved payment method will be removed from your account.
        </Typography>
      </AdaptiveSheet>
    </Box>
  );
}

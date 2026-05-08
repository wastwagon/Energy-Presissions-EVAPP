import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField,
  FormControlLabel,
  Radio,
  RadioGroup,
} from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PhoneIcon from '@mui/icons-material/Phone';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { paymentMethodsApi, PaymentMethod } from '../../services/paymentMethodsApi';
import {
  dashboardPageTitleSx,
  dashboardPageSubtitleSx,
  premiumEmptyStatePaperSx,
  premiumTableSurfaceSx,
} from '../../theme/jampackShell';
import {
  authFormFieldSx,
  compactContainedCtaSx,
  compactErrorContainedCtaSx,
  compactOutlinedCtaSx,
  premiumDialogPaperSx,
  premiumIconButtonTouchSx,
  sxObject,
} from '../../styles/authShell';
import { getStoredUser } from '../../utils/authSession';
import { useLiveRefresh } from '../../hooks/useLiveRefresh';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { LIVE_DATA_LABELS } from '../../constants/liveDataLabels';
import { CustomerChromeSkeleton } from '../../components/dashboard/CustomerChromeSkeleton';
import { TableSurfaceProgress } from '../../components/dashboard/TableSurfaceProgress';

export function CustomerPaymentMethodsPage() {
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
      } catch (err: any) {
        setError(err.message || 'Failed to load payment methods');
        return false;
      }
    }, silent);
  }, [runWithRefresh]);

  useEffect(() => {
    void loadMethods();
  }, [loadMethods]);

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
      setDialogOpen(false);
      setNewPhone('');
      setNewLastFour('');
      void loadMethods(true);
    } catch (err: any) {
      setError(err.message || 'Failed to add payment method');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) return;
      await paymentMethodsApi.setDefault(userId, id);
      void loadMethods(true);
    } catch (err: any) {
      setError(err.message || 'Failed to set default');
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
      setDeleteDialogOpen(false);
      setPendingDeleteId(null);
      void loadMethods(true);
    } catch (err: any) {
      setError(err.message || 'Failed to remove');
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
        titleSx={dashboardPageTitleSx}
        subtitleSx={dashboardPageSubtitleSx}
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
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {methods.length === 0 ? (
        <Paper elevation={0} sx={premiumEmptyStatePaperSx}>
          <Box
            sx={(theme) => ({
              width: 72,
              height: 72,
              mx: 'auto',
              mb: 2,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: theme.palette.action.hover,
              color: 'text.secondary',
            })}
          >
            <CreditCardIcon sx={{ fontSize: 36 }} />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            No payment methods saved
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add a mobile money number or card for faster wallet top-ups.
          </Typography>
          <Button
            variant="contained"
            disableElevation
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
            sx={(th) => ({ ...sxObject(th, compactContainedCtaSx), width: { xs: '100%', sm: 'auto' } })}
          >
            Add payment method
          </Button>
        </Paper>
      ) : (
        <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TableSurfaceProgress active={loading && methods.length > 0} ariaLabel="Loading payment methods" />
          {methods.map((pm) => (
            <Paper key={pm.id} elevation={0} sx={premiumTableSurfaceSx}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  flexWrap: 'wrap',
                  p: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
                  <Box
                    sx={(theme) => ({
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: theme.palette.action.hover,
                      color: 'text.secondary',
                      flexShrink: 0,
                    })}
                  >
                    {pm.type === 'mobile_money' ? <PhoneIcon fontSize="small" /> : <CreditCardIcon fontSize="small" />}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {getProviderLabel(pm.provider)} {pm.type === 'card' && pm.lastFour && `•••• ${pm.lastFour}`}
                      {pm.type === 'mobile_money' && pm.phone && ` ${pm.phone}`}
                    </Typography>
                    {pm.isDefault && (
                      <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
                        Default
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5, ml: { xs: 'auto', sm: 0 } }}>
                  <IconButton
                    onClick={() => handleSetDefault(pm.id)}
                    title={pm.isDefault ? 'Default' : 'Set as default'}
                    aria-label={pm.isDefault ? 'Default payment method' : 'Set as default payment method'}
                    sx={(th) => ({ ...sxObject(th, premiumIconButtonTouchSx) })}
                  >
                    {pm.isDefault ? <StarIcon color="primary" /> : <StarBorderIcon />}
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(pm.id)}
                    aria-label="Remove payment method"
                    sx={(th) => ({ ...sxObject(th, premiumIconButtonTouchSx) })}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: (th) => sxObject(th, premiumDialogPaperSx) }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem' }}>Add payment method</DialogTitle>
        <DialogContent>
          <RadioGroup value={newType} onChange={(e) => setNewType(e.target.value as 'card' | 'mobile_money')} sx={{ my: 2 }}>
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
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, flexWrap: 'wrap', gap: 1 }}>
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
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: (th) => sxObject(th, premiumDialogPaperSx) }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem' }}>Remove payment method?</DialogTitle>
        <DialogContent>
          <DialogContentText component="div">This saved payment method will be removed from your account.</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, flexWrap: 'wrap', gap: 1 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={(th) => sxObject(th, compactOutlinedCtaSx)}>
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            disableElevation
            sx={(th) => sxObject(th, compactErrorContainedCtaSx)}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Button,
  CircularProgress,
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
import { dashboardPageTitleSx, dashboardPageSubtitleSx } from '../../theme/jampackShell';
import { getStoredUser } from '../../utils/authSession';

export function CustomerPaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newType, setNewType] = useState<'card' | 'mobile_money'>('mobile_money');
  const [newPhone, setNewPhone] = useState('');
  const [newLastFour, setNewLastFour] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  useEffect(() => {
    loadMethods();
  }, []);

  const getCurrentUserId = () => {
    const user = getStoredUser();
    return typeof user?.id === 'number' ? user.id : null;
  };

  const loadMethods = async () => {
    try {
      setError(null);
      const userId = getCurrentUserId();
      if (!userId) return;
      const data = await paymentMethodsApi.getByUser(userId);
      setMethods(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

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
      loadMethods();
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
      loadMethods();
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
      loadMethods();
    } catch (err: any) {
      setError(err.message || 'Failed to remove');
    }
  };

  const getProviderLabel = (p?: string) => {
    if (!p) return '';
    const m: Record<string, string> = { mtn: 'MTN', vodafone: 'Vodafone', airteltigo: 'AirtelTigo', paystack: 'Card' };
    return m[p.toLowerCase()] || p;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
        <Box sx={{ minWidth: 0, flex: '1 1 220px' }}>
          <Typography variant="h6" component="h1" sx={dashboardPageTitleSx}>
            Payment Methods
          </Typography>
          <Typography variant="body2" sx={dashboardPageSubtitleSx}>
            Manage your saved payment methods for quick top-ups
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Add Method
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {methods.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CreditCardIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No payment methods saved
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add a mobile money number or card for faster wallet top-ups.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
            Add Payment Method
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {methods.map((pm) => (
            <Card key={pm.id} variant="outlined">
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {pm.type === 'mobile_money' ? (
                    <PhoneIcon color="action" />
                  ) : (
                    <CreditCardIcon color="action" />
                  )}
                  <Box>
                    <Typography variant="subtitle1">
                      {getProviderLabel(pm.provider)} {pm.type === 'card' && pm.lastFour && `•••• ${pm.lastFour}`}
                      {pm.type === 'mobile_money' && pm.phone && ` ${pm.phone}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {pm.isDefault ? 'Default' : ''}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleSetDefault(pm.id)}
                    title={pm.isDefault ? 'Default' : 'Set as default'}
                    aria-label={pm.isDefault ? 'Default payment method' : 'Set as default payment method'}
                  >
                    {pm.isDefault ? <StarIcon color="primary" /> : <StarBorderIcon />}
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(pm.id)} aria-label="Remove payment method">
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Payment Method</DialogTitle>
        <DialogContent>
          <RadioGroup value={newType} onChange={(e) => setNewType(e.target.value as any)} sx={{ my: 2 }}>
            <FormControlLabel value="mobile_money" control={<Radio />} label="Mobile Money" />
            <FormControlLabel value="card" control={<Radio />} label="Card (last 4 digits)" />
          </RadioGroup>
          {newType === 'mobile_money' && (
            <TextField
              fullWidth
              label="Phone Number"
              placeholder="0244123456"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              sx={{ mt: 2 }}
            />
          )}
          {newType === 'card' && (
            <TextField
              fullWidth
              label="Last 4 Digits"
              placeholder="4242"
              value={newLastFour}
              onChange={(e) => setNewLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))}
              inputProps={{ maxLength: 4 }}
              sx={{ mt: 2 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd} disabled={saving || (newType === 'mobile_money' ? !newPhone.trim() : newLastFour.length !== 4)}>
            {saving ? 'Adding...' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Remove payment method?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This saved payment method will be removed from your account.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

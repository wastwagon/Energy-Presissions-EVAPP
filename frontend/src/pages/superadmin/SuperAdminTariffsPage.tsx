import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  IconButton,
  InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { tariffsApi, Tariff, CreateTariffDto } from '../../services/tariffsApi';

export function SuperAdminTariffsPage() {
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTariff, setEditingTariff] = useState<Tariff | null>(null);
  const [formData, setFormData] = useState<CreateTariffDto>({
    name: '',
    description: '',
    currency: 'GHS',
    energyRate: 0,
    timeRate: 0,
    baseFee: 0,
  });

  useEffect(() => {
    loadTariffs();
  }, []);

  const loadTariffs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tariffsApi.getAll();
      setTariffs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load tariffs');
      console.error('Error loading tariffs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (tariff?: Tariff) => {
    if (tariff) {
      setEditingTariff(tariff);
      setFormData({
        name: tariff.name,
        description: tariff.description || '',
        currency: 'GHS', // Always GHS for Ghana operations
        energyRate: tariff.energyRate || tariff.energyPrice || 0,
        timeRate: tariff.timeRate || tariff.timePrice || 0,
        baseFee: tariff.baseFee || 0,
      });
    } else {
      setEditingTariff(null);
      setFormData({
        name: '',
        description: '',
        currency: 'GHS',
        energyRate: 0,
        timeRate: 0,
        baseFee: 0,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTariff(null);
  };

  const handleSave = async () => {
    try {
      setError(null);
      const saveData = {
        ...formData,
        currency: 'GHS', // Always GHS for Ghana operations
      };
      if (editingTariff) {
        await tariffsApi.update(editingTariff.id, saveData);
      } else {
        await tariffsApi.create(saveData);
      }
      handleCloseDialog();
      loadTariffs();
    } catch (err: any) {
      setError(err.message || 'Failed to save tariff');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this tariff?')) {
      return;
    }
    try {
      await tariffsApi.delete(id);
      loadTariffs();
    } catch (err: any) {
      setError(err.message || 'Failed to delete tariff');
    }
  };

  const handleToggleActive = async (tariff: Tariff) => {
    try {
      await tariffsApi.update(tariff.id, { isActive: !tariff.isActive });
      loadTariffs();
    } catch (err: any) {
      setError(err.message || 'Failed to update tariff');
    }
  };

  const formatCurrency = (amount: number, currency: string = 'GHS') => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency,
    }).format(amount);
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
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
            Tariffs & Pricing
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage system-wide pricing and tariff plans
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          New Tariff
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Energy Price</TableCell>
              <TableCell>Time Price</TableCell>
              <TableCell>Base Fee</TableCell>
              <TableCell>Currency</TableCell>
              <TableCell>Vendor</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tariffs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <AttachMoneyIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    No tariffs configured yet
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                    sx={{ mt: 2 }}
                  >
                    Create First Tariff
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              tariffs.map((tariff) => (
                <TableRow key={tariff.id} hover>
                  <TableCell>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {tariff.name}
                    </Typography>
                    {tariff.description && (
                      <Typography variant="caption" color="text.secondary">
                        {tariff.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(tariff.energyRate || tariff.energyPrice || 0, tariff.currency)} / kWh
                  </TableCell>
                  <TableCell>
                    {tariff.timeRate || tariff.timePrice
                      ? `${formatCurrency(tariff.timeRate || tariff.timePrice || 0, tariff.currency)} / hour`
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {tariff.baseFee
                      ? `${formatCurrency(tariff.baseFee, tariff.currency)}`
                      : '-'}
                  </TableCell>
                  <TableCell>{tariff.currency}</TableCell>
                  <TableCell>{tariff.vendorId ? `Vendor ${tariff.vendorId}` : 'System'}</TableCell>
                  <TableCell>
                    <Chip
                      label={tariff.isActive ? 'Active' : 'Inactive'}
                      color={tariff.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleActive(tariff)}
                        color={tariff.isActive ? 'default' : 'primary'}
                      >
                        <Switch checked={tariff.isActive} size="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleOpenDialog(tariff)} color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(tariff.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTariff ? 'Edit Tariff' : 'Create New Tariff'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              fullWidth
              label="Tariff Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={2}
            />
            <TextField
              fullWidth
              label="Energy Rate (per kWh)"
              type="number"
              value={formData.energyRate || formData.energyPrice || 0}
              onChange={(e) => setFormData({ ...formData, energyRate: parseFloat(e.target.value) || 0 })}
              required
              InputProps={{
                startAdornment: <InputAdornment position="start">GHS</InputAdornment>,
              }}
              helperText="Price per kilowatt-hour in GHS"
            />
            <TextField
              fullWidth
              label="Time Rate (per hour, optional)"
              type="number"
              value={formData.timeRate || formData.timePrice || 0}
              onChange={(e) => setFormData({ ...formData, timeRate: parseFloat(e.target.value) || 0 })}
              InputProps={{
                startAdornment: <InputAdornment position="start">GHS</InputAdornment>,
              }}
              helperText="Price per hour in GHS"
            />
            <TextField
              fullWidth
              label="Base Fee (optional)"
              type="number"
              value={formData.baseFee || 0}
              onChange={(e) => setFormData({ ...formData, baseFee: parseFloat(e.target.value) || 0 })}
              InputProps={{
                startAdornment: <InputAdornment position="start">GHS</InputAdornment>,
              }}
              helperText="Fixed fee per transaction in GHS"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!formData.name || !(formData.energyRate || formData.energyPrice)}>
            {editingTariff ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


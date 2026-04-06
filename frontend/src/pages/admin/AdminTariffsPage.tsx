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
  DialogContentText,
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
import { dashboardPageTitleSx, dashboardPageSubtitleSx, premiumTableSurfaceSx } from '../../theme/jampackShell';
import {
  authFormFieldSx,
  compactContainedCtaSx,
  compactErrorContainedCtaSx,
  compactOutlinedCtaSx,
  premiumDialogPaperSx,
  premiumIconButtonTouchSx,
  sxObject,
} from '../../styles/authShell';
import { formatCurrency } from '../../utils/formatters';
import { useOpsBasePath } from '../../hooks/useOpsBasePath';
import { OpsQuickActions } from '../../components/dashboard/OpsQuickActions';

export function AdminTariffsPage() {
  const opsBase = useOpsBasePath();
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTariff, setEditingTariff] = useState<Tariff | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteTariffId, setPendingDeleteTariffId] = useState<number | null>(null);
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

  const handleDelete = (id: number) => {
    setPendingDeleteTariffId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (pendingDeleteTariffId == null) return;
    try {
      await tariffsApi.delete(pendingDeleteTariffId);
      setDeleteDialogOpen(false);
      setPendingDeleteTariffId(null);
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
        <Box sx={{ minWidth: 0, flex: '1 1 220px' }}>
          <Typography variant="h6" component="h1" sx={dashboardPageTitleSx}>
            Tariffs & Pricing
          </Typography>
          <Typography variant="body2" sx={dashboardPageSubtitleSx}>
            Manage pricing and tariff plans for charging sessions
          </Typography>
        </Box>
        <Button
          variant="contained"
          disableElevation
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={(th) => ({
            ...sxObject(th, compactContainedCtaSx),
            width: { xs: '100%', sm: 'auto' },
            alignSelf: { xs: 'stretch', sm: 'flex-start' },
          })}
        >
          New tariff
        </Button>
      </Box>

      <OpsQuickActions opsBase={opsBase} />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper elevation={0} sx={premiumTableSurfaceSx}>
        <Box sx={{ px: { xs: 2, sm: 2.5 }, py: { xs: 1.75, sm: 2 }, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Tariff plans
          </Typography>
        </Box>
        <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Energy Price</TableCell>
              <TableCell>Time Price</TableCell>
              <TableCell>Base Fee</TableCell>
              <TableCell>Currency</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tariffs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <AttachMoneyIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    No tariffs configured yet
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                    sx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), mt: 2 })}
                  >
                    Create first tariff
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
                  <TableCell>
                    <Chip
                      label={tariff.isActive ? 'Active' : 'Inactive'}
                      color={tariff.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                      <IconButton
                        onClick={() => handleToggleActive(tariff)}
                        color={tariff.isActive ? 'default' : 'primary'}
                        aria-label={`${tariff.isActive ? 'Deactivate' : 'Activate'} tariff ${tariff.name}`}
                        sx={(th) => ({ ...sxObject(th, premiumIconButtonTouchSx) })}
                      >
                        <Switch checked={tariff.isActive} size="small" />
                      </IconButton>
                      <IconButton
                        onClick={() => handleOpenDialog(tariff)}
                        color="primary"
                        aria-label={`Edit tariff ${tariff.name}`}
                        sx={(th) => ({ ...sxObject(th, premiumIconButtonTouchSx) })}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(tariff.id)}
                        color="error"
                        aria-label={`Delete tariff ${tariff.name}`}
                        sx={(th) => ({ ...sxObject(th, premiumIconButtonTouchSx) })}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      </Paper>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: (th) => sxObject(th, premiumDialogPaperSx) }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem' }}>
          {editingTariff ? 'Edit tariff' : 'Create tariff'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              fullWidth
              label="Tariff name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              sx={(th) => sxObject(th, authFormFieldSx)}
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={2}
              sx={(th) => sxObject(th, authFormFieldSx)}
            />
            <TextField
              fullWidth
              label="Energy rate (per kWh)"
              type="number"
              value={formData.energyRate || formData.energyPrice || 0}
              onChange={(e) => setFormData({ ...formData, energyRate: parseFloat(e.target.value) || 0 })}
              required
              InputProps={{
                startAdornment: <InputAdornment position="start">GHS</InputAdornment>,
              }}
              helperText="Price per kilowatt-hour in GHS"
              sx={(th) => sxObject(th, authFormFieldSx)}
            />
            <TextField
              fullWidth
              label="Time rate (per hour, optional)"
              type="number"
              value={formData.timeRate || formData.timePrice || 0}
              onChange={(e) => setFormData({ ...formData, timeRate: parseFloat(e.target.value) || 0 })}
              InputProps={{
                startAdornment: <InputAdornment position="start">GHS</InputAdornment>,
              }}
              helperText="Price per hour in GHS"
              sx={(th) => sxObject(th, authFormFieldSx)}
            />
            <TextField
              fullWidth
              label="Base fee (optional)"
              type="number"
              value={formData.baseFee || 0}
              onChange={(e) => setFormData({ ...formData, baseFee: parseFloat(e.target.value) || 0 })}
              InputProps={{
                startAdornment: <InputAdornment position="start">GHS</InputAdornment>,
              }}
              helperText="Fixed fee per transaction in GHS"
              sx={(th) => sxObject(th, authFormFieldSx)}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, flexWrap: 'wrap', gap: 1 }}>
          <Button onClick={handleCloseDialog} sx={(th) => sxObject(th, compactOutlinedCtaSx)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disableElevation
            onClick={handleSave}
            disabled={!formData.name || !(formData.energyRate || formData.energyPrice)}
            sx={(th) => sxObject(th, compactContainedCtaSx)}
          >
            {editingTariff ? 'Update' : 'Create'}
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
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem' }}>Delete tariff?</DialogTitle>
        <DialogContent>
          <DialogContentText component="div">This action cannot be undone.</DialogContentText>
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
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


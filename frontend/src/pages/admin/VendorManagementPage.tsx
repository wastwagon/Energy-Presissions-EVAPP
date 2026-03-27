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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Grid,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import LoginIcon from '@mui/icons-material/Login';
import { vendorApi, Vendor, VendorStatus, VendorDisablement } from '../../services/vendorApi';

export function VendorManagementPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [newStatus, setNewStatus] = useState<VendorStatus>('active');
  const [reason, setReason] = useState('');
  const [history, setHistory] = useState<VendorDisablement[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // Form state for create/edit
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    domain: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
  });

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      setError(null);
      const data = await vendorApi.getAll();
      setVendors(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setNewStatus(vendor.status);
    setReason('');
    setStatusDialogOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedVendor) return;

    try {
      setError(null);
      await vendorApi.changeStatus(selectedVendor.id, { status: newStatus, reason: reason || undefined });
      setSuccess(`Vendor status changed to ${newStatus}`);
      setStatusDialogOpen(false);
      loadVendors();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to change vendor status');
    }
  };

  const handleViewHistory = async (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setHistoryLoading(true);
    setHistoryDialogOpen(true);

    try {
      const statusInfo = await vendorApi.getStatus(vendor.id);
      setHistory(statusInfo.history || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCreateVendor = () => {
    setFormData({
      name: '',
      slug: '',
      domain: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
    });
    setCreateDialogOpen(true);
  };

  const handleEditVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setFormData({
      name: vendor.name,
      slug: vendor.slug || vendor.name.toLowerCase().replace(/\s+/g, '-'),
      domain: vendor.domain || '',
      contactEmail: vendor.contactEmail || '',
      contactPhone: vendor.contactPhone || '',
      address: vendor.address || '',
    });
    setEditDialogOpen(true);
  };

  const handleDeleteVendor = async (vendor: Vendor) => {
    if (!window.confirm(`Are you sure you want to delete vendor "${vendor.name}"? This will disable the vendor.`)) {
      return;
    }

    try {
      setError(null);
      await vendorApi.delete(vendor.id);
      setSuccess(`Vendor "${vendor.name}" has been disabled`);
      loadVendors();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to delete vendor');
    }
  };

  const confirmCreateVendor = async () => {
    try {
      setError(null);
      await vendorApi.create(formData);
      setSuccess('Vendor created successfully');
      setCreateDialogOpen(false);
      loadVendors();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create vendor');
    }
  };

  const confirmEditVendor = async () => {
    if (!selectedVendor) return;

    try {
      setError(null);
      await vendorApi.update(selectedVendor.id, formData);
      setSuccess('Vendor updated successfully');
      setEditDialogOpen(false);
      loadVendors();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update vendor');
    }
  };

  const handleLoginAsVendor = async (vendor: Vendor) => {
    if (!window.confirm(`Login as vendor "${vendor.name}"? You will be switched to this vendor's account.`)) {
      return;
    }

    try {
      setError(null);
      const result = await vendorApi.loginAsVendor(vendor.id);
      
      // Store vendor context in localStorage for the session
      localStorage.setItem('currentVendorId', vendor.id.toString());
      localStorage.setItem('currentVendorName', vendor.name);
      localStorage.setItem('isImpersonating', 'true');
      
      // Show success message
      setSuccess(result.message || `Successfully logged in as ${vendor.name}`);
      
      // Redirect to operations dashboard (vendor-specific view) - use current path context
      const basePath = window.location.pathname.startsWith('/superadmin') ? '/superadmin' : '/admin';
      setTimeout(() => {
        window.location.href = `${basePath}/ops`;
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to login as vendor');
    }
  };

  const getStatusColor = (status: VendorStatus) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'suspended':
        return 'warning';
      case 'disabled':
        return 'error';
      default:
        return 'default';
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
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, gap: 2 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, fontSize: { xs: '1.75rem', sm: '2rem' }, minWidth: 0, flex: '1 1 200px' }}>
          Vendor Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateVendor}
          sx={{ width: { xs: '100%', sm: 'auto' }, alignSelf: { xs: 'stretch', sm: 'auto' } }}
        >
          Create Vendor
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Paper sx={{ overflow: 'hidden' }}>
        <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Domain</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Contact Email</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vendors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      No vendors found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                vendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell>{vendor.id}</TableCell>
                    <TableCell>{vendor.name}</TableCell>
                    <TableCell>{vendor.domain || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={vendor.status}
                        color={getStatusColor(vendor.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{vendor.contactEmail || '-'}</TableCell>
                    <TableCell>
                      {new Date(vendor.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Tooltip title="Login as Vendor">
                          <IconButton
                            size="small"
                            onClick={() => handleLoginAsVendor(vendor)}
                            color="success"
                            disabled={vendor.status !== 'active'}
                          >
                            <LoginIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Vendor">
                          <IconButton
                            size="small"
                            onClick={() => handleEditVendor(vendor)}
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Change Status">
                          <IconButton
                            size="small"
                            onClick={() => handleStatusChange(vendor)}
                            color="default"
                          >
                            <Chip
                              label={vendor.status}
                              color={getStatusColor(vendor.status) as any}
                              size="small"
                              sx={{ cursor: 'pointer', minWidth: 80 }}
                            />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View History">
                          <IconButton
                            size="small"
                            onClick={() => handleViewHistory(vendor)}
                            color="default"
                          >
                            <HistoryIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Vendor">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteVendor(vendor)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Vendor Status</DialogTitle>
        <DialogContent>
          {selectedVendor && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Vendor: <strong>{selectedVendor.name}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                Current Status: <strong>{selectedVendor.status}</strong>
              </Typography>

              <TextField
                select
                label="New Status"
                fullWidth
                margin="normal"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as VendorStatus)}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
                <MenuItem value="disabled">Disabled</MenuItem>
              </TextField>

              <TextField
                label="Reason (optional)"
                fullWidth
                margin="normal"
                multiline
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for status change..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmStatusChange}
            variant="contained"
            color={newStatus === 'disabled' ? 'error' : newStatus === 'suspended' ? 'warning' : 'primary'}
          >
            Change Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* History Dialog */}
      <Dialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Status History - {selectedVendor?.name}
        </DialogTitle>
        <DialogContent>
          {historyLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : history.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              No status history available
            </Typography>
          ) : (
            <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Status</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Effective At</TableCell>
                    <TableCell>Lifted At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Chip
                          label={item.status}
                          color={getStatusColor(item.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{item.reason || '-'}</TableCell>
                      <TableCell>
                        {new Date(item.effectiveAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {item.liftedAt ? new Date(item.liftedAt).toLocaleString() : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Create Vendor Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Vendor</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Vendor Name"
                  fullWidth
                  required
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    // Auto-generate slug from name
                    setFormData((prev) => ({
                      ...prev,
                      slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                    }));
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Slug (URL-friendly identifier)"
                  fullWidth
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  helperText="Used in URLs (e.g., 'vendor-name')"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Domain (optional)"
                  fullWidth
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  helperText="Custom domain for white-label portal (e.g., 'vendor1.evcharging.com')"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Contact Email"
                  fullWidth
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Contact Phone"
                  fullWidth
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Address"
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmCreateVendor}
            variant="contained"
            disabled={!formData.name || !formData.slug}
          >
            Create Vendor
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Vendor Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Vendor</DialogTitle>
        <DialogContent>
          {selectedVendor && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Vendor Name"
                    fullWidth
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Slug (URL-friendly identifier)"
                    fullWidth
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    helperText="Used in URLs (e.g., 'vendor-name')"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Domain (optional)"
                    fullWidth
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    helperText="Custom domain for white-label portal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Contact Email"
                    fullWidth
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Contact Phone"
                    fullWidth
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Address"
                    fullWidth
                    multiline
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmEditVendor}
            variant="contained"
            disabled={!formData.name || !formData.slug}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


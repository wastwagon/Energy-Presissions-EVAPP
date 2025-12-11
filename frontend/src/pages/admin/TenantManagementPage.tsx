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
import { tenantApi, Tenant, TenantStatus, TenantDisablement } from '../../services/tenantApi';

export function TenantManagementPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [newStatus, setNewStatus] = useState<TenantStatus>('active');
  const [reason, setReason] = useState('');
  const [history, setHistory] = useState<TenantDisablement[]>([]);
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
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setError(null);
      const data = await tenantApi.getAll();
      setTenants(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setNewStatus(tenant.status);
    setReason('');
    setStatusDialogOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedTenant) return;

    try {
      setError(null);
      await tenantApi.changeStatus(selectedTenant.id, newStatus, reason || undefined);
      setSuccess(`Tenant status changed to ${newStatus}`);
      setStatusDialogOpen(false);
      loadTenants();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to change tenant status');
    }
  };

  const handleViewHistory = async (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setHistoryLoading(true);
    setHistoryDialogOpen(true);

    try {
      const statusInfo = await tenantApi.getStatus(tenant.id);
      setHistory(statusInfo.history || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCreateTenant = () => {
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

  const handleEditTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setFormData({
      name: tenant.name,
      slug: tenant.slug || tenant.name.toLowerCase().replace(/\s+/g, '-'),
      domain: tenant.domain || '',
      contactEmail: tenant.contactEmail || '',
      contactPhone: tenant.contactPhone || '',
      address: tenant.address || '',
    });
    setEditDialogOpen(true);
  };

  const handleDeleteTenant = async (tenant: Tenant) => {
    if (!window.confirm(`Are you sure you want to delete tenant "${tenant.name}"? This will disable the tenant.`)) {
      return;
    }

    try {
      setError(null);
      await tenantApi.delete(tenant.id);
      setSuccess(`Tenant "${tenant.name}" has been disabled`);
      loadTenants();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to delete tenant');
    }
  };

  const confirmCreateTenant = async () => {
    try {
      setError(null);
      await tenantApi.create(formData);
      setSuccess('Tenant created successfully');
      setCreateDialogOpen(false);
      loadTenants();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create tenant');
    }
  };

  const confirmEditTenant = async () => {
    if (!selectedTenant) return;

    try {
      setError(null);
      await tenantApi.update(selectedTenant.id, formData);
      setSuccess('Tenant updated successfully');
      setEditDialogOpen(false);
      loadTenants();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update tenant');
    }
  };

  const handleLoginAsTenant = async (tenant: Tenant) => {
    if (!window.confirm(`Login as tenant "${tenant.name}"? You will be switched to this tenant's account.`)) {
      return;
    }

    try {
      setError(null);
      const result = await tenantApi.loginAsTenant(tenant.id);
      
      // Store tenant context in localStorage for the session
      localStorage.setItem('currentTenantId', tenant.id.toString());
      localStorage.setItem('currentTenantName', tenant.name);
      localStorage.setItem('isImpersonating', 'true');
      
      // Show success message
      setSuccess(result.message || `Successfully logged in as ${tenant.name}`);
      
      // Redirect to operations dashboard (tenant-specific view) after a short delay
      setTimeout(() => {
        window.location.href = '/ops';
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to login as tenant');
    }
  };

  const getStatusColor = (status: TenantStatus) => {
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Tenant Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateTenant}
        >
          Create Tenant
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

      <Paper>
        <TableContainer>
          <Table>
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
              {tenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      No tenants found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>{tenant.id}</TableCell>
                    <TableCell>{tenant.name}</TableCell>
                    <TableCell>{tenant.domain || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={tenant.status}
                        color={getStatusColor(tenant.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{tenant.contactEmail || '-'}</TableCell>
                    <TableCell>
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Tooltip title="Login as Tenant">
                          <IconButton
                            size="small"
                            onClick={() => handleLoginAsTenant(tenant)}
                            color="success"
                            disabled={tenant.status !== 'active'}
                          >
                            <LoginIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Tenant">
                          <IconButton
                            size="small"
                            onClick={() => handleEditTenant(tenant)}
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Change Status">
                          <IconButton
                            size="small"
                            onClick={() => handleStatusChange(tenant)}
                            color="default"
                          >
                            <Chip
                              label={tenant.status}
                              color={getStatusColor(tenant.status) as any}
                              size="small"
                              sx={{ cursor: 'pointer', minWidth: 80 }}
                            />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View History">
                          <IconButton
                            size="small"
                            onClick={() => handleViewHistory(tenant)}
                            color="default"
                          >
                            <HistoryIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Tenant">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteTenant(tenant)}
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
        <DialogTitle>Change Tenant Status</DialogTitle>
        <DialogContent>
          {selectedTenant && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Tenant: <strong>{selectedTenant.name}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                Current Status: <strong>{selectedTenant.status}</strong>
              </Typography>

              <TextField
                select
                label="New Status"
                fullWidth
                margin="normal"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as TenantStatus)}
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
          Status History - {selectedTenant?.name}
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
            <TableContainer>
              <Table size="small">
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

      {/* Create Tenant Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Tenant</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Tenant Name"
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
                  helperText="Used in URLs (e.g., 'tenant-name')"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Domain (optional)"
                  fullWidth
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  helperText="Custom domain for white-label portal (e.g., 'tenant1.evcharging.com')"
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
            onClick={confirmCreateTenant}
            variant="contained"
            disabled={!formData.name || !formData.slug}
          >
            Create Tenant
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Tenant Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Tenant</DialogTitle>
        <DialogContent>
          {selectedTenant && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Tenant Name"
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
                    helperText="Used in URLs (e.g., 'tenant-name')"
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
            onClick={confirmEditTenant}
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


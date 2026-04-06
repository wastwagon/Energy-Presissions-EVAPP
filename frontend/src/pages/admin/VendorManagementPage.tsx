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
  DialogContentText,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Grid,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import HistoryIcon from '@mui/icons-material/History';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import LoginIcon from '@mui/icons-material/Login';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { vendorApi, Vendor, VendorStatus, VendorDisablement } from '../../services/vendorApi';
import { dashboardPageTitleSx, dashboardPageSubtitleSx, premiumTableSurfaceSx } from '../../theme/jampackShell';
import {
  authFormFieldSx,
  compactContainedCtaSx,
  compactErrorContainedCtaSx,
  compactOutlinedCtaSx,
  compactWarningContainedCtaSx,
  premiumDialogPaperSx,
  premiumIconButtonTouchSx,
  sxObject,
} from '../../styles/authShell';
import { getVendorStatusColor } from '../../utils/statusColors';

export function VendorManagementPage() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loginAsDialogOpen, setLoginAsDialogOpen] = useState(false);
  const [pendingDeleteVendor, setPendingDeleteVendor] = useState<Vendor | null>(null);
  const [pendingLoginVendor, setPendingLoginVendor] = useState<Vendor | null>(null);
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

  const handleDeleteVendor = (vendor: Vendor) => {
    setPendingDeleteVendor(vendor);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteVendor = async () => {
    if (!pendingDeleteVendor) return;
    try {
      setError(null);
      await vendorApi.delete(pendingDeleteVendor.id);
      setSuccess(`Vendor "${pendingDeleteVendor.name}" has been disabled`);
      setDeleteDialogOpen(false);
      setPendingDeleteVendor(null);
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

  const handleLoginAsVendor = (vendor: Vendor) => {
    setPendingLoginVendor(vendor);
    setLoginAsDialogOpen(true);
  };

  const confirmLoginAsVendor = async () => {
    if (!pendingLoginVendor) return;
    try {
      setError(null);
      const result = await vendorApi.loginAsVendor(pendingLoginVendor.id);
      
      // Store vendor context in localStorage for the session
      localStorage.setItem('currentVendorId', pendingLoginVendor.id.toString());
      localStorage.setItem('currentVendorName', pendingLoginVendor.name);
      localStorage.setItem('isImpersonating', 'true');
      
      // Show success message
      setSuccess(result.message || `Successfully logged in as ${pendingLoginVendor.name}`);
      setLoginAsDialogOpen(false);
      setPendingLoginVendor(null);
      
      // Redirect to operations dashboard (vendor-specific view) - use current path context
      const basePath = window.location.pathname.startsWith('/superadmin') ? '/superadmin' : '/admin';
      setTimeout(() => {
        navigate(`${basePath}/ops`);
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to login as vendor');
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
        <Box sx={{ minWidth: 0, flex: '1 1 220px' }}>
          <Typography variant="h6" component="h1" sx={dashboardPageTitleSx}>
            Vendor Management
          </Typography>
          <Typography variant="body2" sx={dashboardPageSubtitleSx}>
            Manage vendor accounts, status, and impersonation access.
          </Typography>
        </Box>
        <Button
          variant="contained"
          disableElevation
          startIcon={<AddIcon />}
          onClick={handleCreateVendor}
          sx={(th) => ({
            ...sxObject(th, compactContainedCtaSx),
            width: { xs: '100%', sm: 'auto' },
            alignSelf: { xs: 'stretch', sm: 'auto' },
          })}
        >
          Create vendor
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

      <Paper elevation={0} sx={premiumTableSurfaceSx}>
        <Box sx={{ px: { xs: 2, sm: 2.5 }, py: { xs: 1.75, sm: 2 }, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Vendors ({vendors.length})
          </Typography>
        </Box>
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
                        color={getVendorStatusColor(vendor.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{vendor.contactEmail || '-'}</TableCell>
                    <TableCell>
                      {new Date(vendor.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Tooltip title="Login as vendor">
                          <IconButton
                            onClick={() => handleLoginAsVendor(vendor)}
                            color="success"
                            disabled={vendor.status !== 'active'}
                            aria-label={`Login as vendor ${vendor.name}`}
                            sx={(th) => ({ ...sxObject(th, premiumIconButtonTouchSx) })}
                          >
                            <LoginIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit vendor">
                          <IconButton
                            onClick={() => handleEditVendor(vendor)}
                            color="primary"
                            aria-label={`Edit vendor ${vendor.name}`}
                            sx={(th) => ({ ...sxObject(th, premiumIconButtonTouchSx) })}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Change status">
                          <IconButton
                            onClick={() => handleStatusChange(vendor)}
                            color="default"
                            aria-label={`Change status for vendor ${vendor.name}`}
                            sx={(th) => ({ ...sxObject(th, premiumIconButtonTouchSx) })}
                          >
                            <SwapHorizIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View history">
                          <IconButton
                            onClick={() => handleViewHistory(vendor)}
                            color="default"
                            aria-label={`View history for vendor ${vendor.name}`}
                            sx={(th) => ({ ...sxObject(th, premiumIconButtonTouchSx) })}
                          >
                            <HistoryIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Disable vendor">
                          <IconButton
                            onClick={() => handleDeleteVendor(vendor)}
                            color="error"
                            aria-label={`Delete vendor ${vendor.name}`}
                            sx={(th) => ({ ...sxObject(th, premiumIconButtonTouchSx) })}
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
      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: (th) => sxObject(th, premiumDialogPaperSx) }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem' }}>Change vendor status</DialogTitle>
        <DialogContent>
          {selectedVendor && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Vendor: <strong>{selectedVendor.name}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                Current status: <strong>{selectedVendor.status}</strong>
              </Typography>

              <TextField
                select
                label="New status"
                fullWidth
                margin="normal"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as VendorStatus)}
                sx={(th) => sxObject(th, authFormFieldSx)}
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
                placeholder="Reason for status change…"
                sx={(th) => sxObject(th, authFormFieldSx)}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, flexWrap: 'wrap', gap: 1 }}>
          <Button onClick={() => setStatusDialogOpen(false)} sx={(th) => sxObject(th, compactOutlinedCtaSx)}>
            Cancel
          </Button>
          <Button
            onClick={confirmStatusChange}
            variant="contained"
            disableElevation
            sx={(th) => {
              if (newStatus === 'disabled') return { ...sxObject(th, compactErrorContainedCtaSx) };
              if (newStatus === 'suspended') return { ...sxObject(th, compactWarningContainedCtaSx) };
              return { ...sxObject(th, compactContainedCtaSx) };
            }}
          >
            Change status
          </Button>
        </DialogActions>
      </Dialog>

      {/* History Dialog */}
      <Dialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: (th) => sxObject(th, premiumDialogPaperSx) }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem' }}>Status history — {selectedVendor?.name}</DialogTitle>
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
                          color={getVendorStatusColor(item.status)}
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
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, flexWrap: 'wrap', gap: 1 }}>
          <Button onClick={() => setHistoryDialogOpen(false)} sx={(th) => sxObject(th, compactOutlinedCtaSx)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Vendor Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: (th) => sxObject(th, premiumDialogPaperSx) }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem' }}>Create vendor</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Vendor name"
                  fullWidth
                  required
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      name,
                      slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                    }));
                  }}
                  sx={(th) => sxObject(th, authFormFieldSx)}
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
                  sx={(th) => sxObject(th, authFormFieldSx)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Domain (optional)"
                  fullWidth
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  helperText="Custom domain for white-label portal (e.g., 'vendor1.evcharging.com')"
                  sx={(th) => sxObject(th, authFormFieldSx)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Contact email"
                  fullWidth
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  sx={(th) => sxObject(th, authFormFieldSx)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Contact phone"
                  fullWidth
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  sx={(th) => sxObject(th, authFormFieldSx)}
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
                  sx={(th) => sxObject(th, authFormFieldSx)}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, flexWrap: 'wrap', gap: 1 }}>
          <Button onClick={() => setCreateDialogOpen(false)} sx={(th) => sxObject(th, compactOutlinedCtaSx)}>
            Cancel
          </Button>
          <Button
            onClick={confirmCreateVendor}
            variant="contained"
            disableElevation
            disabled={!formData.name || !formData.slug}
            sx={(th) => sxObject(th, compactContainedCtaSx)}
          >
            Create vendor
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Vendor Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: (th) => sxObject(th, premiumDialogPaperSx) }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem' }}>Edit vendor</DialogTitle>
        <DialogContent>
          {selectedVendor && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Vendor name"
                    fullWidth
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    sx={(th) => sxObject(th, authFormFieldSx)}
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
                    sx={(th) => sxObject(th, authFormFieldSx)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Domain (optional)"
                    fullWidth
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    helperText="Custom domain for white-label portal"
                    sx={(th) => sxObject(th, authFormFieldSx)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Contact email"
                    fullWidth
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    sx={(th) => sxObject(th, authFormFieldSx)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Contact phone"
                    fullWidth
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    sx={(th) => sxObject(th, authFormFieldSx)}
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
                    sx={(th) => sxObject(th, authFormFieldSx)}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, flexWrap: 'wrap', gap: 1 }}>
          <Button onClick={() => setEditDialogOpen(false)} sx={(th) => sxObject(th, compactOutlinedCtaSx)}>
            Cancel
          </Button>
          <Button
            onClick={confirmEditVendor}
            variant="contained"
            disableElevation
            disabled={!formData.name || !formData.slug}
            sx={(th) => sxObject(th, compactContainedCtaSx)}
          >
            Save changes
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
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem' }}>Disable vendor?</DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            {pendingDeleteVendor
              ? `Disable vendor "${pendingDeleteVendor.name}"? This disables the vendor.`
              : 'Disable this vendor?'}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, flexWrap: 'wrap', gap: 1 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={(th) => sxObject(th, compactOutlinedCtaSx)}>
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteVendor}
            variant="contained"
            disableElevation
            sx={(th) => sxObject(th, compactErrorContainedCtaSx)}
          >
            Disable vendor
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={loginAsDialogOpen}
        onClose={() => setLoginAsDialogOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: (th) => sxObject(th, premiumDialogPaperSx) }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem' }}>Login as vendor?</DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            {pendingLoginVendor
              ? `Switch to vendor "${pendingLoginVendor.name}" context?`
              : 'Switch to this vendor context?'}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, flexWrap: 'wrap', gap: 1 }}>
          <Button onClick={() => setLoginAsDialogOpen(false)} sx={(th) => sxObject(th, compactOutlinedCtaSx)}>
            Cancel
          </Button>
          <Button
            onClick={confirmLoginAsVendor}
            color="primary"
            variant="contained"
            disableElevation
            sx={(th) => sxObject(th, compactContainedCtaSx)}
          >
            Continue
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


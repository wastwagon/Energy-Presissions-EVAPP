import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Divider,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import BusinessIcon from '@mui/icons-material/Business';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { vendorApi } from '../../services/vendorApi';
import { dashboardPageTitleSx, dashboardPageSubtitleSx, premiumPanelCardSx } from '../../theme/jampackShell';
import {
  authFormFieldSx,
  compactContainedCtaSx,
  compactOutlinedCtaSx,
  sxObject,
} from '../../styles/authShell';
import {
  getDashboardPathForAccountType,
  getStoredUser,
  hasValidSession,
} from '../../utils/authSession';

export function VendorSettingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [, setVendor] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  
  // Check session + role on mount.
  useEffect(() => {
    if (!hasValidSession()) {
      navigate('/login', { replace: true });
      return;
    }
    const userData = getStoredUser();
    if (!userData) {
      navigate('/login', { replace: true });
      return;
    }
    setUser(userData);
    const accountType = userData.accountType;
    if (accountType === 'Customer' || accountType === 'WalkIn') {
      navigate(getDashboardPathForAccountType(accountType), { replace: true });
    }
  }, [navigate]);
  
  // Get current vendor ID from impersonation context or current user.
  const getCurrentVendorId = (): number | null => {
    const stored = localStorage.getItem('currentVendorId');
    if (stored) {
      const n = Number.parseInt(stored, 10);
      return Number.isFinite(n) && n > 0 ? n : null;
    }
    if (typeof user?.vendorId === 'number' && user.vendorId > 0) {
      return user.vendorId;
    }
    return null;
  };

  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    businessRegistrationNumber: '',
    taxId: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    supportEmail: '',
    supportPhone: '',
    websiteUrl: '',
    receiptHeaderText: '',
    receiptFooterText: '',
    logoUrl: '',
  });

  useEffect(() => {
    if (user) {
      loadVendor();
    }
  }, [user]);

  const loadVendor = async () => {
    try {
      setLoading(true);
      setError(null);
      const vendorId = getCurrentVendorId();
      if (vendorId == null) {
        setError('No vendor is selected for this account. Contact support if this persists.');
        return;
      }
      const data = await vendorApi.getById(vendorId);
      setVendor(data);
      setFormData({
        name: data.name || '',
        businessName: data.businessName || data.name || '',
        businessRegistrationNumber: data.businessRegistrationNumber || '',
        taxId: data.taxId || '',
        contactEmail: data.contactEmail || '',
        contactPhone: data.contactPhone || '',
        address: data.address || '',
        supportEmail: data.supportEmail || data.contactEmail || '',
        supportPhone: data.supportPhone || data.contactPhone || '',
        websiteUrl: data.websiteUrl || '',
        receiptHeaderText: data.receiptHeaderText || 'Thank you for charging with us!',
        receiptFooterText: data.receiptFooterText || 'For support, please contact us.',
        logoUrl: data.logoUrl || '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load vendor information');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const vendorId = getCurrentVendorId();
      if (vendorId == null) {
        setError('No vendor is selected for this account.');
        return;
      }
      await vendorApi.update(vendorId, formData);
      setSuccess('Vendor settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
      loadVendor(); // Reload to get updated data
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const vendorId = getCurrentVendorId();
    if (vendorId == null) {
      setError('No vendor is selected for this account.');
      event.target.value = '';
      return;
    }
    try {
      setLogoUploading(true);
      setError(null);
      const updated = await vendorApi.uploadLogo(vendorId, file);
      setFormData((prev) => ({ ...prev, logoUrl: updated.logoUrl || '' }));
      setVendor(updated);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Logo upload failed');
    } finally {
      setLogoUploading(false);
      event.target.value = '';
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
            Vendor Settings
          </Typography>
          <Typography variant="body2" sx={dashboardPageSubtitleSx}>
            Manage business identity, branding assets, and receipt details.
          </Typography>
        </Box>
        <Button
          variant="contained"
          disableElevation
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
          sx={(th) => ({
            ...sxObject(th, compactContainedCtaSx),
            width: { xs: '100%', sm: 'auto' },
          })}
        >
          {saving ? 'Saving...' : 'Save Changes'}
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

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Business Information */}
        <Grid item xs={12} md={6}>
          <Paper sx={premiumPanelCardSx}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <BusinessIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Business Information</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            <TextField
              fullWidth
              label="Vendor Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              required
              sx={(th) => sxObject(th, authFormFieldSx)}
            />

            <TextField
              fullWidth
              label="Business Name (for receipts)"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              margin="normal"
              helperText="Official business name displayed on receipts"
              sx={(th) => sxObject(th, authFormFieldSx)}
            />

            <TextField
              fullWidth
              label="Business Registration Number"
              value={formData.businessRegistrationNumber}
              onChange={(e) => setFormData({ ...formData, businessRegistrationNumber: e.target.value })}
              margin="normal"
              sx={(th) => sxObject(th, authFormFieldSx)}
            />

            <TextField
              fullWidth
              label="Tax ID"
              value={formData.taxId}
              onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
              margin="normal"
              sx={(th) => sxObject(th, authFormFieldSx)}
            />

            <TextField
              fullWidth
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              margin="normal"
              multiline
              rows={3}
              sx={(th) => sxObject(th, authFormFieldSx)}
            />
          </Paper>
        </Grid>

        {/* Contact Information */}
        <Grid item xs={12} md={6}>
          <Paper sx={premiumPanelCardSx}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <BusinessIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Contact Information</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            <TextField
              fullWidth
              label="Contact Email"
              type="email"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              margin="normal"
              sx={(th) => sxObject(th, authFormFieldSx)}
            />

            <TextField
              fullWidth
              label="Contact Phone"
              value={formData.contactPhone}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              margin="normal"
              sx={(th) => sxObject(th, authFormFieldSx)}
            />

            <TextField
              fullWidth
              label="Support Email"
              type="email"
              value={formData.supportEmail}
              onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
              margin="normal"
              helperText="Email displayed on receipts for customer support"
              sx={(th) => sxObject(th, authFormFieldSx)}
            />

            <TextField
              fullWidth
              label="Support Phone"
              value={formData.supportPhone}
              onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
              margin="normal"
              helperText="Phone number displayed on receipts"
              sx={(th) => sxObject(th, authFormFieldSx)}
            />

            <TextField
              fullWidth
              label="Website URL"
              value={formData.websiteUrl}
              onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
              margin="normal"
              sx={(th) => sxObject(th, authFormFieldSx)}
            />
          </Paper>
        </Grid>

        {/* Branding & Logo */}
        <Grid item xs={12} md={6}>
          <Paper sx={premiumPanelCardSx}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CloudUploadIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Branding & Logo</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ mb: 2 }}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="logo-upload"
                type="file"
                onChange={handleLogoUpload}
              />
              <label htmlFor="logo-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  disabled={logoUploading}
                  sx={(th) => ({
                    ...sxObject(th, compactOutlinedCtaSx),
                    width: { xs: '100%', sm: 'auto' },
                  })}
                >
                  {logoUploading ? 'Uploading…' : 'Upload Logo'}
                </Button>
              </label>
            </Box>

            {formData.logoUrl && (
              <Box sx={{ mt: 2, mb: 2 }}>
                <img
                  src={formData.logoUrl}
                  alt="Logo"
                  style={{ maxWidth: '200px', maxHeight: '100px', objectFit: 'contain' }}
                />
              </Box>
            )}

            <TextField
              fullWidth
              label="Logo URL"
              value={formData.logoUrl}
              onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
              margin="normal"
              helperText="Upload stores the file in your configured object storage; you can also paste an external image URL."
              sx={(th) => sxObject(th, authFormFieldSx)}
            />
          </Paper>
        </Grid>

        {/* Receipt Customization */}
        <Grid item xs={12} md={6}>
          <Paper sx={premiumPanelCardSx}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ReceiptIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Receipt Customization</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            <TextField
              fullWidth
              label="Receipt Header Text"
              value={formData.receiptHeaderText}
              onChange={(e) => setFormData({ ...formData, receiptHeaderText: e.target.value })}
              margin="normal"
              multiline
              rows={2}
              helperText="Text displayed at the top of receipts"
              sx={(th) => sxObject(th, authFormFieldSx)}
            />

            <TextField
              fullWidth
              label="Receipt Footer Text"
              value={formData.receiptFooterText}
              onChange={(e) => setFormData({ ...formData, receiptFooterText: e.target.value })}
              margin="normal"
              multiline
              rows={3}
              helperText="Text displayed at the bottom of receipts (e.g., support contact info)"
              sx={(th) => sxObject(th, authFormFieldSx)}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}


import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  InputAdornment,
  IconButton,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import BusinessIcon from '@mui/icons-material/Business';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { tenantApi } from '../../services/tenantApi';

export function TenantSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // Check user role on mount - redirect Customer users
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        const accountType = userData.accountType || 'Customer';
        setUserRole(accountType);
        
        // Redirect Customer users away from tenant settings
        if (accountType === 'Customer' || accountType === 'WalkIn') {
          window.location.href = '/user/dashboard';
          return;
        }
      } catch (e) {
        // If parsing fails, redirect to login
        window.location.href = '/login/admin';
        return;
      }
    } else {
      // No user logged in, redirect to login
      window.location.href = '/login/admin';
      return;
    }
  }, []);
  
  // Get current tenant ID from localStorage (if impersonating) or from user
  const getCurrentTenantId = () => {
    const tenantId = localStorage.getItem('currentTenantId');
    if (tenantId) return parseInt(tenantId);
    
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.tenantId;
    }
    return 1; // Default
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
    loadTenant();
  }, []);

  const loadTenant = async () => {
    try {
      setLoading(true);
      setError(null);
      const tenantId = getCurrentTenantId();
      const data = await tenantApi.getById(tenantId);
      setTenant(data);
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
      setError(err.message || 'Failed to load tenant information');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const tenantId = getCurrentTenantId();
      await tenantApi.update(tenantId, formData);
      setSuccess('Tenant settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
      loadTenant(); // Reload to get updated data
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // TODO: Upload to MinIO and get URL
    // For now, just show a placeholder
    setFormData({ ...formData, logoUrl: URL.createObjectURL(file) });
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
          Tenant Settings
        </Typography>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
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

      <Grid container spacing={3}>
        {/* Business Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BusinessIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Business Information</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <TextField
                fullWidth
                label="Tenant Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                margin="normal"
                required
              />
              
              <TextField
                fullWidth
                label="Business Name (for receipts)"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                margin="normal"
                helperText="Official business name displayed on receipts"
              />
              
              <TextField
                fullWidth
                label="Business Registration Number"
                value={formData.businessRegistrationNumber}
                onChange={(e) => setFormData({ ...formData, businessRegistrationNumber: e.target.value })}
                margin="normal"
              />
              
              <TextField
                fullWidth
                label="Tax ID"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                margin="normal"
              />
              
              <TextField
                fullWidth
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                margin="normal"
                multiline
                rows={3}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Contact Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
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
              />
              
              <TextField
                fullWidth
                label="Contact Phone"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                margin="normal"
              />
              
              <TextField
                fullWidth
                label="Support Email"
                type="email"
                value={formData.supportEmail}
                onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                margin="normal"
                helperText="Email displayed on receipts for customer support"
              />
              
              <TextField
                fullWidth
                label="Support Phone"
                value={formData.supportPhone}
                onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
                margin="normal"
                helperText="Phone number displayed on receipts"
              />
              
              <TextField
                fullWidth
                label="Website URL"
                value={formData.websiteUrl}
                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                margin="normal"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Branding & Logo */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
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
                  <Button variant="outlined" component="span" startIcon={<CloudUploadIcon />}>
                    Upload Logo
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
                helperText="Or enter logo URL directly"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Receipt Customization */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
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
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}


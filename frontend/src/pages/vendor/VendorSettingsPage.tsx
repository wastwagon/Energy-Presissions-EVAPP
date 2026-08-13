import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { vendorApi } from '../../services/vendorApi';
import { premiumPanelCardSx } from '../../theme/jampackShell';
import { iosGroupedPaperSx, iosGroupedSectionHeaderSx } from '../../theme/iosGroupedList';
import { staffLargeSubtitleSx, staffLargeTitleSx } from '../../theme/staffChrome';
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
import { DashboardStaffChromeSkeleton } from '../../components/dashboard/DashboardStaffChromeSkeleton';
import { TableSurfaceProgress } from '../../components/dashboard/TableSurfaceProgress';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { useStaffPullRefresh } from '../../hooks/useStaffPullRefresh';
import { useStaffNavBack } from '../../hooks/useStaffNavBack';
import { ADMIN_ROUTES } from '../../config/staffNav.paths';

function VendorPortalSettingsBack() {
  const navigate = useNavigate();
  const goHome = useCallback(() => navigate(ADMIN_ROUTES.vendorPortal), [navigate]);
  useStaffNavBack(goHome, 'Back to vendor home');
  return null;
}

function VendorSettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box component="section" sx={{ mb: 2.5 }}>
      <Typography component="h2" variant="caption" sx={iosGroupedSectionHeaderSx}>
        {title}
      </Typography>
      <Paper
        elevation={0}
        sx={{
          ...iosGroupedPaperSx,
          p: { xs: 2, sm: 2.25 },
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
        }}
      >
        {children}
      </Paper>
    </Box>
  );
}

export function VendorSettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isVendorPortal = location.pathname === ADMIN_ROUTES.vendorSettings;
  const [loading, setLoading] = useState(true);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [, setVendor] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

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
      setInitialLoadDone(true);
    }
  };

  useEffect(() => {
    if (user) {
      void loadVendor();
    }
  }, [user]);

  useStaffPullRefresh(useCallback(() => void loadVendor(), [user]));

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
      void loadVendor();
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

  if (loading && !initialLoadDone) {
    return (
      <>
        {isVendorPortal ? <VendorPortalSettingsBack /> : null}
        <DashboardStaffChromeSkeleton preset="vendorSettings" />
      </>
    );
  }

  return (
    <Box sx={{ position: 'relative', minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      {isVendorPortal ? <VendorPortalSettingsBack /> : null}
      <TableSurfaceProgress active={loading && initialLoadDone} ariaLabel="Loading vendor settings" />

      <LivePageHeader
        title="Vendor settings"
        subtitle="Business identity, branding, and receipt copy for your chargers."
        updatedAt={null}
        refreshing={saving}
        refreshDisabled={loading}
        onRefresh={() => void loadVendor()}
        titleVariant="large"
        titleSx={staffLargeTitleSx}
        subtitleSx={staffLargeSubtitleSx}
        showToolbarRefreshOnMobile
        containerSx={{ mb: 2 }}
        refreshSx={(th) => ({
          ...sxObject(th, compactOutlinedCtaSx),
          width: { xs: '100%', sm: 'auto' },
        })}
        actions={
          <Button
            variant="contained"
            disableElevation
            startIcon={<SaveIcon />}
            onClick={() => void handleSave()}
            disabled={saving || loading}
            sx={(th) => ({
              ...sxObject(th, compactContainedCtaSx),
              width: { xs: '100%', sm: 'auto' },
            })}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        }
      />

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

      <VendorSettingsSection title="Business">
        <TextField
          fullWidth
          label="Vendor name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          sx={(th) => sxObject(th, authFormFieldSx)}
        />
        <TextField
          fullWidth
          label="Business name (receipts)"
          value={formData.businessName}
          onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
          helperText="Official name printed on customer receipts"
          sx={(th) => sxObject(th, authFormFieldSx)}
        />
        <TextField
          fullWidth
          label="Business registration number"
          value={formData.businessRegistrationNumber}
          onChange={(e) => setFormData({ ...formData, businessRegistrationNumber: e.target.value })}
          sx={(th) => sxObject(th, authFormFieldSx)}
        />
        <TextField
          fullWidth
          label="Tax ID"
          value={formData.taxId}
          onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
          sx={(th) => sxObject(th, authFormFieldSx)}
        />
        <TextField
          fullWidth
          label="Address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          multiline
          rows={3}
          sx={(th) => sxObject(th, authFormFieldSx)}
        />
      </VendorSettingsSection>

      <VendorSettingsSection title="Contact & support">
        <TextField
          fullWidth
          label="Contact email"
          type="email"
          value={formData.contactEmail}
          onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
          sx={(th) => sxObject(th, authFormFieldSx)}
        />
        <TextField
          fullWidth
          label="Contact phone"
          value={formData.contactPhone}
          onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
          sx={(th) => sxObject(th, authFormFieldSx)}
        />
        <TextField
          fullWidth
          label="Support email"
          type="email"
          value={formData.supportEmail}
          onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
          helperText="Shown on receipts for customer support"
          sx={(th) => sxObject(th, authFormFieldSx)}
        />
        <TextField
          fullWidth
          label="Support phone"
          value={formData.supportPhone}
          onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
          sx={(th) => sxObject(th, authFormFieldSx)}
        />
        <TextField
          fullWidth
          label="Website URL"
          value={formData.websiteUrl}
          onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
          sx={(th) => sxObject(th, authFormFieldSx)}
        />
      </VendorSettingsSection>

      <VendorSettingsSection title="Branding">
        <Box>
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
              {logoUploading ? 'Uploading…' : 'Upload logo'}
            </Button>
          </label>
        </Box>
        {formData.logoUrl ? (
          <Box
            component="img"
            src={formData.logoUrl}
            alt="Vendor logo"
            sx={{ mt: 1, maxWidth: 200, maxHeight: 100, objectFit: 'contain', borderRadius: 1 }}
          />
        ) : null}
        <TextField
          fullWidth
          label="Logo URL"
          value={formData.logoUrl}
          onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
          helperText="Upload to object storage or paste an external image URL"
          sx={(th) => sxObject(th, authFormFieldSx)}
        />
      </VendorSettingsSection>

      <VendorSettingsSection title="Receipts">
        <TextField
          fullWidth
          label="Receipt header"
          value={formData.receiptHeaderText}
          onChange={(e) => setFormData({ ...formData, receiptHeaderText: e.target.value })}
          multiline
          rows={2}
          sx={(th) => sxObject(th, authFormFieldSx)}
        />
        <TextField
          fullWidth
          label="Receipt footer"
          value={formData.receiptFooterText}
          onChange={(e) => setFormData({ ...formData, receiptFooterText: e.target.value })}
          multiline
          rows={3}
          helperText="Support or legal text at the bottom of receipts"
          sx={(th) => sxObject(th, authFormFieldSx)}
        />
      </VendorSettingsSection>

      <Paper elevation={0} sx={{ ...premiumPanelCardSx, p: { xs: 2, sm: 2.25 }, display: { xs: 'block', sm: 'none' } }}>
        <Button
          variant="contained"
          disableElevation
          fullWidth
          startIcon={<SaveIcon />}
          onClick={() => void handleSave()}
          disabled={saving || loading}
          sx={(th) => sxObject(th, compactContainedCtaSx)}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </Paper>
    </Box>
  );
}

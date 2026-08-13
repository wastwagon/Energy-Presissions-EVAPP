import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  Link,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { vendorApi, type Vendor } from '../../services/vendorApi';
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
  type SessionUser,
} from '../../utils/authSession';
import { DashboardStaffChromeSkeleton } from '../../components/dashboard/DashboardStaffChromeSkeleton';
import { TableSurfaceProgress } from '../../components/dashboard/TableSurfaceProgress';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { GroupedExpandableRow } from '../../components/ios/GroupedExpandableRow';
import { useStaffPullRefresh } from '../../hooks/useStaffPullRefresh';
import { useStaffNavBack } from '../../hooks/useStaffNavBack';
import { ADMIN_ROUTES, staffHelpPath } from '../../config/staffNav.paths';

type VendorSettingsForm = {
  name: string;
  businessName: string;
  businessRegistrationNumber: string;
  taxId: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  supportEmail: string;
  supportPhone: string;
  websiteUrl: string;
  receiptHeaderText: string;
  receiptFooterText: string;
  logoUrl: string;
};

const EMPTY_FORM: VendorSettingsForm = {
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
};

function formFromVendor(data: Vendor): VendorSettingsForm {
  return {
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
  };
}

function confirmDiscardUnsaved(): boolean {
  return window.confirm('Discard unsaved vendor settings?');
}

function VendorPortalSettingsBack({ onBack }: { onBack: () => void }) {
  useStaffNavBack(onBack, 'Back to vendor home');
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
  const [logoUploading, setLogoUploading] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [formData, setFormData] = useState<VendorSettingsForm>(EMPTY_FORM);
  const [savedForm, setSavedForm] = useState<VendorSettingsForm>(EMPTY_FORM);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  const isDirty = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(savedForm),
    [formData, savedForm],
  );

  const goHome = useCallback(() => {
    if (isDirty && !confirmDiscardUnsaved()) return;
    navigate(ADMIN_ROUTES.vendorPortal);
  }, [isDirty, navigate]);

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

  const getCurrentVendorId = useCallback((): number | null => {
    const stored = localStorage.getItem('currentVendorId');
    if (stored) {
      const n = Number.parseInt(stored, 10);
      return Number.isFinite(n) && n > 0 ? n : null;
    }
    if (typeof user?.vendorId === 'number' && user.vendorId > 0) {
      return user.vendorId;
    }
    return null;
  }, [user]);

  const loadVendor = useCallback(
    async (opts?: { force?: boolean }) => {
      if (!opts?.force && isDirty) {
        if (!confirmDiscardUnsaved()) return;
      }
      try {
        setLoading(true);
        setError(null);
        const vendorId = getCurrentVendorId();
        if (vendorId == null) {
          setError('No vendor is selected for this account. Contact support if this persists.');
          return;
        }
        const data = await vendorApi.getById(vendorId);
        const next = formFromVendor(data);
        setFormData(next);
        setSavedForm(next);
        setLastSavedAt(new Date(data.updatedAt).getTime());
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load vendor information';
        setError(message);
      } finally {
        setLoading(false);
        setInitialLoadDone(true);
      }
    },
    [getCurrentVendorId, isDirty],
  );

  useEffect(() => {
    if (user) {
      void loadVendor({ force: true });
    }
    // Load once the session user is known; later refreshes go through pull-to-refresh / Save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useStaffPullRefresh(useCallback(() => void loadVendor(), [loadVendor]));

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const vendorId = getCurrentVendorId();
      if (vendorId == null) {
        setError('No vendor is selected for this account.');
        return;
      }
      const updated = await vendorApi.update(vendorId, formData);
      const next = updated ? formFromVendor(updated) : formData;
      setFormData(next);
      setSavedForm(next);
      setLastSavedAt(Date.now());
    } catch (err: unknown) {
      const responseMessage =
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response?.data?.message ===
          'string'
          ? (err as { response: { data: { message: string } } }).response.data.message
          : null;
      setError(responseMessage || (err instanceof Error ? err.message : 'Failed to save settings'));
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
      const logoUrl = updated.logoUrl || '';
      setFormData((prev) => ({ ...prev, logoUrl }));
      setSavedForm((prev) => ({ ...prev, logoUrl }));
    } catch (err: unknown) {
      const responseMessage =
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response?.data?.message ===
          'string'
          ? (err as { response: { data: { message: string } } }).response.data.message
          : null;
      setError(responseMessage || (err instanceof Error ? err.message : 'Logo upload failed'));
    } finally {
      setLogoUploading(false);
      event.target.value = '';
    }
  };

  const lastSavedLabel = 'Business identity, branding, and receipt copy for your chargers.';
  const subtitle = isDirty ? 'Unsaved changes' : lastSavedLabel;

  if (loading && !initialLoadDone) {
    return (
      <>
        {isVendorPortal ? <VendorPortalSettingsBack onBack={goHome} /> : null}
        <DashboardStaffChromeSkeleton preset="vendorSettings" />
      </>
    );
  }

  const receiptName = formData.businessName || formData.name || 'Your business';

  return (
    <Box sx={{ position: 'relative', minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      {isVendorPortal ? <VendorPortalSettingsBack onBack={goHome} /> : null}
      <TableSurfaceProgress active={loading && initialLoadDone} ariaLabel="Loading vendor settings" />

      <LivePageHeader
        title="Vendor settings"
        subtitle={subtitle}
        updatedAt={lastSavedAt}
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
            disabled={saving || loading || !isDirty}
            sx={(th) => ({
              ...sxObject(th, compactContainedCtaSx),
              width: { xs: '100%', sm: 'auto' },
            })}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        }
      />

      {isDirty ? (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => void handleSave()} disabled={saving}>
              Save
            </Button>
          }
        >
          You have unsaved changes.
        </Alert>
      ) : null}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
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
        <Box sx={{ mx: { xs: -2, sm: -2.25 }, mt: 1 }}>
          <GroupedExpandableRow primary="Advanced — logo URL">
            <TextField
              fullWidth
              label="Logo URL"
              value={formData.logoUrl}
              onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
              helperText="Paste an external image URL if you are not uploading a file"
              sx={(th) => sxObject(th, authFormFieldSx)}
            />
          </GroupedExpandableRow>
        </Box>
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

      <Box component="section" sx={{ mb: 2.5 }}>
        <Typography component="h2" variant="caption" sx={iosGroupedSectionHeaderSx}>
          Receipt preview
        </Typography>
        <Paper
          elevation={0}
          sx={{
            ...iosGroupedPaperSx,
            p: { xs: 2, sm: 2.5 },
            maxWidth: 420,
          }}
        >
          {formData.logoUrl ? (
            <Box
              component="img"
              src={formData.logoUrl}
              alt=""
              sx={{ mb: 1.5, maxWidth: 140, maxHeight: 56, objectFit: 'contain' }}
            />
          ) : null}
          <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
            {receiptName}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {formData.receiptHeaderText || 'Thank you for charging with us!'}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', fontVariantNumeric: 'tabular-nums' }}>
            <Typography variant="body2">Energy</Typography>
            <Typography variant="body2">12.4 kWh</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', fontVariantNumeric: 'tabular-nums', mb: 1.5 }}>
            <Typography variant="body2" fontWeight={600}>
              Total
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              GH₵ 18.60
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" display="block">
            {formData.receiptFooterText || 'For support, please contact us.'}
          </Typography>
          {formData.supportEmail || formData.supportPhone ? (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              {[formData.supportEmail, formData.supportPhone].filter(Boolean).join(' · ')}
            </Typography>
          ) : null}
        </Paper>
      </Box>

      <Paper elevation={0} sx={{ ...premiumPanelCardSx, p: { xs: 2, sm: 2.25 }, display: { xs: 'block', sm: 'none' } }}>
        <Button
          variant="contained"
          disableElevation
          fullWidth
          startIcon={<SaveIcon />}
          onClick={() => void handleSave()}
          disabled={saving || loading || !isDirty}
          sx={(th) => sxObject(th, compactContainedCtaSx)}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </Paper>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, mb: 2 }}>
        Need a walkthrough?{' '}
        <Link
          component="button"
          type="button"
          variant="caption"
          onClick={() => navigate(staffHelpPath(location.pathname))}
          sx={{ verticalAlign: 'baseline' }}
        >
          Operator guide
        </Link>
      </Typography>
    </Box>
  );
}

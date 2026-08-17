import { useState, useEffect, useMemo } from 'react';
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Alert,
  IconButton,
  Grid,
  InputAdornment,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import HistoryIcon from '@mui/icons-material/History';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import LoginIcon from '@mui/icons-material/Login';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PaymentsIcon from '@mui/icons-material/Payments';
import { vendorApi, PAYOUT_CYCLE_OPTIONS, Vendor, VendorStatus, VendorDisablement, type VendorPayoutCycle, type VendorPayoutSummary, type VendorPayoutRecord } from '../../services/vendorApi';
import { premiumTableSurfaceSx } from '../../theme/jampackShell';
import {
  authFormFieldSx,
  staffFilterFieldSx,
  compactContainedCtaSx,
  compactErrorContainedCtaSx,
  compactOutlinedCtaSx,
  compactWarningContainedCtaSx,
  premiumDialogPaperSx,
  premiumIconButtonTouchSx,
  premiumMenuItemSx,
  premiumMenuPaperSx,
  sxObject,
} from '../../styles/authShell';
import { getVendorStatusColor } from '../../utils/statusColors';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { StaffFilterBar } from '../../components/dashboard/StaffFilterBar';
import { StaffStatusTabs } from '../../components/dashboard/StaffStatusTabs';
import { AppEmptyState } from '../../components/ui/AppEmptyState';
import { AppBadge, chipColorToBadgeTone } from '../../components/ui/AppBadge';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { DashboardStaffChromeSkeleton } from '../../components/dashboard/DashboardStaffChromeSkeleton';
import { TableSurfaceProgress } from '../../components/dashboard/TableSurfaceProgress';
import { DialogDenseRowsSkeleton } from '../../components/dashboard/BlockContentSkeletons';
import { ADMIN_ROUTES } from '../../config/staffNav.paths';
import { GroupedListSection } from '../../components/ios/GroupedListSection';
import { GroupedListRow } from '../../components/ios/GroupedListRow';
import { staffLargeSubtitleSx, staffLargeTitleSx } from '../../theme/staffChrome';
import { formatCurrency } from '../../utils/formatters';

type VendorStatusTab = 'all' | VendorStatus;

function vendorSecondaryLine(vendor: Vendor): string {
  const contact = vendor.contactEmail || vendor.domain || 'No contact email';
  return `${contact} · ${new Date(vendor.createdAt).toLocaleDateString()}`;
}

function vendorScoreboardLine(vendor: Vendor): string {
  const stations = vendor.stationCount ?? 0;
  const gmv = formatCurrency(vendor.gmv ?? 0, 'GHS');
  const last = vendor.lastSessionAt
    ? new Date(vendor.lastSessionAt).toLocaleDateString()
    : 'No sessions';
  const cycle =
    vendor.payoutCycle === 'weekly'
      ? 'Weekly'
      : vendor.payoutCycle === 'biweekly'
        ? 'Every 2 weeks'
        : 'Monthly';
  return `${stations} station${stations === 1 ? '' : 's'} · ${gmv} sales · ${cycle} payout · ${last}`;
}

function VendorPayoutScheduleFields({
  payoutCycle,
  payoutHoldDays,
  onChange,
}: {
  payoutCycle: VendorPayoutCycle;
  payoutHoldDays: number;
  onChange: (patch: { payoutCycle?: VendorPayoutCycle; payoutHoldDays?: number }) => void;
}) {
  return (
    <>
      <Grid item xs={12}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 1 }}>
          Payout schedule
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          When Clean Motion settles this vendor. They add MoMo or bank details in their settings.
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          select
          label="Payout cycle"
          fullWidth
          value={payoutCycle}
          onChange={(e) => onChange({ payoutCycle: e.target.value as VendorPayoutCycle })}
          sx={(th) => sxObject(th, authFormFieldSx)}
        >
          {PAYOUT_CYCLE_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Hold days"
          type="number"
          fullWidth
          value={payoutHoldDays}
          onChange={(e) =>
            onChange({
              payoutHoldDays: Math.min(90, Math.max(0, Number.parseInt(e.target.value, 10) || 0)),
            })
          }
          helperText="Sessions mature after this many days"
          inputProps={{ min: 0, max: 90 }}
          sx={(th) => sxObject(th, authFormFieldSx)}
        />
      </Grid>
    </>
  );
}

export function VendorManagementPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const useGroupedList = useMediaQuery(theme.breakpoints.down('md'));
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusTab, setStatusTab] = useState<VendorStatusTab>('all');
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loginAsDialogOpen, setLoginAsDialogOpen] = useState(false);
  const [pendingDeleteVendor, setPendingDeleteVendor] = useState<Vendor | null>(null);
  const [pendingLoginVendor, setPendingLoginVendor] = useState<Vendor | null>(null);
  const [menuVendor, setMenuVendor] = useState<Vendor | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [newStatus, setNewStatus] = useState<VendorStatus>('active');
  const [reason, setReason] = useState('');
  const [history, setHistory] = useState<VendorDisablement[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  const MIN_ADMIN_PASSWORD_LENGTH = 8;

  // Form state for create/edit
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    domain: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    adminEmail: '',
    password: '',
    confirmPassword: '',
    payoutCycle: 'monthly' as VendorPayoutCycle,
    payoutHoldDays: 7,
  });
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [payoutVendor, setPayoutVendor] = useState<Vendor | null>(null);
  const [payoutSummary, setPayoutSummary] = useState<VendorPayoutSummary | null>(null);
  const [payoutHistory, setPayoutHistory] = useState<VendorPayoutRecord[]>([]);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutReference, setPayoutReference] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');

  useEffect(() => {
    void loadVendors();
  }, []);

  const statusCounts = useMemo(() => {
    const counts = { all: vendors.length, active: 0, suspended: 0, disabled: 0 };
    for (const vendor of vendors) {
      if (vendor.status in counts) counts[vendor.status] += 1;
    }
    return counts;
  }, [vendors]);

  const filteredVendors = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return vendors.filter((vendor) => {
      if (statusTab !== 'all' && vendor.status !== statusTab) return false;
      if (!q) return true;
      return (
        vendor.name.toLowerCase().includes(q) ||
        (vendor.contactEmail && vendor.contactEmail.toLowerCase().includes(q)) ||
        (vendor.domain && vendor.domain.toLowerCase().includes(q)) ||
        (vendor.slug && vendor.slug.toLowerCase().includes(q))
      );
    });
  }, [vendors, searchTerm, statusTab]);

  const loadVendors = async (silent?: boolean) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const data = await vendorApi.getAll();
      setVendors(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load vendors');
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  const emptyFormData = () => ({
    name: '',
    slug: '',
    domain: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    adminEmail: '',
    password: '',
    confirmPassword: '',
    payoutCycle: 'monthly' as VendorPayoutCycle,
    payoutHoldDays: 7,
  });

  const handleCreateVendor = () => {
    setFormData(emptyFormData());
    setCreateDialogOpen(true);
  };

  const handleEditVendor = async (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setFormData({
      name: vendor.name,
      slug: vendor.slug || vendor.name.toLowerCase().replace(/\s+/g, '-'),
      domain: vendor.domain || '',
      contactEmail: vendor.contactEmail || '',
      contactPhone: vendor.contactPhone || '',
      address: vendor.address || '',
      adminEmail: '',
      password: '',
      confirmPassword: '',
      payoutCycle: vendor.payoutCycle || 'monthly',
      payoutHoldDays: vendor.payoutHoldDays ?? 7,
    });
    setEditDialogOpen(true);
    try {
      const portal = await vendorApi.getPortalAdmin(vendor.id);
      setFormData((prev) => ({
        ...prev,
        adminEmail: portal.email || vendor.contactEmail || '',
      }));
    } catch {
      setFormData((prev) => ({
        ...prev,
        adminEmail: vendor.contactEmail || '',
      }));
    }
  };

  const resolveAdminLoginEmail = () =>
    (formData.adminEmail || formData.contactEmail).trim();

  const validatePortalPassword = (requirePassword: boolean): string | null => {
    const loginEmail = resolveAdminLoginEmail();
    if (!loginEmail) {
      return 'Vendor admin login email is required (set login email or contact email)';
    }
    if (!requirePassword && !formData.password) {
      return null;
    }
    if (!formData.password) {
      return 'Vendor admin password is required';
    }
    if (formData.password.length < MIN_ADMIN_PASSWORD_LENGTH) {
      return `Password must be at least ${MIN_ADMIN_PASSWORD_LENGTH} characters`;
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
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
    const passwordError = validatePortalPassword(true);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    try {
      setError(null);
      const { password, confirmPassword: _confirm, adminEmail, ...vendorFields } = formData;
      await vendorApi.create({
        ...vendorFields,
        adminEmail: adminEmail.trim() || undefined,
        adminPassword: password,
      });
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

    const passwordError = validatePortalPassword(false);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    try {
      setError(null);
      const { password, confirmPassword: _confirm, adminEmail, ...vendorFields } = formData;
      const payload: Parameters<typeof vendorApi.update>[1] = { ...vendorFields };
      if (adminEmail.trim()) {
        payload.adminEmail = adminEmail.trim();
      }
      if (password) {
        payload.adminPassword = password;
      }
      await vendorApi.update(selectedVendor.id, payload);
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
      await vendorApi.loginAsVendor(pendingLoginVendor.id);

      localStorage.setItem('currentVendorId', pendingLoginVendor.id.toString());
      localStorage.setItem('currentVendorName', pendingLoginVendor.name);
      localStorage.setItem('isImpersonating', 'true');
      setLoginAsDialogOpen(false);
      setPendingLoginVendor(null);
      navigate(ADMIN_ROUTES.vendorPortal);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to login as vendor');
    }
  };

  const handleRecordPayout = (vendor: Vendor) => {
    setPayoutVendor(vendor);
    setPayoutSummary(null);
    setPayoutHistory([]);
    setPayoutAmount('');
    setPayoutReference('');
    setPayoutNotes('');
    setPayoutDialogOpen(true);
    setPayoutLoading(true);
    void Promise.all([vendorApi.getPayoutSummary(vendor.id), vendorApi.listPayouts(vendor.id)])
      .then(([summary, history]) => {
        setPayoutSummary(summary);
        setPayoutHistory(history.slice(0, 5));
        setPayoutAmount(summary.eligible > 0 ? summary.eligible.toFixed(2) : '');
      })
      .catch((err: { response?: { data?: { message?: string } }; message?: string }) => {
        setError(err.response?.data?.message || err.message || 'Failed to load payout summary');
        setPayoutDialogOpen(false);
      })
      .finally(() => setPayoutLoading(false));
  };

  const confirmRecordPayout = async () => {
    if (!payoutVendor) return;
    const amount = Number.parseFloat(payoutAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a payout amount greater than zero');
      return;
    }
    try {
      setPayoutSubmitting(true);
      setError(null);
      await vendorApi.recordPayout(payoutVendor.id, {
        amount,
        reference: payoutReference.trim() || undefined,
        notes: payoutNotes.trim() || undefined,
      });
      setSuccess(`Recorded payout of ${formatCurrency(amount, 'GHS')} to ${payoutVendor.name}`);
      setPayoutDialogOpen(false);
      setPayoutVendor(null);
      void loadVendors(true);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to record payout');
    } finally {
      setPayoutSubmitting(false);
    }
  };

  const closeVendorMenu = () => {
    setMenuAnchor(null);
    setMenuVendor(null);
  };

  const openVendorMenu = (event: React.MouseEvent<HTMLElement>, vendor: Vendor) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setMenuVendor(vendor);
  };

  const openVendor = (vendor: Vendor) => {
    if (vendor.status === 'active') {
      handleLoginAsVendor(vendor);
    } else {
      void handleEditVendor(vendor);
    }
  };

  if (loading && vendors.length === 0) {
    return <DashboardStaffChromeSkeleton preset="vendorManagement" />;
  }

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <LivePageHeader
        title="Vendor Management"
        subtitle="Open an active vendor’s home. Set payout cycle on create/edit. Record a payout after you send MoMo or bank."
        updatedAt={null}
        refreshing={refreshing}
        onRefresh={() => void loadVendors(true)}
        showToolbarRefreshOnMobile
        titleVariant="large"
        titleSx={staffLargeTitleSx}
        subtitleSx={staffLargeSubtitleSx}
        actions={
          <Button
            variant="contained"
            disableElevation
            startIcon={<AddIcon />}
            onClick={handleCreateVendor}
            sx={(th) => ({
              ...sxObject(th, compactContainedCtaSx),
              width: { xs: '100%', sm: 'auto' },
            })}
          >
            Create vendor
          </Button>
        }
      />

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontVariantNumeric: 'tabular-nums' }}>
        {statusCounts.active} active · {statusCounts.suspended} suspended · {statusCounts.disabled} disabled
      </Typography>

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

      <StaffFilterBar aria-label="Vendor filters">
        <TextField
          placeholder="Search vendors…"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: searchTerm ? (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setSearchTerm('')}
                  aria-label="Clear vendor search"
                  sx={(th) => ({ ...sxObject(th, premiumIconButtonTouchSx) })}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : undefined,
          }}
          sx={(th) => ({
            ...sxObject(th, staffFilterFieldSx),
            width: { xs: '100%', sm: 280 },
            maxWidth: '100%',
          })}
        />
        <StaffStatusTabs
          aria-label="Vendor status"
          value={statusTab}
          onChange={setStatusTab}
          options={[
            { value: 'all', label: 'All', count: statusCounts.all },
            { value: 'active', label: 'Active', count: statusCounts.active },
            { value: 'suspended', label: 'Suspended', count: statusCounts.suspended },
            { value: 'disabled', label: 'Disabled', count: statusCounts.disabled },
          ]}
        />
      </StaffFilterBar>

      <Paper elevation={0} sx={{ ...premiumTableSurfaceSx, position: 'relative' }}>
        <TableSurfaceProgress active={loading && vendors.length > 0} ariaLabel="Loading vendors" />
        <Box sx={{ px: { xs: 2, sm: 2.5 }, py: { xs: 1.75, sm: 2 }, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Vendors ({filteredVendors.length})
          </Typography>
        </Box>
        {filteredVendors.length === 0 ? (
          <AppEmptyState
            sx={{ border: 0, boxShadow: 'none', borderRadius: 0 }}
            icon={<StorefrontIcon />}
            title={searchTerm || statusTab !== 'all' ? 'No vendors match your filters' : 'No vendors yet'}
            description={
              searchTerm || statusTab !== 'all'
                ? 'Try another status or clear the search.'
                : 'Create a vendor to onboard operators and assign charge points.'
            }
            primaryAction={
              searchTerm || statusTab !== 'all'
                ? {
                    label: 'Clear filters',
                    onClick: () => {
                      setSearchTerm('');
                      setStatusTab('all');
                    },
                    variant: 'secondary',
                  }
                : {
                    label: 'Create vendor',
                    onClick: handleCreateVendor,
                    startIcon: <AddIcon />,
                  }
            }
          />
        ) : useGroupedList ? (
          <Box sx={{ py: 1 }}>
            <GroupedListSection>
              {filteredVendors.map((vendor, index) => (
                <GroupedListRow
                  key={vendor.id}
                  divider={index < filteredVendors.length - 1}
                  primary={vendor.name}
                  secondary={vendorScoreboardLine(vendor)}
                  end={
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <AppBadge
                        label={vendor.status}
                        tone={chipColorToBadgeTone(getVendorStatusColor(vendor.status))}
                        sx={{ height: 24 }}
                      />
                      <IconButton
                        onClick={(event) => openVendorMenu(event, vendor)}
                        aria-label={`More actions for ${vendor.name}`}
                        sx={(th) => ({ ...sxObject(th, premiumIconButtonTouchSx) })}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  }
                  onClick={() => openVendor(vendor)}
                  aria-label={
                    vendor.status === 'active'
                      ? `Open vendor ${vendor.name}`
                      : `Edit vendor ${vendor.name}`
                  }
                />
              ))}
            </GroupedListSection>
          </Box>
        ) : (
        <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Vendor</TableCell>
                <TableCell>Stations</TableCell>
                <TableCell>Last session</TableCell>
                <TableCell>Sales</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredVendors.map((vendor) => (
                  <TableRow
                    key={vendor.id}
                    hover
                    onClick={() => openVendor(vendor)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openVendor(vendor);
                      }
                    }}
                    tabIndex={0}
                    sx={{ cursor: 'pointer' }}
                    aria-label={
                      vendor.status === 'active'
                        ? `Open vendor ${vendor.name}`
                        : `Edit vendor ${vendor.name}`
                    }
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {vendor.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {vendorSecondaryLine(vendor)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID {vendor.id}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {vendor.stationCount ?? 0}
                    </TableCell>
                    <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {vendor.lastSessionAt
                        ? new Date(vendor.lastSessionAt).toLocaleDateString()
                        : '—'}
                    </TableCell>
                    <TableCell sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                      {formatCurrency(vendor.gmv ?? 0, 'GHS')}
                    </TableCell>
                    <TableCell>
                      <AppBadge
                        label={vendor.status}
                        tone={chipColorToBadgeTone(getVendorStatusColor(vendor.status))}
                      />
                    </TableCell>
                    <TableCell align="right" onClick={(event) => event.stopPropagation()}>
                      <IconButton
                        onClick={(event) => openVendorMenu(event, vendor)}
                        aria-label={`More actions for ${vendor.name}`}
                        sx={(th) => ({ ...sxObject(th, premiumIconButtonTouchSx) })}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        )}
      </Paper>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor) && Boolean(menuVendor)}
        onClose={closeVendorMenu}
        PaperProps={{
          elevation: 0,
          sx: (th) => sxObject(th, premiumMenuPaperSx),
        }}
      >
        {menuVendor ? (
          <>
            <MenuItem
              disabled={menuVendor.status !== 'active'}
              onClick={() => {
                handleLoginAsVendor(menuVendor);
                closeVendorMenu();
              }}
              sx={premiumMenuItemSx}
            >
              <ListItemIcon>
                <LoginIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Open as vendor</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => {
                void handleEditVendor(menuVendor);
                closeVendorMenu();
              }}
              sx={premiumMenuItemSx}
            >
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Edit</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleRecordPayout(menuVendor);
                closeVendorMenu();
              }}
              sx={premiumMenuItemSx}
            >
              <ListItemIcon>
                <PaymentsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Record payout</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleStatusChange(menuVendor);
                closeVendorMenu();
              }}
              sx={premiumMenuItemSx}
            >
              <ListItemIcon>
                <SwapHorizIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Change status</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => {
                void handleViewHistory(menuVendor);
                closeVendorMenu();
              }}
              sx={premiumMenuItemSx}
            >
              <ListItemIcon>
                <HistoryIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>History</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleDeleteVendor(menuVendor);
                closeVendorMenu();
              }}
              sx={(th) => ({
                ...sxObject(th, premiumMenuItemSx),
                color: 'error.main',
              })}
            >
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Disable vendor</ListItemText>
            </MenuItem>
          </>
        ) : null}
      </Menu>

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
            <DialogDenseRowsSkeleton rows={6} ariaLabel="Loading status history" showToolbar={false} />
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
                        <AppBadge
                          label={item.status}
                          tone={chipColorToBadgeTone(getVendorStatusColor(item.status))}
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
                  helperText="Custom domain for a white-label portal (e.g. charging.yourdomain.com)"
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
              <VendorPayoutScheduleFields
                payoutCycle={formData.payoutCycle}
                payoutHoldDays={formData.payoutHoldDays}
                onChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
              />
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 1 }}>
                  Vendor portal login
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Credentials for the vendor admin to sign in to their dashboard.
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Admin login email"
                  fullWidth
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  helperText={
                    formData.contactEmail && !formData.adminEmail
                      ? `Uses contact email (${formData.contactEmail}) if left blank`
                      : 'Used to sign in to the vendor admin portal'
                  }
                  sx={(th) => sxObject(th, authFormFieldSx)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Admin password"
                  fullWidth
                  required
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  helperText={`At least ${MIN_ADMIN_PASSWORD_LENGTH} characters`}
                  sx={(th) => sxObject(th, authFormFieldSx)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Confirm password"
                  fullWidth
                  required
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
            disabled={
              !formData.name ||
              !formData.slug ||
              !formData.password ||
              !resolveAdminLoginEmail()
            }
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
                <VendorPayoutScheduleFields
                  payoutCycle={formData.payoutCycle}
                  payoutHoldDays={formData.payoutHoldDays}
                  onChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
                />
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 1 }}>
                    Vendor portal login
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Update sign-in email or set a new password for the vendor admin account.
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Admin login email"
                    fullWidth
                    type="email"
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                    helperText="Email used to sign in to the vendor admin portal"
                    sx={(th) => sxObject(th, authFormFieldSx)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="New password (leave blank to keep current)"
                    fullWidth
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    helperText={
                      formData.password
                        ? `At least ${MIN_ADMIN_PASSWORD_LENGTH} characters`
                        : undefined
                    }
                    sx={(th) => sxObject(th, authFormFieldSx)}
                  />
                </Grid>
                {formData.password ? (
                  <Grid item xs={12}>
                    <TextField
                      label="Confirm new password"
                      fullWidth
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      sx={(th) => sxObject(th, authFormFieldSx)}
                    />
                  </Grid>
                ) : null}
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
        open={payoutDialogOpen}
        onClose={() => !payoutSubmitting && setPayoutDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: (th) => sxObject(th, premiumDialogPaperSx) }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem' }}>
          Record payout{payoutVendor ? ` · ${payoutVendor.name}` : ''}
        </DialogTitle>
        <DialogContent>
          {payoutLoading ? (
            <Typography variant="body2" color="text.secondary" sx={{ pt: 2 }}>
              Loading next payout…
            </Typography>
          ) : payoutSummary ? (
            <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography variant="body2" color="text.secondary">
                {payoutSummary.payoutCycleLabel} · {payoutSummary.payoutHoldDays}-day hold · next{' '}
                {new Date(payoutSummary.nextPayoutAt).toLocaleDateString()}
              </Typography>
              <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                Next payout {formatCurrency(payoutSummary.eligible, payoutSummary.currency)} · matured{' '}
                {formatCurrency(payoutSummary.matured ?? payoutSummary.eligible, payoutSummary.currency)} · still maturing{' '}
                {formatCurrency(payoutSummary.inHold, payoutSummary.currency)} · paid to date{' '}
                {formatCurrency(payoutSummary.paidToDate, payoutSummary.currency)}
              </Typography>
              <Typography variant="body2">
                {payoutSummary.payoutMethodReady
                  ? `Pay to ${payoutSummary.payoutDestinationLabel}`
                  : 'Vendor has not finished MoMo or bank details. Ask them to complete Vendor settings first.'}
              </Typography>
              <TextField
                label="Amount (GHS)"
                type="number"
                fullWidth
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                helperText="Record only after you have sent the MoMo or bank transfer"
                inputProps={{ min: 0, step: '0.01' }}
                sx={(th) => sxObject(th, authFormFieldSx)}
              />
              <TextField
                label="Transfer reference"
                fullWidth
                value={payoutReference}
                onChange={(e) => setPayoutReference(e.target.value)}
                helperText="MoMo or bank transaction ID"
                sx={(th) => sxObject(th, authFormFieldSx)}
              />
              <TextField
                label="Notes (optional)"
                fullWidth
                multiline
                rows={2}
                value={payoutNotes}
                onChange={(e) => setPayoutNotes(e.target.value)}
                sx={(th) => sxObject(th, authFormFieldSx)}
              />
              {payoutHistory.length > 0 ? (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Recent payouts
                  </Typography>
                  {payoutHistory.map((row) => (
                    <Typography
                      key={row.id}
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {formatCurrency(row.amount, row.currency)} · {new Date(row.paidAt).toLocaleDateString()}
                      {row.reference ? ` · ${row.reference}` : ''}
                    </Typography>
                  ))}
                </Box>
              ) : null}
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, flexWrap: 'wrap', gap: 1 }}>
          <Button
            onClick={() => setPayoutDialogOpen(false)}
            disabled={payoutSubmitting}
            sx={(th) => sxObject(th, compactOutlinedCtaSx)}
          >
            Cancel
          </Button>
          <Button
            onClick={() => void confirmRecordPayout()}
            variant="contained"
            disableElevation
            disabled={
              payoutLoading ||
              payoutSubmitting ||
              !payoutSummary?.payoutMethodReady ||
              (payoutSummary?.eligible ?? 0) <= 0
            }
            sx={(th) => sxObject(th, compactContainedCtaSx)}
          >
            {payoutSubmitting ? 'Recording…' : 'Record payout'}
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
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem' }}>Open vendor home?</DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            {pendingLoginVendor
              ? `Open “${pendingLoginVendor.name}” as that vendor? You can exit from the header.`
              : 'Open this vendor’s home?'}
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
            Open home
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


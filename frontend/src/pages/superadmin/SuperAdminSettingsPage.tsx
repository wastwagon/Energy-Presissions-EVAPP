import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Tabs,
  Tab,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Divider,
  InputAdornment,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PaymentIcon from '@mui/icons-material/Payment';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import { settingsApi } from '../../services/settingsApi';
import { tariffsApi } from '../../services/tariffsApi';
import {
  dashboardPageTitleSx,
  dashboardPageSubtitleSx,
  premiumPanelCardSx,
  premiumTableSurfaceSx,
} from '../../theme/jampackShell';
import {
  authFormFieldSx,
  compactContainedCtaSx,
  compactErrorContainedCtaSx,
  compactOutlinedCtaSx,
  premiumDialogPaperSx,
  premiumIconButtonTouchSx,
  sxObject,
} from '../../styles/authShell';
import { getStoredAccountType } from '../../utils/authSession';
import { useOpsBasePath } from '../../hooks/useOpsBasePath';
import { OpsQuickActions } from '../../components/dashboard/OpsQuickActions';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3, px: { xs: 1.5, sm: 2, md: 3 }, pb: { xs: 2, md: 3 } }}>{children}</Box>
      )}
    </div>
  );
}

function SuperAdminSettingsPage() {
  const opsBase = useOpsBasePath();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // System Settings State
  const [systemSettings, setSystemSettings] = useState<any[]>([]);
  const [editingSetting, setEditingSetting] = useState<string | null>(null);
  const [settingValue, setSettingValue] = useState<any>('');

  // Billing/Tariff State
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [tariffDialogOpen, setTariffDialogOpen] = useState(false);
  const [editingTariff, setEditingTariff] = useState<any | null>(null);
  const [deleteTariffDialogOpen, setDeleteTariffDialogOpen] = useState(false);
  const [pendingDeleteTariffId, setPendingDeleteTariffId] = useState<number | null>(null);
  const [tariffForm, setTariffForm] = useState({
    name: '',
    description: '',
    energyRate: '',
    timeRate: '',
    baseFee: '',
    currency: 'GHS',
    validFrom: '',
    validTo: '',
    isActive: true,
  });

  // CMS/Branding State
  const [systemName, setSystemName] = useState('');
  const [systemDescription, setSystemDescription] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 0) {
        // System Settings
        const settings = await settingsApi.getSystemSettings();
        setSystemSettings(settings);
        
        // Load system name and description
        const nameSetting = settings.find((s: any) => s.key === 'system_name');
        const descSetting = settings.find((s: any) => s.key === 'system_description');
        setSystemName(nameSetting?.value || '');
        setSystemDescription(descSetting?.value || '');
      } else if (activeTab === 1) {
        // Billing & Tariffs
        const data = await tariffsApi.getAll();
        setTariffs(data);
      } else if (activeTab === 2) {
        // CMS & Branding
        const settings = await settingsApi.getSystemSettings('branding');
        const nameSetting = settings.find((s: any) => s.key === 'system_name');
        const descSetting = settings.find((s: any) => s.key === 'system_description');
        setSystemName(nameSetting?.value || '');
        setSystemDescription(descSetting?.value || '');
        
        // Load logo
        try {
          const logo = await settingsApi.getActiveBrandingAsset('logo');
          if (logo?.filePath) {
            setLogoPreview(logo.filePath);
          }
        } catch (err) {
          // Logo not found, ignore
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSetting = async (key: string) => {
    try {
      setError(null);
      await settingsApi.updateSetting(key, settingValue);
      setSuccess(`Setting "${key}" updated successfully`);
      setEditingSetting(null);
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update setting');
    }
  };

  const handleSaveTariff = async () => {
    try {
      setError(null);
      const data = {
        ...tariffForm,
        currency: 'GHS', // Always GHS for Ghana operations
        energyRate: tariffForm.energyRate ? parseFloat(tariffForm.energyRate) : undefined,
        timeRate: tariffForm.timeRate ? parseFloat(tariffForm.timeRate) : undefined,
        baseFee: tariffForm.baseFee ? parseFloat(tariffForm.baseFee) : undefined,
        validFrom: tariffForm.validFrom ? new Date(tariffForm.validFrom).toISOString() : undefined,
        validTo: tariffForm.validTo ? new Date(tariffForm.validTo).toISOString() : undefined,
      };

      if (editingTariff) {
        await tariffsApi.update(editingTariff.id, data);
        setSuccess('Tariff updated successfully');
      } else {
        await tariffsApi.create(data);
        setSuccess('Tariff created successfully');
      }

      setTariffDialogOpen(false);
      setEditingTariff(null);
      setTariffForm({
        name: '',
        description: '',
        energyRate: '',
        timeRate: '',
        baseFee: '',
        currency: 'GHS',
        validFrom: '',
        validTo: '',
        isActive: true,
      });
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save tariff');
    }
  };

  const handleEditTariff = (tariff: any) => {
    setEditingTariff(tariff);
    setTariffForm({
      name: tariff.name,
      description: tariff.description || '',
      energyRate: tariff.energyRate?.toString() || '',
      timeRate: tariff.timeRate?.toString() || '',
      baseFee: tariff.baseFee?.toString() || '',
      currency: tariff.currency || 'GHS',
      validFrom: tariff.validFrom ? new Date(tariff.validFrom).toISOString().split('T')[0] : '',
      validTo: tariff.validTo ? new Date(tariff.validTo).toISOString().split('T')[0] : '',
      isActive: tariff.isActive,
    });
    setTariffDialogOpen(true);
  };

  const handleDeleteTariff = (id: number) => {
    setPendingDeleteTariffId(id);
    setDeleteTariffDialogOpen(true);
  };

  const confirmDeleteTariff = async () => {
    if (pendingDeleteTariffId == null) return;
    try {
      setError(null);
      await tariffsApi.delete(pendingDeleteTariffId);
      setSuccess('Tariff deleted successfully');
      setDeleteTariffDialogOpen(false);
      setPendingDeleteTariffId(null);
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete tariff');
    }
  };

  const handleSaveBranding = async () => {
    try {
      setError(null);
      
      // Update system name and description
      await settingsApi.updateSetting('system_name', systemName);
      await settingsApi.updateSetting('system_description', systemDescription);

      // Upload logo if selected
      if (logoFile) {
        const formData = new FormData();
        formData.append('file', logoFile);
        formData.append('assetType', 'logo');
        await settingsApi.uploadBrandingAsset(formData);
      }

      setSuccess('Branding settings saved successfully');
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save branding settings');
    }
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getSettingsByCategory = (category: string) => {
    return systemSettings.filter((s: any) => s.category === category);
  };

  const isSuperAdmin = getStoredAccountType() === 'SuperAdmin';
  
  // This page is only accessible to SuperAdmin (layout handles redirect)
  if (!isSuperAdmin) {
    return (
      <Box>
        <Alert severity="error">
          Access Denied. This page is only available to Super Administrators.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" component="h1" sx={dashboardPageTitleSx}>
            Platform Settings
          </Typography>
          <Typography variant="body2" sx={dashboardPageSubtitleSx}>
            Configure system behavior, tariffs, branding, and payment settings.
          </Typography>
        </Box>
      </Box>

      <OpsQuickActions opsBase={opsBase} />

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

      <Paper sx={premiumTableSurfaceSx}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile>
          {isSuperAdmin && (
            <Tab label="System Settings" icon={<SettingsIcon />} iconPosition="start" />
          )}
          <Tab label="Billing & Tariffs" icon={<AttachMoneyIcon />} iconPosition="start" />
          {isSuperAdmin && (
            <>
              <Tab label="CMS & Branding" icon={<CloudUploadIcon />} iconPosition="start" />
              <Tab label="Payment Gateway" icon={<PaymentIcon />} iconPosition="start" />
            </>
          )}
        </Tabs>

        {/* System Settings Tab - Only for SuperAdmin */}
        {isSuperAdmin && (
          <TabPanel value={activeTab} index={0}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              {/* OCPP Settings */}
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                OCPP Configuration
              </Typography>
              <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Setting</TableCell>
                      <TableCell>Value</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getSettingsByCategory('ocpp').map((setting: any) => (
                      <TableRow key={setting.key}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {setting.key}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {editingSetting === setting.key ? (
                            <TextField
                              size="small"
                              type={setting.dataType === 'number' ? 'number' : 'text'}
                              value={settingValue}
                              onChange={(e) => setSettingValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveSetting(setting.key);
                                }
                              }}
                              autoFocus
                              sx={(th) => sxObject(th, authFormFieldSx)}
                            />
                          ) : (
                            <Typography variant="body2">{setting.value || '-'}</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {setting.description || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {editingSetting === setting.key ? (
                            <IconButton
                              size="small"
                              sx={(th) => ({ ...sxObject(th, premiumIconButtonTouchSx) })}
                              color="primary"
                              onClick={() => handleSaveSetting(setting.key)}
                              aria-label={`Save setting ${setting.key}`}
                            >
                              <SaveIcon fontSize="small" />
                            </IconButton>
                          ) : (
                            <IconButton
                              size="small"
                              sx={(th) => ({ ...sxObject(th, premiumIconButtonTouchSx) })}
                              onClick={() => {
                                setEditingSetting(setting.key);
                                setSettingValue(setting.value || '');
                              }}
                              aria-label={`Edit setting ${setting.key}`}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Divider sx={{ my: 3 }} />

              {/* Notification Settings */}
              <Typography variant="h6" gutterBottom>
                Notification Settings
              </Typography>
              <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Setting</TableCell>
                      <TableCell>Value</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getSettingsByCategory('notification').map((setting: any) => (
                      <TableRow key={setting.key}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {setting.key}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {editingSetting === setting.key ? (
                            setting.dataType === 'boolean' ? (
                              <Switch
                                checked={settingValue === 'true' || settingValue === true}
                                onChange={(e) => setSettingValue(e.target.checked.toString())}
                              />
                            ) : (
                              <TextField
                                size="small"
                                type={setting.dataType === 'number' ? 'number' : setting.key.includes('password') ? 'password' : 'text'}
                                value={settingValue}
                                onChange={(e) => setSettingValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveSetting(setting.key);
                                  }
                                }}
                                autoFocus
                                sx={(th) => sxObject(th, authFormFieldSx)}
                              />
                            )
                          ) : (
                            <Typography variant="body2">
                              {setting.dataType === 'boolean'
                                ? setting.value === 'true' || setting.value === '1'
                                  ? 'Enabled'
                                  : 'Disabled'
                                : setting.key.includes('password')
                                ? '••••••••'
                                : setting.value || '-'}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {setting.description || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {editingSetting === setting.key ? (
                            <IconButton
                              size="small"
                              sx={(th) => ({ ...sxObject(th, premiumIconButtonTouchSx) })}
                              color="primary"
                              onClick={() => handleSaveSetting(setting.key)}
                              aria-label={`Save setting ${setting.key}`}
                            >
                              <SaveIcon fontSize="small" />
                            </IconButton>
                          ) : (
                            <IconButton
                              size="small"
                              sx={(th) => ({ ...sxObject(th, premiumIconButtonTouchSx) })}
                              onClick={() => {
                                setEditingSetting(setting.key);
                                setSettingValue(setting.value || '');
                              }}
                              aria-label={`Edit setting ${setting.key}`}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
          </TabPanel>
        )}

        {/* Billing & Tariffs Tab */}
        <TabPanel value={activeTab} index={isSuperAdmin ? 1 : 0}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}>
            <Typography variant="h6">Tariff Management</Typography>
            <Button
              variant="contained"
              disableElevation
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingTariff(null);
                setTariffForm({
                  name: '',
                  description: '',
                  energyRate: '',
                  timeRate: '',
                  baseFee: '',
                  currency: 'GHS',
                  validFrom: '',
                  validTo: '',
                  isActive: true,
                });
                setTariffDialogOpen(true);
              }}
              sx={(th) => ({
                ...sxObject(th, compactContainedCtaSx),
                width: { xs: '100%', sm: 'auto' },
              })}
            >
              Create Tariff
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Energy Rate</TableCell>
                    <TableCell>Time Rate</TableCell>
                    <TableCell>Base Fee</TableCell>
                    <TableCell>Currency</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tariffs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                          No tariffs found. Create your first tariff.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    tariffs.map((tariff) => (
                      <TableRow key={tariff.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {tariff.name}
                          </Typography>
                          {tariff.description && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {tariff.description}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {tariff.energyRate
                            ? `${tariff.energyRate} ${tariff.currency}/kWh`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {tariff.timeRate
                            ? `${tariff.timeRate} ${tariff.currency}/hour`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {tariff.baseFee ? `${tariff.baseFee} ${tariff.currency}` : '-'}
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
                          <IconButton
                            size="small"
                            sx={(th) => ({ ...sxObject(th, premiumIconButtonTouchSx) })}
                            onClick={() => handleEditTariff(tariff)}
                            color="primary"
                            aria-label={`Edit tariff ${tariff.name}`}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            sx={(th) => ({ ...sxObject(th, premiumIconButtonTouchSx) })}
                            onClick={() => handleDeleteTariff(tariff.id)}
                            color="error"
                            aria-label={`Delete tariff ${tariff.name}`}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Tariff Dialog */}
          <Dialog
            open={tariffDialogOpen}
            onClose={() => setTariffDialogOpen(false)}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: (th) => sxObject(th, premiumDialogPaperSx) }}
          >
            <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem' }}>
              {editingTariff ? 'Edit Tariff' : 'Create New Tariff'}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label="Tariff Name"
                      fullWidth
                      required
                      value={tariffForm.name}
                      onChange={(e) => setTariffForm({ ...tariffForm, name: e.target.value })}
                      sx={(th) => sxObject(th, authFormFieldSx)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Description"
                      fullWidth
                      multiline
                      rows={2}
                      value={tariffForm.description}
                      onChange={(e) => setTariffForm({ ...tariffForm, description: e.target.value })}
                      sx={(th) => sxObject(th, authFormFieldSx)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Energy Rate"
                      fullWidth
                      type="number"
                      value={tariffForm.energyRate}
                      onChange={(e) => setTariffForm({ ...tariffForm, energyRate: e.target.value })}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">GHS</InputAdornment>,
                        endAdornment: <InputAdornment position="end">per kWh</InputAdornment>,
                      }}
                      helperText="Cost per kilowatt-hour in GHS"
                      sx={(th) => sxObject(th, authFormFieldSx)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Time Rate"
                      fullWidth
                      type="number"
                      value={tariffForm.timeRate}
                      onChange={(e) => setTariffForm({ ...tariffForm, timeRate: e.target.value })}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">GHS</InputAdornment>,
                        endAdornment: <InputAdornment position="end">per hour</InputAdornment>,
                      }}
                      helperText="Cost per hour in GHS"
                      sx={(th) => sxObject(th, authFormFieldSx)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Base Fee"
                      fullWidth
                      type="number"
                      value={tariffForm.baseFee}
                      onChange={(e) => setTariffForm({ ...tariffForm, baseFee: e.target.value })}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">GHS</InputAdornment>,
                      }}
                      helperText="Fixed fee per transaction in GHS"
                      sx={(th) => sxObject(th, authFormFieldSx)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={tariffForm.isActive}
                          onChange={(e) => setTariffForm({ ...tariffForm, isActive: e.target.checked })}
                        />
                      }
                      label="Active"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Valid From"
                      fullWidth
                      type="date"
                      value={tariffForm.validFrom}
                      onChange={(e) => setTariffForm({ ...tariffForm, validFrom: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      sx={(th) => sxObject(th, authFormFieldSx)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Valid To"
                      fullWidth
                      type="date"
                      value={tariffForm.validTo}
                      onChange={(e) => setTariffForm({ ...tariffForm, validTo: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      sx={(th) => sxObject(th, authFormFieldSx)}
                    />
                  </Grid>
                </Grid>
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, pt: 1, flexWrap: 'wrap', gap: 1 }}>
              <Button onClick={() => setTariffDialogOpen(false)} sx={(th) => sxObject(th, compactOutlinedCtaSx)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveTariff}
                variant="contained"
                disableElevation
                disabled={!tariffForm.name}
                sx={(th) => sxObject(th, compactContainedCtaSx)}
              >
                {editingTariff ? 'Update' : 'Create'}
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={deleteTariffDialogOpen}
            onClose={() => setDeleteTariffDialogOpen(false)}
            fullWidth
            maxWidth="xs"
            PaperProps={{ sx: (th) => sxObject(th, premiumDialogPaperSx) }}
          >
            <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem' }}>Delete tariff?</DialogTitle>
            <DialogContent>
              <DialogContentText component="div">This action cannot be undone.</DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, pt: 1, flexWrap: 'wrap', gap: 1 }}>
              <Button onClick={() => setDeleteTariffDialogOpen(false)} sx={(th) => sxObject(th, compactOutlinedCtaSx)}>
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteTariff}
                variant="contained"
                disableElevation
                sx={(th) => sxObject(th, compactErrorContainedCtaSx)}
              >
                Delete
              </Button>
            </DialogActions>
          </Dialog>
        </TabPanel>

        {/* CMS & Branding Tab - Only for SuperAdmin */}
        {isSuperAdmin && (
          <TabPanel value={activeTab} index={2}>
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={premiumPanelCardSx}>
                <Typography variant="h6" gutterBottom>
                  System Information
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <TextField
                    label="System Name"
                    fullWidth
                    value={systemName}
                    onChange={(e) => setSystemName(e.target.value)}
                    sx={(th) => ({ ...sxObject(th, authFormFieldSx), mb: 2 })}
                  />
                  <TextField
                    label="System Description"
                    fullWidth
                    multiline
                    rows={3}
                    value={systemDescription}
                    onChange={(e) => setSystemDescription(e.target.value)}
                    sx={(th) => sxObject(th, authFormFieldSx)}
                  />
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={premiumPanelCardSx}>
                <Typography variant="h6" gutterBottom>
                  Logo Upload
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {logoPreview && (
                    <Box sx={{ mb: 2, textAlign: 'center' }}>
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        style={{ maxWidth: '200px', maxHeight: '100px', objectFit: 'contain' }}
                      />
                    </Box>
                  )}
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    startIcon={<CloudUploadIcon />}
                    sx={(th) => sxObject(th, compactOutlinedCtaSx)}
                  >
                    Upload Logo
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleLogoChange}
                    />
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Recommended: PNG or SVG, max 2MB
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                disableElevation
                startIcon={<SaveIcon />}
                onClick={handleSaveBranding}
                sx={(th) => ({
                  ...sxObject(th, compactContainedCtaSx),
                  width: { xs: '100%', sm: 'auto' },
                })}
              >
                Save Branding Settings
              </Button>
            </Grid>
          </Grid>
          </TabPanel>
        )}

        {/* Payment Gateway Tab - Only for SuperAdmin */}
        {isSuperAdmin && (
          <TabPanel value={activeTab} index={3}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Paystack Configuration
              </Typography>
              <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Setting</TableCell>
                      <TableCell>Value</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getSettingsByCategory('payment').map((setting: any) => (
                      <TableRow key={setting.key}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {setting.key}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {editingSetting === setting.key ? (
                            <TextField
                              size="small"
                              type={setting.key.includes('key') || setting.key.includes('secret') ? 'password' : 'text'}
                              fullWidth
                              value={settingValue}
                              onChange={(e) => setSettingValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveSetting(setting.key);
                                }
                              }}
                              autoFocus
                              sx={(th) => sxObject(th, authFormFieldSx)}
                            />
                          ) : (
                            <Typography variant="body2">
                              {setting.key.includes('key') || setting.key.includes('secret')
                                ? setting.value
                                  ? '••••••••'
                                  : 'Not set'
                                : setting.dataType === 'boolean'
                                ? setting.value === 'true' || setting.value === '1'
                                  ? 'Enabled'
                                  : 'Disabled'
                                : setting.value || '-'}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {setting.description || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {editingSetting === setting.key ? (
                            <IconButton
                              size="small"
                              sx={(th) => ({ ...sxObject(th, premiumIconButtonTouchSx) })}
                              color="primary"
                              onClick={() => handleSaveSetting(setting.key)}
                              aria-label={`Save setting ${setting.key}`}
                            >
                              <SaveIcon fontSize="small" />
                            </IconButton>
                          ) : (
                            <IconButton
                              size="small"
                              sx={(th) => ({ ...sxObject(th, premiumIconButtonTouchSx) })}
                              onClick={() => {
                                setEditingSetting(setting.key);
                                setSettingValue(setting.value || '');
                              }}
                              aria-label={`Edit setting ${setting.key}`}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
          </TabPanel>
        )}
      </Paper>
    </Box>
  );
}

export { SuperAdminSettingsPage };
export default SuperAdminSettingsPage;

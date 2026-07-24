import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Avatar,
  Alert,
  Divider,
  ListItem,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { GroupedListSection } from '../../components/ios/GroupedListSection';
import { GroupedListRow } from '../../components/ios/GroupedListRow';
import { AdaptiveSheet } from '../../components/ios/AdaptiveSheet';
import { useCustomerPullRefresh } from '../../contexts/CustomerPullRefreshContext';
import { iosGroupedListRowSx, iosGroupedRowDividerSx } from '../../theme/iosGroupedList';
import { alpha } from '@mui/material/styles';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import BadgeIcon from '@mui/icons-material/Badge';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { usersApi } from '../../services/usersApi';
import { authApi } from '../../services/authApi';
import { premiumPanelCardSx } from '../../theme/jampackShell';
import {
  authFormFieldSx,
  compactContainedCtaSx,
  compactErrorContainedCtaSx,
  compactOutlinedCtaSx,
  sxObject,
} from '../../styles/authShell';
import { triggerHaptic } from '../../utils/haptics';
import { getStoredUser } from '../../utils/authSession';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { AppBadge } from '../../components/ui/AppBadge';
import { useLiveRefresh } from '../../hooks/useLiveRefresh';
import { LIVE_DATA_LABELS } from '../../constants/liveDataLabels';
import { CustomerChromeSkeleton } from '../../components/dashboard/CustomerChromeSkeleton';
import { UserErrorAlert } from '../../components/UserErrorAlert';
import { formatUserFacingErrorMessage, UserMessages } from '../../utils/userFriendlyErrors';
import { TableSurfaceProgress } from '../../components/dashboard/TableSurfaceProgress';

export function CustomerProfilePage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down('md'));
  const [user, setUser] = useState<any>(null);
  const { loading, refreshing, updatedAt, runWithRefresh } = useLiveRefresh();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const loadUserData = useCallback(async (silent?: boolean) => {
    await runWithRefresh(async () => {
      try {
        setError(null);
        const userData = getStoredUser();
        if (!userData) {
          setUser(null);
          return false;
        }
        setUser(userData);
        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          phone: userData.phone || '',
        });
        return true;
      } catch (err: unknown) {
        setError(formatUserFacingErrorMessage(err, 'profile'));
        return false;
      }
    }, silent);
  }, [runWithRefresh]);

  useEffect(() => {
    void loadUserData();
  }, [loadUserData]);

  useCustomerPullRefresh(useCallback(() => void loadUserData(true), [loadUserData]));

  const handleSave = async () => {
    try {
      setError(null);
      setSuccess(null);
      if (typeof user?.id === 'number') {
        const updated = await usersApi.update(user.id, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
        });
        const updatedUser = { ...user, ...updated };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      } else {
        const updatedUser = { ...user, ...formData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
      triggerHaptic('success');
      setEditing(false);
      setSuccess('Profile updated successfully');
    } catch (err: any) {
      setError(formatUserFacingErrorMessage(err, 'profile'));
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      setError('Enter your password to confirm you want to delete your account.');
      return;
    }
    try {
      setDeleting(true);
      setError(null);
      await usersApi.deleteOwnAccount(deletePassword);
      authApi.logout();
      navigate('/login', { replace: true });
    } catch (err: any) {
      setError(formatUserFacingErrorMessage(err, 'profile'));
      setDeleting(false);
    }
  };

  const handleCloseDeleteDialog = () => {
    if (!deleting) {
      setDeleteDialogOpen(false);
      setDeletePassword('');
    }
  };

  if (loading && !user) {
    return <CustomerChromeSkeleton preset="profile" />;
  }

  if (!user) {
    return (
      <UserErrorAlert error={UserMessages.notSignedIn} context="profile" />
    );
  }

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden', position: 'relative' }}>
      <TableSurfaceProgress active={Boolean(loading && user)} ariaLabel="Refreshing profile" />
      <LivePageHeader
        title="Profile"
        subtitle="Name, contact details, and account security"
        updatedAt={updatedAt}
        liveLabel={LIVE_DATA_LABELS.profile}
        refreshing={refreshing}
        onRefresh={() => void loadUserData(true)}
        titleVariant="large"
        refreshSx={{ width: { xs: '100%', sm: 'auto' } }}
        actions={
          <Button
            variant={editing ? 'contained' : 'outlined'}
            disableElevation
            startIcon={editing ? <SaveIcon /> : <EditIcon />}
            onClick={editing ? handleSave : () => setEditing(true)}
            sx={(th) => ({
              ...sxObject(th, editing ? compactContainedCtaSx : compactOutlinedCtaSx),
              width: { xs: '100%', sm: 'auto' },
            })}
          >
            {editing ? 'Save changes' : 'Edit profile'}
          </Button>
        }
      />

      {error && (
        <UserErrorAlert error={error} context="profile" sx={{ mb: 3 }} onClose={() => setError(null)} />
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {!isCompact && (
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ ...premiumPanelCardSx, textAlign: 'center', py: { xs: 2.5, sm: 4 }, px: { xs: 2, sm: 3 }, mb: { xs: 0, md: 0 } }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '3rem',
                }}
              >
                {user.firstName?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                {user.lastName?.[0]?.toUpperCase() || ''}
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                {user.firstName} {user.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {user.email}
              </Typography>
              <AppBadge label={user.accountType} tone="brand" size="small" sx={{ mt: 2 }} />
            </Paper>
          </Grid>
        )}

        <Grid item xs={12} md={8}>
          {isCompact ? (
            <>
              <GroupedListSection>
                <ListItem sx={{ ...iosGroupedListRowSx, gap: 1.5 }} disablePadding>
                  <Avatar
                    sx={{
                      width: 56,
                      height: 56,
                      bgcolor: 'primary.main',
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {user.firstName?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                    {user.lastName?.[0]?.toUpperCase() || ''}
                  </Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                      {user.firstName} {user.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {user.email}
                    </Typography>
                    <AppBadge label={user.accountType} tone="brand" size="small" sx={{ mt: 0.75 }} />
                  </Box>
                </ListItem>
              </GroupedListSection>

              <GroupedListSection title="Personal information">
                {editing ? (
                  <>
                    <ListItem sx={{ ...iosGroupedListRowSx, display: 'block', py: 1.5 }} disablePadding>
                      <TextField
                        fullWidth
                        label="First name"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        sx={(th) => sxObject(th, authFormFieldSx)}
                      />
                    </ListItem>
                    <Divider sx={iosGroupedRowDividerSx} />
                    <ListItem sx={{ ...iosGroupedListRowSx, display: 'block', py: 1.5 }} disablePadding>
                      <TextField
                        fullWidth
                        label="Last name"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        sx={(th) => sxObject(th, authFormFieldSx)}
                      />
                    </ListItem>
                    <Divider sx={iosGroupedRowDividerSx} />
                    <ListItem sx={{ ...iosGroupedListRowSx, display: 'block', py: 1.5 }} disablePadding>
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        sx={(th) => sxObject(th, authFormFieldSx)}
                      />
                    </ListItem>
                    <Divider sx={iosGroupedRowDividerSx} />
                    <ListItem sx={{ ...iosGroupedListRowSx, display: 'block', py: 1.5 }} disablePadding>
                      <TextField
                        fullWidth
                        label="Phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        sx={(th) => sxObject(th, authFormFieldSx)}
                      />
                    </ListItem>
                  </>
                ) : (
                  <>
                    <GroupedListRow primary="First name" secondary={formData.firstName || '—'} showChevron={false} divider />
                    <GroupedListRow primary="Last name" secondary={formData.lastName || '—'} showChevron={false} divider />
                    <GroupedListRow primary="Email" secondary={formData.email || '—'} showChevron={false} divider />
                    <GroupedListRow primary="Phone" secondary={formData.phone || '—'} showChevron={false} />
                  </>
                )}
              </GroupedListSection>

              <GroupedListSection title="Account">
                <GroupedListRow primary="Account type" secondary={user.accountType} showChevron={false} divider />
                <GroupedListRow
                  primary="Member since"
                  secondary={
                    user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'N/A'
                  }
                  showChevron={false}
                />
              </GroupedListSection>

              {editing && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2.5 }}>
                  <Button
                    variant="contained"
                    disableElevation
                    onClick={handleSave}
                    startIcon={<SaveIcon />}
                    sx={(th) => ({ ...sxObject(th, compactContainedCtaSx), width: '100%' })}
                  >
                    Save changes
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setEditing(false);
                      void loadUserData(true);
                    }}
                    sx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), width: '100%' })}
                  >
                    Cancel
                  </Button>
                </Box>
              )}

              <GroupedListSection title="Danger zone">
                <ListItem sx={{ display: 'block', py: 2, px: 2 }} disablePadding>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Permanently delete your account. Enter your password to confirm.
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<DeleteForeverIcon />}
                    onClick={() => setDeleteDialogOpen(true)}
                    sx={(th) => ({
                      ...sxObject(th, compactOutlinedCtaSx),
                      width: '100%',
                      borderColor: alpha(th.palette.error.main, 0.45),
                      color: 'error.main',
                    })}
                  >
                    Delete account
                  </Button>
                </ListItem>
              </GroupedListSection>
            </>
          ) : (
          <Paper elevation={0} sx={premiumPanelCardSx}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 3 }}>
              Personal information
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  disabled={!editing}
                  sx={(th) => sxObject(th, authFormFieldSx)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  disabled={!editing}
                  sx={(th) => sxObject(th, authFormFieldSx)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!editing}
                  InputProps={{
                    startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  sx={(th) => sxObject(th, authFormFieldSx)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!editing}
                  InputProps={{
                    startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  sx={(th) => sxObject(th, authFormFieldSx)}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Account information
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <BadgeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Account Type
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {user.accountType}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AccountCircleIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Member Since
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'N/A'}
                </Typography>
              </Grid>
            </Grid>

            {editing && (
              <Box sx={{ mt: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5 }}>
                <Button
                  variant="contained"
                  disableElevation
                  onClick={handleSave}
                  startIcon={<SaveIcon />}
                  sx={(th) => ({ ...sxObject(th, compactContainedCtaSx), width: { xs: '100%', sm: 'auto' } })}
                >
                  Save changes
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setEditing(false);
                    loadUserData();
                  }}
                  sx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), width: { xs: '100%', sm: 'auto' } })}
                >
                  Cancel
                </Button>
              </Box>
            )}

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle1" color="error" sx={{ fontWeight: 600, mb: 1 }}>
              Danger zone
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Permanently delete your account. You will need to enter your current password to confirm.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<DeleteForeverIcon />}
              onClick={() => setDeleteDialogOpen(true)}
              sx={(th) => ({
                ...sxObject(th, compactOutlinedCtaSx),
                borderColor: alpha(th.palette.error.main, 0.45),
                color: 'error.main',
                '&:hover': {
                  borderColor: 'error.main',
                  bgcolor: alpha(th.palette.error.main, 0.06),
                },
              })}
            >
              Delete account
            </Button>
          </Paper>
          )}
        </Grid>
      </Grid>

      <AdaptiveSheet
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        title="Delete account"
        maxWidth="xs"
        disableClose={deleting}
        actions={
          <>
            <Button onClick={handleCloseDeleteDialog} disabled={deleting} sx={(th) => sxObject(th, compactOutlinedCtaSx)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              disableElevation
              onClick={handleDeleteAccount}
              disabled={deleting}
              sx={(th) => sxObject(th, compactErrorContainedCtaSx)}
            >
              {deleting ? 'Deleting…' : 'Delete my account'}
            </Button>
          </>
        }
      >
        <Typography variant="body2" sx={{ mb: 2 }}>
          This permanently removes your account. Billing and session records may be kept as required by law, but will no
          longer be linked to you in the app. This cannot be undone.
        </Typography>
        <TextField
          fullWidth
          type="password"
          label="Current password"
          value={deletePassword}
          onChange={(e) => setDeletePassword(e.target.value)}
          autoComplete="current-password"
          disabled={deleting}
          sx={(th) => sxObject(th, authFormFieldSx)}
        />
      </AdaptiveSheet>
    </Box>
  );
}


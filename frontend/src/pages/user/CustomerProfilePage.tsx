import { useState, useEffect } from 'react';
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
  CircularProgress,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
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
import { CustomerQuickActions } from '../../components/dashboard/CustomerQuickActions';
import { dashboardPageTitleSx, dashboardPageSubtitleSx, premiumPanelCardSx } from '../../theme/jampackShell';
import {
  authFormFieldSx,
  compactContainedCtaSx,
  compactErrorContainedCtaSx,
  compactOutlinedCtaSx,
  premiumDialogPaperSx,
  sxObject,
} from '../../styles/authShell';
import { getStoredUser } from '../../utils/authSession';

export function CustomerProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = () => {
    try {
      const userData = getStoredUser();
      if (userData) {
        setUser(userData);
        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          phone: userData.phone || '',
        });
      }
    } catch (e) {
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

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
      setEditing(false);
      setSuccess('Profile updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update profile');
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      setError('Enter your password to confirm account deletion.');
      return;
    }
    try {
      setDeleting(true);
      setError(null);
      await usersApi.deleteOwnAccount(deletePassword);
      authApi.logout();
      navigate('/login', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  const handleCloseDeleteDialog = () => {
    if (!deleting) {
      setDeleteDialogOpen(false);
      setDeletePassword('');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Alert severity="error">
        User data not found. Please log in again.
      </Alert>
    );
  }

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
        <Box sx={{ minWidth: 0, flex: '1 1 220px' }}>
          <Typography variant="h6" component="h1" sx={dashboardPageTitleSx}>
            My Profile
          </Typography>
          <Typography variant="body2" sx={dashboardPageSubtitleSx}>
            Manage your account information and preferences
          </Typography>
        </Box>
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
      </Box>

      <CustomerQuickActions preset="profile" />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ ...premiumPanelCardSx, textAlign: 'center', py: { xs: 3, sm: 4 }, px: { xs: 2, sm: 3 } }}>
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
            <Chip
              label={user.accountType}
              sx={{ mt: 2 }}
              color="primary"
              size="small"
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
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
        </Grid>
      </Grid>

      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: (th) => sxObject(th, premiumDialogPaperSx) }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem' }}>Delete account</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            This permanently removes your account. Billing and session records may be kept as required by law, but will
            no longer be linked to you in the app. This cannot be undone.
          </Typography>
          <TextField
            fullWidth
            type="password"
            label="Current password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            autoComplete="current-password"
            disabled={deleting}
            margin="dense"
            sx={(th) => sxObject(th, authFormFieldSx)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, flexWrap: 'wrap', gap: 1 }}>
          <Button
            onClick={handleCloseDeleteDialog}
            disabled={deleting}
            sx={(th) => sxObject(th, compactOutlinedCtaSx)}
          >
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
        </DialogActions>
      </Dialog>
    </Box>
  );
}


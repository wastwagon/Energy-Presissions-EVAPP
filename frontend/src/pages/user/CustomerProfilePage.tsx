import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Avatar,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import BadgeIcon from '@mui/icons-material/Badge';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { usersApi } from '../../services/usersApi';

export function CustomerProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
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
      if (user?.id) {
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
    if (!user?.id) return;
    try {
      setDeleting(true);
      setError(null);
      await usersApi.delete(user.id);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.href = '/login/user';
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to delete account');
      setDeleting(false);
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
    <Box>
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
            My Profile
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Manage your account information and preferences
          </Typography>
        </Box>
        <Button
          variant={editing ? 'contained' : 'outlined'}
          startIcon={editing ? <SaveIcon /> : <EditIcon />}
          onClick={editing ? handleSave : () => setEditing(true)}
        >
          {editing ? 'Save Changes' : 'Edit Profile'}
        </Button>
      </Box>

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
          <Card>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
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
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              Personal Information
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  disabled={!editing}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  disabled={!editing}
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
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!editing}
                  InputProps={{
                    startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Account Information
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
              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button variant="contained" onClick={handleSave} startIcon={<SaveIcon />}>
                  Save Changes
                </Button>
                <Button variant="outlined" onClick={() => {
                  setEditing(false);
                  loadUserData();
                }}>
                  Cancel
                </Button>
              </Box>
            )}

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" color="error" gutterBottom sx={{ mb: 1 }}>
              Danger Zone
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Permanently delete your account and all associated data. This action cannot be undone.
            </Typography>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteForeverIcon />}
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete Account
            </Button>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={deleteDialogOpen} onClose={() => !deleting && setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to permanently delete your account? All your data, wallet balance, and transaction history will be lost. This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleDeleteAccount} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


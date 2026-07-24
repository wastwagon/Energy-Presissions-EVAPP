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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  IconButton,
  Tooltip,
  Grid,
  InputAdornment,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { usersApi, User } from '../../services/usersApi';
import { premiumTableSurfaceSx } from '../../theme/jampackShell';
import {
  authFormFieldSx,
  staffFilterFieldSx,
  compactContainedCtaSx,
  compactErrorContainedCtaSx,
  compactOutlinedCtaSx,
  premiumDialogPaperSx,
  premiumIconButtonTouchSx,
  sxObject,
} from '../../styles/authShell';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { StaffFilterBar } from '../../components/dashboard/StaffFilterBar';
import { AppEmptyState } from '../../components/ui/AppEmptyState';
import { AppBadge, chipColorToBadgeTone } from '../../components/ui/AppBadge';
import PeopleIcon from '@mui/icons-material/People';
import { formatCurrency } from '../../utils/formatters';
import { getUserAccountStatusColor } from '../../utils/statusColors';
import { DashboardStaffChromeSkeleton } from '../../components/dashboard/DashboardStaffChromeSkeleton';
import { TableSurfaceProgress } from '../../components/dashboard/TableSurfaceProgress';
import { GroupedListSection } from '../../components/ios/GroupedListSection';
import { GroupedListRow } from '../../components/ios/GroupedListRow';

export function UserManagementPage() {
  const theme = useTheme();
  const useGroupedList = useMediaQuery(theme.breakpoints.down('md'));
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    accountType: 'Customer',
    status: 'Active',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    // Filter users based on search term
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        (user) =>
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.firstName && user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (user.lastName && user.lastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (user.phone && user.phone.includes(searchTerm)),
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await usersApi.getAll();
      setUsers(data);
      setFilteredUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      accountType: 'Customer',
      status: 'Active',
    });
    setCreateDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: '', // Don't pre-fill password
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      accountType: user.accountType || 'Customer',
      status: user.status || 'Active',
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleChangeRole = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.accountType);
    setRoleDialogOpen(true);
  };

  const confirmRoleChange = async () => {
    if (!selectedUser) return;

    try {
      setError(null);
      await usersApi.changeRole(selectedUser.id, newRole);
      setSuccess(`User role changed to ${newRole}`);
      setRoleDialogOpen(false);
      loadUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to change user role');
    }
  };

  const confirmCreate = async () => {
    try {
      setError(null);
      await usersApi.create(formData);
      setSuccess('User created successfully');
      setCreateDialogOpen(false);
      loadUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create user');
    }
  };

  const confirmEdit = async () => {
    if (!selectedUser) return;

    try {
      setError(null);
      const updateData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        accountType: formData.accountType,
        status: formData.status,
      };
      
      // Only include password if provided
      if (formData.password) {
        updateData.passwordHash = formData.password;
      }

      await usersApi.update(selectedUser.id, updateData);
      setSuccess('User updated successfully');
      setEditDialogOpen(false);
      loadUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update user');
    }
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;

    try {
      setError(null);
      await usersApi.delete(selectedUser.id);
      setSuccess('User deleted successfully');
      setDeleteDialogOpen(false);
      loadUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to delete user');
    }
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'SuperAdmin':
        return 'error';
      case 'Admin':
        return 'warning';
      case 'Customer':
        return 'primary';
      case 'WalkIn':
        return 'default';
      default:
        return 'default';
    }
  };

  if (loading && users.length === 0) {
    return <DashboardStaffChromeSkeleton preset="userManagement" />;
  }

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <LivePageHeader
        title="User Management"
        subtitle="Manage user accounts, roles, and account status."
        updatedAt={null}
        refreshing={false}
        onRefresh={() => undefined}
        showRefresh={false}
        showLiveMeta={false}
        actions={
          <Button
            variant="contained"
            disableElevation
            startIcon={<AddIcon />}
            onClick={handleCreate}
            sx={(th) => ({
              ...sxObject(th, compactContainedCtaSx),
              width: { xs: '100%', sm: 'auto' },
            })}
          >
            Create user
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

      <StaffFilterBar aria-label="User search">
        <TextField
          placeholder="Search users…"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setSearchTerm('')}
                  aria-label="Clear user search"
                  sx={(th) => ({ ...sxObject(th, premiumIconButtonTouchSx) })}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={(th) => ({
            ...sxObject(th, staffFilterFieldSx),
            width: { xs: '100%', sm: 320 },
            maxWidth: '100%',
          })}
        />
      </StaffFilterBar>

      <Paper elevation={0} sx={{ ...premiumTableSurfaceSx, position: 'relative' }}>
        <TableSurfaceProgress active={loading && users.length > 0} ariaLabel="Loading users" />
        <Box sx={{ px: { xs: 2, sm: 2.5 }, py: { xs: 1.75, sm: 2 }, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            All users ({filteredUsers.length})
          </Typography>
        </Box>
        {filteredUsers.length === 0 ? (
          <AppEmptyState
            sx={{ border: 0, boxShadow: 'none', borderRadius: 0 }}
            icon={<PeopleIcon />}
            title={searchTerm ? 'No users match your search' : 'No users found'}
            description={
              searchTerm
                ? 'Try another name or email, or clear the search.'
                : 'Create a user to grant portal access.'
            }
            primaryAction={
              searchTerm
                ? {
                    label: 'Clear search',
                    onClick: () => setSearchTerm(''),
                    variant: 'secondary',
                  }
                : {
                    label: 'Create user',
                    onClick: handleCreate,
                    startIcon: <AddIcon />,
                  }
            }
          />
        ) : useGroupedList ? (
          <Box sx={{ py: 1 }}>
            <GroupedListSection>
              {filteredUsers.map((user, index) => (
                <GroupedListRow
                  key={user.id}
                  divider={index < filteredUsers.length - 1}
                  primary={`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}
                  secondary={user.email}
                  end={
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(user.balance != null ? Number(user.balance) : 0, 'GHS')}
                      </Typography>
                      <AppBadge
                        label={user.accountType}
                        tone={chipColorToBadgeTone(
                          getAccountTypeColor(user.accountType) as
                            | 'default'
                            | 'primary'
                            | 'warning'
                            | 'error',
                        )}
                        sx={{ mt: 0.5, height: 22 }}
                      />
                    </Box>
                  }
                  onClick={() => handleEdit(user)}
                  aria-label={`Edit user ${user.email}`}
                />
              ))}
            </GroupedListSection>
          </Box>
        ) : (
        <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Account</TableCell>
                <TableCell>Balance</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {[user.firstName, user.lastName].filter(Boolean).join(' ') || user.email}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {user.email}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID {user.id} · joined {new Date(user.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>{user.phone || '—'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
                        <AppBadge
                          label={user.accountType}
                          tone={chipColorToBadgeTone(
                            getAccountTypeColor(user.accountType) as
                              | 'default'
                              | 'primary'
                              | 'warning'
                              | 'error',
                          )}
                        />
                        <AppBadge
                          label={user.status}
                          tone={chipColorToBadgeTone(getUserAccountStatusColor(user.status))}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(
                        user.balance != null ? Number(user.balance) : 0,
                        'GHS',
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Change role">
                          <IconButton
                            onClick={() => handleChangeRole(user)}
                            color="secondary"
                            aria-label={`Change role for ${user.email}`}
                            sx={(th) => ({ ...sxObject(th, premiumIconButtonTouchSx) })}
                          >
                            <AdminPanelSettingsIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit user">
                          <IconButton
                            onClick={() => handleEdit(user)}
                            color="primary"
                            aria-label={`Edit user ${user.email}`}
                            sx={(th) => ({ ...sxObject(th, premiumIconButtonTouchSx) })}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete user">
                          <IconButton
                            onClick={() => handleDelete(user)}
                            color="error"
                            disabled={user.accountType === 'SuperAdmin'}
                            aria-label={`Delete user ${user.email}`}
                            sx={(th) => ({ ...sxObject(th, premiumIconButtonTouchSx) })}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        )}
      </Paper>

      {/* Create User Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: (th) => sxObject(th, premiumDialogPaperSx) }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem' }}>Create new user</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                sx={(th) => sxObject(th, authFormFieldSx)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Password"
                type="password"
                fullWidth
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                sx={(th) => sxObject(th, authFormFieldSx)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="First name"
                fullWidth
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                sx={(th) => sxObject(th, authFormFieldSx)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Last name"
                fullWidth
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                sx={(th) => sxObject(th, authFormFieldSx)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Phone"
                fullWidth
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                sx={(th) => sxObject(th, authFormFieldSx)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Account type"
                fullWidth
                value={formData.accountType}
                onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                sx={(th) => sxObject(th, authFormFieldSx)}
              >
                <MenuItem value="Customer">Customer</MenuItem>
                <MenuItem value="Admin">Admin</MenuItem>
                <MenuItem value="SuperAdmin">Super Admin</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Status"
                fullWidth
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                sx={(th) => sxObject(th, authFormFieldSx)}
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
                <MenuItem value="Suspended">Suspended</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, flexWrap: 'wrap', gap: 1 }}>
          <Button onClick={() => setCreateDialogOpen(false)} sx={(th) => sxObject(th, compactOutlinedCtaSx)}>
            Cancel
          </Button>
          <Button
            onClick={confirmCreate}
            variant="contained"
            disableElevation
            disabled={!formData.email || !formData.password}
            sx={(th) => sxObject(th, compactContainedCtaSx)}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: (th) => sxObject(th, premiumDialogPaperSx) }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem' }}>Edit user</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  required
                  value={formData.email}
                  disabled
                  helperText="Email cannot be changed"
                  sx={(th) => sxObject(th, authFormFieldSx)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="New password (leave blank to keep current)"
                  type="password"
                  fullWidth
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  sx={(th) => sxObject(th, authFormFieldSx)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="First name"
                  fullWidth
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  sx={(th) => sxObject(th, authFormFieldSx)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Last name"
                  fullWidth
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  sx={(th) => sxObject(th, authFormFieldSx)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Phone"
                  fullWidth
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  sx={(th) => sxObject(th, authFormFieldSx)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Account type"
                  fullWidth
                  value={formData.accountType}
                  onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                  sx={(th) => sxObject(th, authFormFieldSx)}
                >
                  <MenuItem value="Customer">Customer</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="SuperAdmin">Super Admin</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Status"
                  fullWidth
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  sx={(th) => sxObject(th, authFormFieldSx)}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                  <MenuItem value="Suspended">Suspended</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, flexWrap: 'wrap', gap: 1 }}>
          <Button onClick={() => setEditDialogOpen(false)} sx={(th) => sxObject(th, compactOutlinedCtaSx)}>
            Cancel
          </Button>
          <Button onClick={confirmEdit} variant="contained" disableElevation sx={(th) => sxObject(th, compactContainedCtaSx)}>
            Save changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{ sx: (th) => sxObject(th, premiumDialogPaperSx) }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem' }}>Delete user</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user <strong>{selectedUser?.email}</strong>?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, flexWrap: 'wrap', gap: 1 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={(th) => sxObject(th, compactOutlinedCtaSx)}>
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            disableElevation
            sx={(th) => sxObject(th, compactErrorContainedCtaSx)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog
        open={roleDialogOpen}
        onClose={() => setRoleDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: (th) => sxObject(th, premiumDialogPaperSx) }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem' }}>Change user role</DialogTitle>
            <DialogContent>
              {selectedUser && (
                <Box sx={{ pt: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    User: <strong>{selectedUser.firstName} {selectedUser.lastName}</strong> ({selectedUser.email})
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                    Current Role: <strong>{selectedUser.accountType}</strong>
                  </Typography>

                  <TextField
                    select
                    label="New role"
                    fullWidth
                    margin="normal"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    sx={(th) => sxObject(th, authFormFieldSx)}
                  >
                    <MenuItem value="Customer">Customer</MenuItem>
                    <MenuItem value="Admin">Admin</MenuItem>
                    <MenuItem value="SuperAdmin" disabled={selectedUser.accountType !== 'SuperAdmin'}>
                      Super Admin (Cannot change to SuperAdmin)
                    </MenuItem>
                    <MenuItem value="WalkIn">Walk-In</MenuItem>
                  </TextField>

                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Changing a user's role will affect their access permissions immediately.
                  </Alert>
                </Box>
              )}
            </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, flexWrap: 'wrap', gap: 1 }}>
          <Button onClick={() => setRoleDialogOpen(false)} sx={(th) => sxObject(th, compactOutlinedCtaSx)}>
            Cancel
          </Button>
          <Button
            onClick={confirmRoleChange}
            variant="contained"
            color="primary"
            disableElevation
            disabled={newRole === selectedUser?.accountType}
            sx={(th) => sxObject(th, compactContainedCtaSx)}
          >
            Change role
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


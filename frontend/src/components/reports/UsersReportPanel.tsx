import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import { usersApi, type User } from '../../services/usersApi';
import { GroupedListSection } from '../ios/GroupedListSection';
import { GroupedListRow } from '../ios/GroupedListRow';
import { AppBadge } from '../ui/AppBadge';
import { AppEmptyState } from '../ui/AppEmptyState';
import { premiumTableSurfaceSx } from '../../theme/jampackShell';

interface UsersReportPanelProps {
  /** Vendor Admin: only users for this vendor */
  vendorId?: number;
}

export function UsersReportPanel({ vendorId }: UsersReportPanelProps) {
  const theme = useTheme();
  const useGroupedList = useMediaQuery(theme.breakpoints.down('md'));
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const all = await usersApi.getAll();
      setUsers(all);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const byType = useMemo(() => {
    const map = new Map<string, number>();
    for (const u of users) {
      const t = u.accountType || 'Unknown';
      map.set(t, (map.get(t) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [users]);

  const activeCount = useMemo(() => users.filter((u) => u.status === 'Active').length, [users]);

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
        {error}
      </Alert>
    );
  }

  if (loading) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
        Loading users…
      </Typography>
    );
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {users.length} users · {activeCount} active
        {vendorId != null ? ' (vendor scope)' : ''}
      </Typography>

      {users.length === 0 ? (
        <AppEmptyState
          sx={{ border: 0, boxShadow: 'none', borderRadius: 0 }}
          icon={<PeopleIcon />}
          title="No users found"
          description="User accounts will appear here once they are created."
        />
      ) : useGroupedList ? (
        <>
          <GroupedListSection title="By account type">
            {byType.map(([type, count], index) => (
              <GroupedListRow
                key={type}
                divider={index < byType.length - 1}
                showChevron={false}
                primary={type}
                secondary={`${count} accounts`}
              />
            ))}
          </GroupedListSection>
          <GroupedListSection title="All users" sx={{ mt: 2 }}>
            {users.slice(0, 50).map((u, index) => (
              <GroupedListRow
                key={u.id}
                divider={index < Math.min(users.length, 50) - 1}
                showChevron={false}
                primary={`${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email}
                secondary={u.email}
                end={
                  <AppBadge
                    label={u.accountType}
                    size="small"
                    tone={u.status === 'Active' ? 'success' : 'neutral'}
                  />
                }
              />
            ))}
          </GroupedListSection>
        </>
      ) : (
        <>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {byType.map(([type, count]) => (
              <AppBadge key={type} label={`${type}: ${count}`} tone="neutral" size="small" />
            ))}
          </Box>
          <Box sx={premiumTableSurfaceSx}>
            <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Joined</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                          No users
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((u) => (
                      <TableRow key={u.id} hover>
                        <TableCell>
                          {`${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || '—'}
                        </TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.accountType}</TableCell>
                        <TableCell>
                          <AppBadge
                            label={u.status}
                            size="small"
                            tone={u.status === 'Active' ? 'success' : 'neutral'}
                          />
                        </TableCell>
                        <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </>
      )}
    </Box>
  );
}

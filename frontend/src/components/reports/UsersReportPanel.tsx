import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
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
import { usersApi, type User } from '../../services/usersApi';
import { GroupedListSection } from '../ios/GroupedListSection';
import { GroupedListRow } from '../ios/GroupedListRow';
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

      {useGroupedList ? (
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
                  <Chip
                    label={u.accountType}
                    size="small"
                    color={u.status === 'Active' ? 'success' : 'default'}
                    sx={{ height: 22 }}
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
              <Chip key={type} label={`${type}: ${count}`} variant="outlined" />
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
                          <Chip
                            label={u.status}
                            size="small"
                            color={u.status === 'Active' ? 'success' : 'default'}
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

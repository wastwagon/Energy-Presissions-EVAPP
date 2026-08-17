import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
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
import DownloadIcon from '@mui/icons-material/Download';
import PeopleIcon from '@mui/icons-material/People';
import { usersApi, type User } from '../../services/usersApi';
import { GroupedListSection } from '../ios/GroupedListSection';
import { GroupedListRow } from '../ios/GroupedListRow';
import { AppBadge } from '../ui/AppBadge';
import { AppEmptyState } from '../ui/AppEmptyState';
import { premiumTableSurfaceSx } from '../../theme/jampackShell';
import { compactContainedCtaSx, sxObject } from '../../styles/authShell';
import { downloadCsv } from '../../utils/reportExport';
import { reportSnapshotFilename } from '../../utils/reportPeriod';
import { ADMIN_ROUTES, SUPERADMIN_ROUTES } from '../../config/staffNav.paths';

interface UsersReportPanelProps {
  /** Vendor Admin: only users for this vendor */
  vendorId?: number;
}

function displayName(u: User): string {
  return `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email;
}

export function UsersReportPanel({ vendorId }: UsersReportPanelProps) {
  const navigate = useNavigate();
  const location = useLocation();
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

  const scoped = useMemo(() => {
    if (vendorId == null) return users;
    return users.filter((u) => u.vendorId === vendorId);
  }, [users, vendorId]);

  const byType = useMemo(() => {
    const map = new Map<string, number>();
    for (const u of scoped) {
      const t = u.accountType || 'Unknown';
      map.set(t, (map.get(t) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [scoped]);

  const activeCount = useMemo(
    () => scoped.filter((u) => u.status === 'Active').length,
    [scoped],
  );

  const exportCsv = () => {
    downloadCsv(
      reportSnapshotFilename('users-report'),
      ['Name', 'Email', 'Type', 'Status', 'Joined'],
      scoped.map((u) => [
        displayName(u),
        u.email,
        u.accountType,
        u.status,
        new Date(u.createdAt).toISOString().slice(0, 10),
      ]),
    );
  };

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
      <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, mb: 2 }}>
        <Button
          variant="contained"
          disableElevation
          size="small"
          startIcon={<DownloadIcon />}
          disabled={scoped.length === 0}
          onClick={exportCsv}
          sx={(th) => ({
            ...sxObject(th, compactContainedCtaSx),
            width: { xs: '100%', sm: 'auto' },
            minHeight: 44,
          })}
        >
          Export CSV
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontVariantNumeric: 'tabular-nums' }}>
        {scoped.length} users · {activeCount} active
        {vendorId != null ? ' (this vendor)' : ''}
      </Typography>

      {scoped.length === 0 ? (
        <AppEmptyState
          sx={{ border: 0, boxShadow: 'none', borderRadius: 0 }}
          icon={<PeopleIcon />}
          title="No users found"
          description="User accounts will appear here once they are created."
          primaryAction={{
            label: 'Open Users',
            onClick: () =>
              navigate(
                location.pathname.startsWith('/superadmin')
                  ? SUPERADMIN_ROUTES.users
                  : ADMIN_ROUTES.users,
              ),
            variant: 'secondary',
          }}
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
                secondaryTypographyProps={{ sx: { fontVariantNumeric: 'tabular-nums' } }}
              />
            ))}
          </GroupedListSection>
          <GroupedListSection title="All users" sx={{ mt: 2 }}>
            {scoped.slice(0, 50).map((u, index) => (
              <GroupedListRow
                key={u.id}
                divider={index < Math.min(scoped.length, 50) - 1}
                showChevron={false}
                primary={displayName(u)}
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
                  {scoped.map((u) => (
                    <TableRow key={u.id} hover>
                      <TableCell>{displayName(u) === u.email ? '—' : displayName(u)}</TableCell>
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
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </>
      )}
    </Box>
  );
}

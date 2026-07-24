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
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import { auditApi, AuditLog } from '../../services/auditApi';
import { premiumTableSurfaceSx } from '../../theme/jampackShell';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { AppEmptyState } from '../../components/ui/AppEmptyState';
import { AppBadge } from '../../components/ui/AppBadge';
import { DashboardStaffChromeSkeleton } from '../../components/dashboard/DashboardStaffChromeSkeleton';
import { TableSurfaceProgress } from '../../components/dashboard/TableSurfaceProgress';
import { GroupedListSection } from '../../components/ios/GroupedListSection';
import { GroupedListRow } from '../../components/ios/GroupedListRow';

export function SuperAdminSecurityLogsPage() {
  const theme = useTheme();
  const useGroupedList = useMediaQuery(theme.breakpoints.down('md'));
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const { logs: data } = await auditApi.getLogs(200, 0);
      setLogs(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  if (loading && logs.length === 0) {
    return <DashboardStaffChromeSkeleton preset="auditLogs" />;
  }

  const formatDetails = (log: AuditLog) => {
    if (!log.details) return '-';
    const text = JSON.stringify(log.details);
    return text.length > 80 ? `${text.slice(0, 80)}…` : text;
  };

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <LivePageHeader
        title="Security & Logs"
        subtitle="Audit trail of system activity"
        updatedAt={null}
        refreshing={false}
        onRefresh={() => undefined}
        showRefresh={false}
        showLiveMeta={false}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper elevation={0} sx={{ ...premiumTableSurfaceSx, position: 'relative' }}>
        <TableSurfaceProgress active={loading && logs.length > 0} ariaLabel="Loading audit logs" />
        {logs.length === 0 ? (
          <AppEmptyState
            sx={{ border: 0, boxShadow: 'none', borderRadius: 0 }}
            icon={<SecurityIcon />}
            title="No audit logs yet"
            description="Logs will appear as users perform actions across the platform."
          />
        ) : useGroupedList ? (
          <Box sx={{ py: 1 }}>
            <GroupedListSection>
              {logs.map((log, index) => (
                <GroupedListRow
                  key={log.id}
                  divider={index < logs.length - 1}
                  showChevron={false}
                  primary={log.action}
                  secondary={`${log.user?.email ?? (log.userId ? `User #${log.userId}` : 'System')} · ${new Date(log.createdAt).toLocaleString()}`}
                  end={
                    <AppBadge label={log.entityType || '—'} tone="neutral" sx={{ height: 22, maxWidth: 96 }} />
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
                  <TableCell>Time</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Entity</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <AppBadge label={log.action} tone="neutral" />
                    </TableCell>
                    <TableCell>
                      {log.user?.email ?? (log.userId ? `User #${log.userId}` : 'System')}
                    </TableCell>
                    <TableCell>
                      {log.entityType && log.entityId ? `${log.entityType} #${log.entityId}` : '-'}
                    </TableCell>
                    <TableCell>{formatDetails(log)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}

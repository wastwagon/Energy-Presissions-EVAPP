import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Paper,
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
import EvStationIcon from '@mui/icons-material/EvStation';
import { useNavigate } from 'react-router-dom';
import { transactionsApi, type Transaction } from '../../services/transactionsApi';
import { premiumPanelCardSx, premiumTableSurfaceSx } from '../../theme/jampackShell';
import { compactOutlinedCtaSx, sxObject } from '../../styles/authShell';
import { GroupedListSection } from '../ios/GroupedListSection';
import { GroupedListRow } from '../ios/GroupedListRow';
import { AppBadge, chipColorToBadgeTone } from '../ui/AppBadge';
import { AppEmptyState } from '../ui/AppEmptyState';
import { StaffStatusTabs } from './StaffStatusTabs';
import { getTransactionStatusColor } from '../../utils/statusColors';
import {
  formatCustomerDisplayName,
  formatSessionCost,
  formatSessionDuration,
  formatSessionEnergy,
  sessionStatusChipColor,
  sessionStatusLabel,
} from '../../utils/sessionDisplay';
import { ADMIN_ROUTES, SUPERADMIN_ROUTES } from '../../config/staffNav.paths';

type SessionTab = 'all' | 'active' | 'completed' | 'other';

const FETCH_LIMIT = 12;

function matchesTab(tx: Transaction, tab: SessionTab): boolean {
  const status = (tx.status || '').toLowerCase();
  if (tab === 'all') return true;
  if (tab === 'active') return status === 'active' || Boolean(tx.recordPending);
  if (tab === 'completed') return status === 'completed' || status === 'succeeded';
  return status !== 'active' && status !== 'completed' && status !== 'succeeded' && !tx.recordPending;
}

type StaffDashboardRecentSessionsProps = {
  variant: 'admin' | 'superadmin';
  /** Bump to reload after parent refresh */
  refreshKey?: number | string;
};

export function StaffDashboardRecentSessions({
  variant,
  refreshKey = 0,
}: StaffDashboardRecentSessionsProps) {
  const navigate = useNavigate();
  const theme = useTheme();
  const useGroupedList = useMediaQuery(theme.breakpoints.down('md'));
  const [tab, setTab] = useState<SessionTab>('all');
  const [rows, setRows] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sessionsPath =
    variant === 'admin' ? ADMIN_ROUTES.opsSessions : SUPERADMIN_ROUTES.opsSessions;

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await transactionsApi.getAll(FETCH_LIMIT, 0);
      setRows(data.transactions ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const filtered = useMemo(() => rows.filter((tx) => matchesTab(tx, tab)), [rows, tab]);

  const openSession = (tx: Transaction) => {
    if (tx.recordPending) {
      navigate(
        variant === 'admin'
          ? `${ADMIN_ROUTES.opsDevices}/${encodeURIComponent(tx.chargePointId)}`
          : `${SUPERADMIN_ROUTES.opsDevices}/${encodeURIComponent(tx.chargePointId)}`,
      );
      return;
    }
    navigate(`${sessionsPath}/${tx.transactionId}`);
  };

  return (
    <Paper elevation={0} sx={{ ...premiumPanelCardSx, overflow: 'hidden' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          gap: 1.5,
          px: { xs: 1.75, sm: 2 },
          pt: { xs: 1.75, sm: 2 },
          pb: 1,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
            Recent sessions
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Latest charging activity
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          onClick={() => navigate(sessionsPath)}
          sx={(th) => ({
            ...sxObject(th, compactOutlinedCtaSx),
            width: { xs: '100%', sm: 'auto' },
            alignSelf: { xs: 'stretch', sm: 'center' },
          })}
        >
          View all
        </Button>
      </Box>

      <Box sx={{ px: { xs: 1.75, sm: 2 }, pb: 1.5 }}>
        <StaffStatusTabs
          aria-label="Session status filter"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'completed', label: 'Completed' },
            { value: 'other', label: 'Other' },
          ]}
        />
      </Box>

      {error ? (
        <Typography variant="body2" color="error" sx={{ px: 2, pb: 2 }}>
          {error}
        </Typography>
      ) : null}

      {loading ? (
        <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 3, textAlign: 'center' }}>
          Loading sessions…
        </Typography>
      ) : null}

      {!loading && !error && filtered.length === 0 ? (
        <AppEmptyState
          sx={{ border: 0, boxShadow: 'none', borderRadius: 0, py: 2, mx: 1 }}
          icon={<EvStationIcon />}
          title="No sessions in this view"
          description="Try another tab, or open the full sessions list."
          primaryAction={{ label: 'Open sessions', onClick: () => navigate(sessionsPath) }}
        />
      ) : null}

      {!loading && filtered.length > 0 && useGroupedList ? (
        <Box sx={{ px: 1, pb: 1.5 }}>
          <GroupedListSection>
            {filtered.map((tx, index) => (
              <GroupedListRow
                key={`${tx.chargePointId}-${tx.connectorId}-${tx.transactionId}-${tx.id}`}
                divider={index < filtered.length - 1}
                primary={formatCustomerDisplayName(tx)}
                secondary={`${tx.chargePointId} · ${formatSessionEnergy(tx)} · ${formatSessionDuration(tx)}`}
                end={
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                      {formatSessionCost(tx)}
                    </Typography>
                    <AppBadge
                      label={tx.recordPending ? 'Active (connector)' : sessionStatusLabel(tx)}
                      tone={chipColorToBadgeTone(
                        tx.recordPending
                          ? getTransactionStatusColor('Active')
                          : sessionStatusChipColor(sessionStatusLabel(tx)),
                      )}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                }
                onClick={() => openSession(tx)}
              />
            ))}
          </GroupedListSection>
        </Box>
      ) : null}

      {!loading && filtered.length > 0 && !useGroupedList ? (
        <TableContainer sx={{ ...premiumTableSurfaceSx, border: 0, borderRadius: 0, overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Customer</TableCell>
                <TableCell>Charge point</TableCell>
                <TableCell>Started</TableCell>
                <TableCell>Energy</TableCell>
                <TableCell>Cost</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((tx) => (
                <TableRow
                  key={`${tx.chargePointId}-${tx.connectorId}-${tx.transactionId}-${tx.id}`}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => openSession(tx)}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter' && e.key !== ' ') return;
                    e.preventDefault();
                    openSession(tx);
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <TableCell>{formatCustomerDisplayName(tx)}</TableCell>
                  <TableCell>{tx.chargePointId}</TableCell>
                  <TableCell>{new Date(tx.startTime).toLocaleString()}</TableCell>
                  <TableCell>{formatSessionEnergy(tx)}</TableCell>
                  <TableCell>{formatSessionCost(tx)}</TableCell>
                  <TableCell>
                    <AppBadge
                      label={tx.recordPending ? 'Active (connector)' : sessionStatusLabel(tx)}
                      tone={chipColorToBadgeTone(
                        tx.recordPending
                          ? getTransactionStatusColor('Active')
                          : sessionStatusChipColor(sessionStatusLabel(tx)),
                      )}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}
    </Paper>
  );
}

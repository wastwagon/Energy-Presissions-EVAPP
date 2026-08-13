import { useCallback, useEffect, useMemo, useState } from 'react';
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
import EvStationIcon from '@mui/icons-material/EvStation';
import { reportsApi } from '../../services/dashboardApi';
import type { Transaction } from '../../services/transactionsApi';
import { GroupedListSection } from '../ios/GroupedListSection';
import { GroupedListRow } from '../ios/GroupedListRow';
import { AppBadge, chipColorToBadgeTone } from '../ui/AppBadge';
import { AppEmptyState } from '../ui/AppEmptyState';
import { premiumTableSurfaceSx } from '../../theme/jampackShell';
import { compactContainedCtaSx, sxObject } from '../../styles/authShell';
import {
  formatCustomerDisplayName,
  formatSessionCost,
  formatSessionDuration,
  formatSessionEnergy,
  sessionStatusChipColor,
  sessionStatusLabel,
} from '../../utils/sessionDisplay';
import { downloadSessionsReportCsv } from '../../utils/reportExport';
import { StaffPeriodChips, type StaffPeriodDays } from '../dashboard/StaffPeriodChips';
import { StaffFilterBar } from '../dashboard/StaffFilterBar';
import { filterTransactionsByPeriodDays, reportExportFilename } from '../../utils/reportPeriod';

interface SessionsReportPanelProps {
  vendorId?: number;
  limit?: number;
  periodDays?: StaffPeriodDays;
  onPeriodChange?: (days: StaffPeriodDays) => void;
  hidePeriodControls?: boolean;
}

export function SessionsReportPanel({
  vendorId,
  limit = 100,
  periodDays: controlledDays,
  onPeriodChange,
  hidePeriodControls = false,
}: SessionsReportPanelProps) {
  const theme = useTheme();
  const useGroupedList = useMediaQuery(theme.breakpoints.down('md'));
  const [localDays, setLocalDays] = useState<StaffPeriodDays>(30);
  const periodDays = controlledDays ?? localDays;
  const setPeriodDays = onPeriodChange ?? setLocalDays;
  const [rows, setRows] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await reportsApi.getSessionRows(limit, 0, vendorId);
      setRows(data.transactions);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [limit, vendorId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredRows = useMemo(
    () => filterTransactionsByPeriodDays(rows, periodDays),
    [rows, periodDays],
  );

  const exportCsv = () => {
    downloadSessionsReportCsv(filteredRows, reportExportFilename('sessions-report', periodDays));
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {!hidePeriodControls ? (
        <StaffFilterBar aria-label="Sessions period and export" sx={{ mb: 2 }}>
          <StaffPeriodChips value={periodDays} onChange={setPeriodDays} disabled={loading} />
          <Button
            variant="contained"
            disableElevation
            size="small"
            startIcon={<DownloadIcon />}
            disabled={loading || filteredRows.length === 0}
            onClick={exportCsv}
            sx={(th) => ({
              ...sxObject(th, compactContainedCtaSx),
              ml: { xs: 0, sm: 'auto' },
              width: { xs: '100%', sm: 'auto' },
              minHeight: 44,
            })}
          >
            Export CSV
          </Button>
        </StaffFilterBar>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, mb: 2 }}>
          <Button
            variant="contained"
            disableElevation
            size="small"
            startIcon={<DownloadIcon />}
            disabled={loading || filteredRows.length === 0}
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
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Sessions started in the last {periodDays} days (from recent sample). Active rows may include live estimates.
      </Typography>

      {loading ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
          Loading sessions…
        </Typography>
      ) : filteredRows.length === 0 ? (
        <AppEmptyState
          sx={{ border: 0, boxShadow: 'none', borderRadius: 0 }}
          icon={<EvStationIcon />}
          title="No sessions in this period"
          description={`No charging sessions in the last ${periodDays} days from the current sample.`}
        />
      ) : useGroupedList ? (
        <GroupedListSection title={`Sessions (${periodDays}d)`}>
          {filteredRows.map((tx, index) => (
            <GroupedListRow
              key={`${tx.chargePointId}-${tx.connectorId}-${tx.transactionId}-${tx.id}`}
              divider={index < filteredRows.length - 1}
              showChevron={false}
              primary={formatCustomerDisplayName(tx)}
              secondary={`${tx.chargePointId} · ${formatSessionEnergy(tx)} · ${formatSessionDuration(tx)}`}
              end={
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatSessionCost(tx)}
                  </Typography>
                  <AppBadge
                    label={sessionStatusLabel(tx)}
                    tone={chipColorToBadgeTone(sessionStatusChipColor(sessionStatusLabel(tx)))}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              }
            />
          ))}
        </GroupedListSection>
      ) : (
        <Box sx={premiumTableSurfaceSx}>
          <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Transaction</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Charge point</TableCell>
                  <TableCell>Energy</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Cost</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Start</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRows.map((tx) => (
                  <TableRow key={`${tx.chargePointId}-${tx.connectorId}-${tx.transactionId}-${tx.id}`}>
                    <TableCell>{tx.recordPending ? 'Pending sync' : tx.transactionId}</TableCell>
                    <TableCell>{formatCustomerDisplayName(tx)}</TableCell>
                    <TableCell>{tx.chargePointId}</TableCell>
                    <TableCell>{formatSessionEnergy(tx)}</TableCell>
                    <TableCell>{formatSessionDuration(tx)}</TableCell>
                    <TableCell>{formatSessionCost(tx)}</TableCell>
                    <TableCell>
                      <AppBadge
                        label={sessionStatusLabel(tx)}
                        tone={chipColorToBadgeTone(sessionStatusChipColor(sessionStatusLabel(tx)))}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(tx.startTime).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
}

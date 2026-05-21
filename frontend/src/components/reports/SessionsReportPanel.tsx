import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
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
import DownloadIcon from '@mui/icons-material/Download';
import { reportsApi } from '../../services/dashboardApi';
import type { Transaction } from '../../services/transactionsApi';
import { GroupedListSection } from '../ios/GroupedListSection';
import { GroupedListRow } from '../ios/GroupedListRow';
import { premiumTableSurfaceSx } from '../../theme/jampackShell';
import { compactOutlinedCtaSx, sxObject } from '../../styles/authShell';
import {
  formatCustomerDisplayName,
  formatSessionCost,
  formatSessionDuration,
  formatSessionEnergy,
  sessionStatusChipColor,
  sessionStatusLabel,
} from '../../utils/sessionDisplay';
import { downloadSessionsReportCsv } from '../../utils/reportExport';

interface SessionsReportPanelProps {
  vendorId?: number;
  limit?: number;
}

export function SessionsReportPanel({ vendorId, limit = 100 }: SessionsReportPanelProps) {
  const theme = useTheme();
  const useGroupedList = useMediaQuery(theme.breakpoints.down('md'));
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

  const exportCsv = () => {
    downloadSessionsReportCsv(rows, `sessions-report-${new Date().toISOString().slice(0, 10)}.csv`);
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
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          gap: 1.5,
          mb: 2,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Recent charging sessions with live estimates for active rows. Revenue totals use completed session costs only.
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<DownloadIcon />}
          disabled={loading || rows.length === 0}
          onClick={exportCsv}
          sx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), alignSelf: { xs: 'stretch', sm: 'flex-start' } })}
        >
          Export CSV
        </Button>
      </Box>

      {loading ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
          Loading sessions…
        </Typography>
      ) : rows.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
          No sessions found.
        </Typography>
      ) : useGroupedList ? (
        <GroupedListSection title="Recent sessions">
          {rows.map((tx, index) => (
            <GroupedListRow
              key={`${tx.chargePointId}-${tx.connectorId}-${tx.transactionId}-${tx.id}`}
              divider={index < rows.length - 1}
              showChevron={false}
              primary={formatCustomerDisplayName(tx)}
              secondary={`${tx.chargePointId} · ${formatSessionEnergy(tx)} · ${formatSessionDuration(tx)}`}
              end={
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatSessionCost(tx)}
                  </Typography>
                  <Chip
                    label={sessionStatusLabel(tx)}
                    color={sessionStatusChipColor(sessionStatusLabel(tx))}
                    size="small"
                    sx={{ mt: 0.5, height: 22 }}
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
                {rows.map((tx) => (
                  <TableRow key={`${tx.chargePointId}-${tx.connectorId}-${tx.transactionId}-${tx.id}`}>
                    <TableCell>{tx.recordPending ? 'Pending sync' : tx.transactionId}</TableCell>
                    <TableCell>{formatCustomerDisplayName(tx)}</TableCell>
                    <TableCell>{tx.chargePointId}</TableCell>
                    <TableCell>{formatSessionEnergy(tx)}</TableCell>
                    <TableCell>{formatSessionDuration(tx)}</TableCell>
                    <TableCell>{formatSessionCost(tx)}</TableCell>
                    <TableCell>
                      <Chip
                        label={sessionStatusLabel(tx)}
                        color={sessionStatusChipColor(sessionStatusLabel(tx))}
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

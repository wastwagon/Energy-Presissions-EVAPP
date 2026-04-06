import { useState, useEffect, useCallback, type ReactNode } from 'react';
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
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import { billingApi, Invoice } from '../../services/billingApi';
import { formatCurrency, formatEnergyKwh } from '../../utils/formatters';
import { getInvoiceStatusColor } from '../../utils/statusColors';
import { dashboardPageTitleSx, dashboardPageSubtitleSx, premiumTableSurfaceSx } from '../../theme/jampackShell';

function TabPanel({ children, value, index }: { children: ReactNode; value: number; index: number }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && (
        <Box sx={{ pt: 2, px: { xs: 1.5, sm: 2 }, pb: { xs: 2, sm: 2 } }}>{children}</Box>
      )}
    </div>
  );
}

export function SuperAdminBillingPage() {
  const [tab, setTab] = useState(0);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [inv, tx] = await Promise.all([
        billingApi.getInvoices(100, 0).catch(() => ({ invoices: [], total: 0 })),
        billingApi.getTransactions(100, 0).catch(() => ({ transactions: [], total: 0 })),
      ]);
      setInvoices(inv.invoices || []);
      setTransactions(tx.transactions || []);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Failed to load billing data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
        <Box sx={{ minWidth: 0, flex: '1 1 220px' }}>
          <Typography variant="h6" component="h1" sx={dashboardPageTitleSx}>
            Billing & Invoices
          </Typography>
          <Typography variant="body2" sx={dashboardPageSubtitleSx}>
            Read-only view of billing transactions and invoices from the API.
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper elevation={0} sx={premiumTableSurfaceSx}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            px: { xs: 1, sm: 2 },
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': { minHeight: 48, textTransform: 'none', fontWeight: 600 },
          }}
        >
          <Tab label="Invoices" />
          <Tab label="Billing transactions" />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TabPanel value={tab} index={0}>
              <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Created</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                            No invoices
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      invoices.map((inv) => (
                        <TableRow key={inv.id} hover>
                          <TableCell>{inv.invoiceNumber}</TableCell>
                          <TableCell>{inv.userId}</TableCell>
                          <TableCell>
                            {formatCurrency(inv.total, inv.currency || 'GHS')}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={inv.status}
                              color={getInvoiceStatusColor(inv.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{new Date(inv.createdAt).toLocaleString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>
            <TabPanel value={tab} index={1}>
              <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Transaction ID</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Cost</TableCell>
                      <TableCell>Energy</TableCell>
                      <TableCell>Start</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                            No transactions
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((tx) => (
                        <TableRow key={tx.transactionId ?? tx.id} hover>
                          <TableCell>{tx.transactionId ?? tx.id}</TableCell>
                          <TableCell>{tx.userId ?? '—'}</TableCell>
                          <TableCell>
                            {formatCurrency(tx.totalCost, 'GHS')}
                          </TableCell>
                          <TableCell>
                            {tx.totalEnergyKwh != null ? `${formatEnergyKwh(tx.totalEnergyKwh, 3)} kWh` : '—'}
                          </TableCell>
                          <TableCell>
                            {tx.startTime ? new Date(tx.startTime).toLocaleString() : '—'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>
          </>
        )}
      </Paper>
    </Box>
  );
}

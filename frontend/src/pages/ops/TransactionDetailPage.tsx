import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { useOpsBasePath } from '../../hooks/useOpsBasePath';
import { useStaffNavBack } from '../../hooks/useStaffNavBack';
import { transactionsApi, Transaction, MeterSample } from '../../services/transactionsApi';
import { dashboardPageTitleSx, dashboardPageSubtitleSx, premiumPanelCardSx, premiumTableSurfaceSx } from '../../theme/jampackShell';
import {
  compactOutlinedCtaSx,
  sxObject,
} from '../../styles/authShell';
import { formatCurrency } from '../../utils/formatters';
import {
  formatCustomerDisplayName,
  formatSessionCost,
  formatSessionDuration,
  formatSessionEnergy,
  formatSessionReserved,
  sessionStatusChipColor,
  sessionStatusLabel,
} from '../../utils/sessionDisplay';
import { billingApi, type Invoice } from '../../services/billingApi';
import { openPrintableReceipt, receiptBrandingFromTransaction } from '../../utils/printReceipt';
import { getStoredUser } from '../../utils/authSession';
import { GroupedListSection } from '../../components/ios/GroupedListSection';
import { GroupedListRow } from '../../components/ios/GroupedListRow';
import { GroupedDetailRow } from '../../components/ios/GroupedDetailRow';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { AppBadge, chipColorToBadgeTone } from '../../components/ui/AppBadge';
import { LIVE_DATA_LABELS } from '../../constants/liveDataLabels';
import { OpsLiveDetailSkeleton } from '../../components/dashboard/RouteDetailSkeleton';

export function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const opsBase = useOpsBasePath();
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down('md'));
  const showInlineStaffBack = useMediaQuery(theme.breakpoints.up('md'));
  const goBackToSessions = useCallback(
    () => navigate(`${opsBase}/sessions`),
    [navigate, opsBase],
  );
  useStaffNavBack(goBackToSessions, 'Back to sessions');
  const accountType = getStoredUser()?.accountType;
  const canManageInvoice = accountType === 'SuperAdmin' || accountType === 'Admin';
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [meterValues, setMeterValues] = useState<MeterSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [invoiceNotice, setInvoiceNotice] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async (silent?: boolean) => {
    if (!id) return;
    const isQuiet = silent === true;
    try {
      if (isQuiet) setRefreshing(true);
      setError(null);
      const [tx, meterVals] = await Promise.all([
        transactionsApi.getById(parseInt(id)),
        transactionsApi.getMeterValues(parseInt(id)).catch(() => []),
      ]);
      setTransaction(tx);
      setMeterValues(meterVals);
      setUpdatedAt(Date.now());
      if (tx.status === 'Completed' && Number(tx.totalCost) > 0 && canManageInvoice) {
        const existing = await billingApi.getInvoiceForTransaction(tx.transactionId).catch(() => null);
        setInvoice(existing);
      } else {
        setInvoice(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load transaction details');
      console.error('Error loading transaction details:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return <OpsLiveDetailSkeleton ariaLabel="Loading transaction details" />;
  }

  if (!transaction) {
    return (
      <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
        {showInlineStaffBack ? (
          <Button startIcon={<ArrowBackIcon />} onClick={goBackToSessions} sx={{ mb: 2 }}>
            Back to Sessions
          </Button>
        ) : null}
        <Alert severity="error">Transaction not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <LivePageHeader
        title={`Transaction #${transaction.transactionId}`}
        subtitle="Session timeline, meter samples, and payment handling"
        updatedAt={updatedAt}
        liveLabel={LIVE_DATA_LABELS.transaction}
        showSeconds
        refreshing={refreshing}
        onRefresh={() => void loadData(true)}
        titleSx={dashboardPageTitleSx}
        subtitleSx={dashboardPageSubtitleSx}
        containerSx={{ mb: 2 }}
        refreshSx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), width: { xs: '100%', sm: 'auto' } })}
        actions={
          <>
            {showInlineStaffBack ? (
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={goBackToSessions}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                Back
              </Button>
            ) : null}
            <AppBadge
              label={sessionStatusLabel(transaction)}
              tone={chipColorToBadgeTone(sessionStatusChipColor(sessionStatusLabel(transaction)))}
              sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
            />
          </>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {invoiceNotice && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setInvoiceNotice(null)}>
          {invoiceNotice}
        </Alert>
      )}

      {isCompact ? (
        <>
          <GroupedListSection title="Session">
            <GroupedDetailRow label="Customer" value={formatCustomerDisplayName(transaction)} divider />
            <GroupedDetailRow label="Charge point" value={transaction.chargePointId} divider />
            <GroupedDetailRow label="Connector" value={transaction.connectorId} divider />
            <GroupedDetailRow label="IdTag" value={transaction.idTag || '—'} divider />
            <GroupedDetailRow
              label="Start"
              value={new Date(transaction.startTime).toLocaleString()}
              divider={Boolean(transaction.stopTime)}
            />
            {transaction.stopTime && (
              <GroupedDetailRow label="End" value={new Date(transaction.stopTime).toLocaleString()} />
            )}
          </GroupedListSection>
          <GroupedListSection title="Energy & billing">
            <GroupedDetailRow label="Energy" value={formatSessionEnergy(transaction)} divider />
            <GroupedDetailRow label="Duration" value={formatSessionDuration(transaction)} divider />
            {transaction.status === 'Active' && (
              <GroupedDetailRow label="Purchased (max)" value={formatSessionReserved(transaction)} divider />
            )}
            <GroupedDetailRow
              label="Cost"
              value={
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {formatSessionCost(transaction)}
                </Typography>
              }
            />
          </GroupedListSection>
          {transaction.status === 'Completed' && Number(transaction.totalCost) > 0 && canManageInvoice && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
              <Button
                variant="outlined"
                startIcon={<ReceiptIcon />}
                    disabled={generatingInvoice}
                    onClick={async () => {
                      setGeneratingInvoice(true);
                      try {
                        const inv = await billingApi.generateInvoice(transaction.transactionId);
                        setInvoice(inv);
                        setInvoiceNotice(`Invoice ${inv.invoiceNumber} generated`);
                      } catch (err: unknown) {
                        setError(err instanceof Error ? err.message : 'Failed to generate invoice');
                      } finally {
                        setGeneratingInvoice(false);
                      }
                    }}
                    sx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), width: '100%' })}
                  >
                    {generatingInvoice ? 'Generating…' : invoice ? 'Regenerate invoice' : 'Generate invoice'}
                  </Button>
                  {invoice && (
                    <>
                      {invoice.pdfPath && (
                        <Button
                          variant="outlined"
                          startIcon={<PictureAsPdfIcon />}
                          onClick={() => billingApi.openInvoicePdfUrl(invoice.pdfPath!)}
                          sx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), width: '100%' })}
                        >
                          Download PDF
                        </Button>
                      )}
                      <Button
                        variant="outlined"
                        startIcon={<PrintIcon />}
                        onClick={() =>
                          openPrintableReceipt(
                            invoice,
                            transaction,
                            receiptBrandingFromTransaction(transaction),
                          )
                        }
                        sx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), width: '100%' })}
                      >
                        Print receipt
                      </Button>
                    </>
                  )}
            </Box>
          )}
        </>
      ) : (
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Transaction Info */}
        <Grid item xs={12} md={6}>
          <Paper sx={premiumPanelCardSx}>
            <Typography variant="h6" gutterBottom>
              Transaction Information
            </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Transaction ID
                  </Typography>
                  <Typography variant="body1">{transaction.transactionId}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Charge Point
                  </Typography>
                  <Typography variant="body1">{transaction.chargePointId}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Connector
                  </Typography>
                  <Typography variant="body1">{transaction.connectorId}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Customer
                  </Typography>
                  <Typography variant="body1">{formatCustomerDisplayName(transaction)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    IdTag
                  </Typography>
                  <Typography variant="body1">{transaction.idTag || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Start Time
                  </Typography>
                  <Typography variant="body1">
                    {new Date(transaction.startTime).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Stop Time
                  </Typography>
                  <Typography variant="body1">
                    {transaction.stopTime
                      ? new Date(transaction.stopTime).toLocaleString()
                      : transaction.status === 'Active'
                      ? 'In progress...'
                      : '-'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Duration
                  </Typography>
                  <Typography variant="body1">{formatSessionDuration(transaction)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <AppBadge
                    label={sessionStatusLabel(transaction)}
                    tone={chipColorToBadgeTone(sessionStatusChipColor(sessionStatusLabel(transaction)))}
                    size="small"
                  />
                </Grid>
              </Grid>
          </Paper>
        </Grid>

        {/* Energy & Cost */}
        <Grid item xs={12} md={6}>
          <Paper sx={premiumPanelCardSx}>
            <Typography variant="h6" gutterBottom>
              Energy & Cost
            </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Meter Start
                  </Typography>
                  <Typography variant="body1">{transaction.meterStart} Wh</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Meter Stop
                  </Typography>
                  <Typography variant="body1">
                    {transaction.meterStop ? `${transaction.meterStop} Wh` : '-'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Energy Consumed
                  </Typography>
                  <Typography variant="h6">
                    {formatSessionEnergy(transaction)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total Cost
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {formatCurrency(transaction.totalCost, 'GHS')}
                  </Typography>
                  {transaction.status === 'Completed' && transaction.totalCost && canManageInvoice ? (
                    <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Button
                            variant="outlined"
                            startIcon={<ReceiptIcon />}
                            disabled={generatingInvoice}
                            onClick={async () => {
                              setGeneratingInvoice(true);
                              try {
                                const inv = await billingApi.generateInvoice(transaction.transactionId);
                                setInvoice(inv);
                                setInvoiceNotice(`Invoice ${inv.invoiceNumber} generated`);
                              } catch (err: unknown) {
                                setError(err instanceof Error ? err.message : 'Failed to generate invoice');
                              } finally {
                                setGeneratingInvoice(false);
                              }
                            }}
                            sx={(th) => ({
                              ...sxObject(th, compactOutlinedCtaSx),
                              minWidth: { xs: '100%', sm: 160 },
                              width: { xs: '100%', sm: 'auto' },
                            })}
                          >
                            {generatingInvoice ? 'Generating…' : invoice ? 'Regenerate invoice' : 'Generate invoice'}
                          </Button>
                          {invoice?.pdfPath && (
                            <Button
                              variant="outlined"
                              startIcon={<PictureAsPdfIcon />}
                              onClick={() => billingApi.openInvoicePdfUrl(invoice.pdfPath!)}
                              sx={(th) => ({
                                ...sxObject(th, compactOutlinedCtaSx),
                                minWidth: { xs: '100%', sm: 140 },
                                width: { xs: '100%', sm: 'auto' },
                              })}
                            >
                              PDF
                            </Button>
                          )}
                          {invoice && (
                            <Button
                              variant="outlined"
                              startIcon={<PrintIcon />}
                              onClick={() =>
                                openPrintableReceipt(
                                  invoice,
                                  transaction,
                                  receiptBrandingFromTransaction(transaction),
                                )
                              }
                              sx={(th) => ({
                                ...sxObject(th, compactOutlinedCtaSx),
                                minWidth: { xs: '100%', sm: 140 },
                                width: { xs: '100%', sm: 'auto' },
                              })}
                            >
                              Print receipt
                            </Button>
                          )}
                    </Box>
                  ) : null}
                </Grid>
                {transaction.reason && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Stop Reason
                    </Typography>
                    <Typography variant="body1">{transaction.reason}</Typography>
                  </Grid>
                )}
              </Grid>
          </Paper>
        </Grid>

      </Grid>
      )}

      {meterValues.length > 0 && (
        <Paper sx={{ ...premiumTableSurfaceSx, mt: 2 }}>
          <Box sx={{ p: { xs: 1.5, sm: 2 }, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
              Meter Values
            </Typography>
          </Box>
          {isCompact ? (
            <Box sx={{ py: 1 }}>
              <GroupedListSection>
                {meterValues.map((sample, index) => (
                  <GroupedListRow
                    key={`${sample.timestamp}-${sample.measurand}-${index}`}
                    divider={index < meterValues.length - 1}
                    showChevron={false}
                    primary={sample.measurand || 'Sample'}
                    secondary={new Date(sample.timestamp).toLocaleString()}
                    end={
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {sample.value}
                        {sample.unit ? ` ${sample.unit}` : ''}
                      </Typography>
                    }
                  />
                ))}
              </GroupedListSection>
            </Box>
          ) : (
            <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Measurand</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Phase</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell>Unit</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {meterValues.map((sample, index) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(sample.timestamp).toLocaleString()}</TableCell>
                      <TableCell>{sample.measurand || '-'}</TableCell>
                      <TableCell>{sample.location || '-'}</TableCell>
                      <TableCell>{sample.phase || '-'}</TableCell>
                      <TableCell>{sample.value}</TableCell>
                      <TableCell>{sample.unit || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}
    </Box>
  );
}


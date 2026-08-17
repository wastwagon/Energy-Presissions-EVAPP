import { useState } from 'react';
import { Box, Typography, Paper, Alert, Button, Tabs, Tab } from '@mui/material';
import { premiumTableSurfaceSx } from '../../theme/jampackShell';
import { staffLargeSubtitleSx, staffLargeTitleSx } from '../../theme/staffChrome';
import { compactContainedCtaSx, compactOutlinedCtaSx, sxObject } from '../../styles/authShell';
import { SessionsReportPanel } from '../../components/reports/SessionsReportPanel';
import { reportsApi } from '../../services/dashboardApi';
import { downloadSessionsReportCsv } from '../../utils/reportExport';
import { filterTransactionsByPeriodDays, reportExportFilename } from '../../utils/reportPeriod';
import { getStoredUser } from '../../utils/authSession';
import { ADMIN_ROUTES } from '../../config/staffNav.paths';
import { Link as RouterLink } from 'react-router-dom';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { StaffReportToolbar } from '../../components/dashboard/StaffReportToolbar';
import type { StaffPeriodDays } from '../../components/dashboard/StaffPeriodChips';

export function AdminReportsPage() {
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [periodDays, setPeriodDays] = useState<StaffPeriodDays>(30);
  const [activeTab, setActiveTab] = useState(0);

  const handleExport = async () => {
    try {
      setExporting(true);
      setExportNotice(null);
      const vendorId = getStoredUser()?.vendorId;
      const data = await reportsApi.getSessionRows(200, 0, vendorId);
      const filtered = filterTransactionsByPeriodDays(data.transactions, periodDays);
      downloadSessionsReportCsv(filtered, reportExportFilename('sessions-report', periodDays));
      setExportNotice(`Sessions CSV downloaded (${periodDays}d · ${filtered.length} rows).`);
    } catch (err: unknown) {
      setExportNotice(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };
  const tabA11yProps = (index: number) => ({
    id: `admin-reports-tab-${index}`,
    'aria-controls': `admin-reports-panel-${index}`,
  });

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <LivePageHeader
        title="Reports"
        subtitle="Export CSVs for the selected period. Live metrics and breakdowns live on Dashboard and Analytics."
        updatedAt={null}
        showRefresh={false}
        showLiveMeta={false}
        refreshing={false}
        onRefresh={() => undefined}
        titleVariant="large"
        titleSx={staffLargeTitleSx}
        subtitleSx={staffLargeSubtitleSx}
      />

      <StaffReportToolbar
        periodDays={periodDays}
        onPeriodChange={setPeriodDays}
        onExport={() => void handleExport()}
        exportLabel="Export report"
        exporting={exporting}
        endActions={
          <Button
            component={RouterLink}
            to={ADMIN_ROUTES.billing}
            variant="outlined"
            sx={(th) => ({
              ...sxObject(th, compactOutlinedCtaSx),
              minHeight: 44,
            })}
          >
            Billing
          </Button>
        }
      />

      {exportNotice && (
        <Alert severity="info" sx={{ mb: 3 }} onClose={() => setExportNotice(null)}>
          {exportNotice}
        </Alert>
      )}

      <Paper sx={premiumTableSurfaceSx}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          aria-label="Admin report sections"
        >
          <Tab label="Export" {...tabA11yProps(0)} />
          <Tab label="Sessions" {...tabA11yProps(1)} />
        </Tabs>

        <Box
          sx={{ p: { xs: 2, sm: 3 } }}
          role="tabpanel"
          id={`admin-reports-panel-${activeTab}`}
          aria-labelledby={`admin-reports-tab-${activeTab}`}
        >
          {activeTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Session export
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Downloads billed session rows for the last {periodDays} days. Charts and fleet
                breakdowns stay on Analytics so this page does not repeat live KPIs.
              </Typography>
              <Button
                component={RouterLink}
                to={ADMIN_ROUTES.analytics}
                variant="contained"
                disableElevation
                sx={(th) => ({
                  ...sxObject(th, compactContainedCtaSx),
                  width: { xs: '100%', sm: 'auto' },
                  mr: { sm: 1 },
                  mb: { xs: 1, sm: 0 },
                })}
              >
                Open Analytics
              </Button>
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Sessions Report
              </Typography>
              <SessionsReportPanel
                periodDays={periodDays}
                onPeriodChange={setPeriodDays}
                hidePeriodControls
              />
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import StorefrontIcon from '@mui/icons-material/Storefront';
import { vendorApi, type Vendor } from '../../services/vendorApi';
import { GroupedListSection } from '../ios/GroupedListSection';
import { GroupedListRow } from '../ios/GroupedListRow';
import { AppBadge } from '../ui/AppBadge';
import { AppEmptyState } from '../ui/AppEmptyState';
import { premiumTableSurfaceSx } from '../../theme/jampackShell';
import { compactContainedCtaSx, sxObject } from '../../styles/authShell';
import { downloadCsv } from '../../utils/reportExport';
import { reportSnapshotFilename } from '../../utils/reportPeriod';
import { formatCurrency } from '../../utils/formatters';
import { SUPERADMIN_ROUTES } from '../../config/staffNav.paths';

function vendorScoreboardLine(vendor: Vendor): string {
  const stations = vendor.stationCount ?? 0;
  const gmv = formatCurrency(vendor.gmv ?? 0, 'GHS');
  const last = vendor.lastSessionAt
    ? new Date(vendor.lastSessionAt).toLocaleDateString()
    : 'No sessions';
  return `${stations} station${stations === 1 ? '' : 's'} · ${gmv} sales · ${last}`;
}

function statusTone(status: Vendor['status']) {
  if (status === 'active') return 'success' as const;
  if (status === 'suspended') return 'warning' as const;
  return 'neutral' as const;
}

export function VendorsReportPanel() {
  const navigate = useNavigate();
  const theme = useTheme();
  const useGroupedList = useMediaQuery(theme.breakpoints.down('md'));
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const list = await vendorApi.getAll();
      setVendors(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load vendors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activeCount = useMemo(
    () => vendors.filter((v) => v.status === 'active').length,
    [vendors],
  );

  const exportCsv = () => {
    downloadCsv(
      reportSnapshotFilename('vendors-report'),
      ['Vendor', 'Status', 'Stations', 'Sales (GHS)', 'Last session', 'Contact'],
      vendors.map((v) => [
        v.name,
        v.status,
        v.stationCount ?? 0,
        (v.gmv ?? 0).toFixed(2),
        v.lastSessionAt ? new Date(v.lastSessionAt).toISOString().slice(0, 10) : '',
        v.contactEmail || '',
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
        Loading vendors…
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
          disabled={vendors.length === 0}
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
        {vendors.length} vendors · {activeCount} active
      </Typography>

      {vendors.length === 0 ? (
        <AppEmptyState
          sx={{ border: 0, boxShadow: 'none', borderRadius: 0 }}
          icon={<StorefrontIcon />}
          title="No vendors found"
          description="Vendor accounts will appear here once they are created."
          primaryAction={{
            label: 'Open Vendors',
            onClick: () => navigate(SUPERADMIN_ROUTES.vendors),
            variant: 'secondary',
          }}
        />
      ) : useGroupedList ? (
        <GroupedListSection>
          {vendors.map((v, index) => (
            <GroupedListRow
              key={v.id}
              divider={index < vendors.length - 1}
              showChevron={false}
              primary={v.name}
              secondary={vendorScoreboardLine(v)}
              secondaryTypographyProps={{ sx: { fontVariantNumeric: 'tabular-nums' } }}
              end={
                <AppBadge label={v.status} size="small" tone={statusTone(v.status)} />
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
                  <TableCell>Vendor</TableCell>
                  <TableCell>Stations</TableCell>
                  <TableCell>Last session</TableCell>
                  <TableCell>Sales</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vendors.map((v) => (
                  <TableRow key={v.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {v.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {v.contactEmail || v.slug || `ID ${v.id}`}
                      </Typography>
                    </TableCell>
                    <TableCell>{v.stationCount ?? 0}</TableCell>
                    <TableCell>
                      {v.lastSessionAt ? new Date(v.lastSessionAt).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {formatCurrency(v.gmv ?? 0, 'GHS')}
                    </TableCell>
                    <TableCell>
                      <AppBadge label={v.status} size="small" tone={statusTone(v.status)} />
                    </TableCell>
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

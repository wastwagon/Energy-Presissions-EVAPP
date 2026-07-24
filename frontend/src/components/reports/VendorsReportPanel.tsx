import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
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
import StorefrontIcon from '@mui/icons-material/Storefront';
import { vendorApi, type Vendor } from '../../services/vendorApi';
import { GroupedListSection } from '../ios/GroupedListSection';
import { GroupedListRow } from '../ios/GroupedListRow';
import { AppBadge } from '../ui/AppBadge';
import { AppEmptyState } from '../ui/AppEmptyState';
import { premiumTableSurfaceSx } from '../../theme/jampackShell';

export function VendorsReportPanel() {
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

  const activeCount = vendors.filter((v) => v.status === 'active').length;

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
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {vendors.length} vendors · {activeCount} active
      </Typography>

      {vendors.length === 0 ? (
        <AppEmptyState
          sx={{ border: 0, boxShadow: 'none', borderRadius: 0 }}
          icon={<StorefrontIcon />}
          title="No vendors found"
          description="Vendor accounts will appear here once they are created."
        />
      ) : useGroupedList ? (
        <GroupedListSection>
          {vendors.map((v, index) => (
            <GroupedListRow
              key={v.id}
              divider={index < vendors.length - 1}
              showChevron={false}
              primary={v.name}
              secondary={v.contactEmail || v.slug || `ID ${v.id}`}
              end={
                <AppBadge
                  label={v.status}
                  size="small"
                  tone={
                    v.status === 'active' ? 'success' : v.status === 'suspended' ? 'warning' : 'neutral'
                  }
                />
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
                  <TableCell>Status</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vendors.map((v) => (
                  <TableRow key={v.id} hover>
                    <TableCell>{v.name}</TableCell>
                    <TableCell>
                      <AppBadge
                        label={v.status}
                        size="small"
                        tone={
                          v.status === 'active'
                            ? 'success'
                            : v.status === 'suspended'
                              ? 'warning'
                              : 'neutral'
                        }
                      />
                    </TableCell>
                    <TableCell>{v.contactEmail || '—'}</TableCell>
                    <TableCell>{new Date(v.createdAt).toLocaleDateString()}</TableCell>
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

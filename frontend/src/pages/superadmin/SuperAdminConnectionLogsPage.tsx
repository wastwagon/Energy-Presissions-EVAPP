import { useState, useEffect, useCallback, useMemo } from 'react';
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
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  Grid,
  Tooltip,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import HubIcon from '@mui/icons-material/Hub';
import { connectionLogsApi, ConnectionLog, ConnectionEventType, ConnectionStatistics } from '../../services/connectionLogsApi';
import { chargePointsApi, ChargePoint } from '../../services/chargePointsApi';
import { dashboardPageSubtitleSx, premiumPanelCardSx, premiumTableSurfaceSx } from '../../theme/jampackShell';
import {
  staffFilterFieldSx,
  staffFilterFormControlSx,
  premiumIconButtonTouchSx,
  sxObject,
} from '../../styles/authShell';
import { getConnectionEventColor, getConnectionStatusColor } from '../../utils/statusColors';
import {
  buildLinkStatusMap,
  mergeChargePointLinkUpdate,
  useChargePointLinkRealtime,
} from '../../hooks/useChargePointLinkRealtime';
import {
  countByLinkStatus,
  formatSecondsSinceHeartbeat,
  getLinkStatusChipColor,
  getLinkStatusLabel,
} from '../../utils/chargePointLink';
import { DashboardStaffChromeSkeleton } from '../../components/dashboard/DashboardStaffChromeSkeleton';
import { TableSurfaceProgress } from '../../components/dashboard/TableSurfaceProgress';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { StaffFilterBar } from '../../components/dashboard/StaffFilterBar';
import { AppEmptyState } from '../../components/ui/AppEmptyState';
import { AppBadge, chipColorToBadgeTone } from '../../components/ui/AppBadge';
import { useStaffPullRefresh } from '../../hooks/useStaffPullRefresh';
import { staffLargeSubtitleSx, staffLargeTitleSx } from '../../theme/staffChrome';
import { LIVE_DATA_LABELS } from '../../constants/liveDataLabels';
import { logger } from '../../utils/logger';
import { GroupedListSection } from '../../components/ios/GroupedListSection';
import { GroupedListRow } from '../../components/ios/GroupedListRow';
import { MobileListLoadMore } from '../../components/ios/MobileListLoadMore';

const CONNECTION_LOGS_PAGE_SIZE = 20;

export function SuperAdminConnectionLogsPage() {
  const theme = useTheme();
  const useGroupedList = useMediaQuery(theme.breakpoints.down('md'));
  const [logs, setLogs] = useState<ConnectionLog[]>([]);
  const [statistics, setStatistics] = useState<ConnectionStatistics[]>([]);
  const [linkByChargePointId, setLinkByChargePointId] = useState<
    Map<string, Pick<ChargePoint, 'linkStatus' | 'ocppConnected' | 'secondsSinceHeartbeat'>>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<ConnectionEventType | ''>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadLinkSnapshot = useCallback(async () => {
    try {
      const cps = await chargePointsApi.getAll();
      setLinkByChargePointId(buildLinkStatusMap(cps));
    } catch {
      // Non-blocking — logs table still works
    }
  }, []);

  const fetchLogsPage = useCallback(
    async (pageNum: number, append: boolean) => {
      const offset = (pageNum - 1) * CONNECTION_LOGS_PAGE_SIZE;
      let logsData;
      if (searchTerm && searchTerm.trim()) {
        try {
          logsData = await connectionLogsApi.getLogs(
            searchTerm.trim(),
            eventTypeFilter || undefined,
            CONNECTION_LOGS_PAGE_SIZE,
            offset,
          );
        } catch {
          logsData = await connectionLogsApi.searchLogs(
            searchTerm.trim(),
            CONNECTION_LOGS_PAGE_SIZE,
            offset,
          );
        }
      } else {
        logsData = await connectionLogsApi.getLogs(
          undefined,
          eventTypeFilter || undefined,
          CONNECTION_LOGS_PAGE_SIZE,
          offset,
        );
      }
      setLogs((prev) => (append ? [...prev, ...logsData.logs] : logsData.logs));
      setTotal(logsData.total);
      setPage(pageNum);
      return logsData;
    },
    [eventTypeFilter, searchTerm],
  );

  const loadData = useCallback(
    async (silent?: boolean) => {
      const isQuiet = silent === true;
      try {
        if (isQuiet) setRefreshing(true);
        else setLoading(true);
        setError(null);

        const [statsData] = await Promise.all([
          connectionLogsApi.getAllStatistics(),
          loadLinkSnapshot(),
          fetchLogsPage(page, false),
        ]);

        setStatistics(statsData);
        setUpdatedAt(Date.now());
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } }; message?: string };
        const errorMessage = e.response?.data?.message || e.message || 'Failed to load connection logs';
        setError(errorMessage);
        logger.error('Error loading connection logs:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fetchLogsPage, loadLinkSnapshot, page],
  );

  useStaffPullRefresh(useCallback(() => void loadData(true), [loadData]));

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || page * CONNECTION_LOGS_PAGE_SIZE >= total) return;
    setLoadingMore(true);
    try {
      setError(null);
      await fetchLogsPage(page + 1, true);
      setUpdatedAt(Date.now());
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message || e.message || 'Failed to load more logs');
    } finally {
      setLoadingMore(false);
    }
  }, [fetchLogsPage, loadingMore, page, total]);

  const handleDesktopPageChange = useCallback(
    async (_: unknown, value: number) => {
      setPage(value);
    },
    [],
  );

  useEffect(() => {
    void loadData();
  }, [page, eventTypeFilter, loadData]);

  const applyLinkRealtime = useCallback(
    (payload: Parameters<typeof mergeChargePointLinkUpdate>[1]) => {
      setLinkByChargePointId((prev) => {
        const next = new Map(prev);
        next.set(payload.chargePointId, {
          linkStatus: payload.linkStatus,
          ocppConnected: payload.ocppConnected,
          secondsSinceHeartbeat: payload.secondsSinceHeartbeat,
        });
        return next;
      });
      setUpdatedAt(Date.now());
    },
    [],
  );

  useChargePointLinkRealtime(applyLinkRealtime);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadData(true);
    }, 60000);
    return () => window.clearInterval(interval);
  }, [page, eventTypeFilter, searchTerm]);

  const linkCounts = useMemo(() => {
    const rows = Array.from(linkByChargePointId.values());
    return countByLinkStatus(rows);
  }, [linkByChargePointId]);

  const resolveLogLink = (chargePointId: string) => {
    if (chargePointId === 'UNKNOWN') {
      return null;
    }
    return linkByChargePointId.get(chargePointId);
  };

  if (loading && logs.length === 0) {
    return <DashboardStaffChromeSkeleton preset="connectionLogs" />;
  }

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <LivePageHeader
        title="Connection Logs"
        subtitle="OCPP connection events plus live CSMS link (WebSocket + heartbeat). Refreshes on charger connect/disconnect."
        updatedAt={updatedAt}
        liveLabel={LIVE_DATA_LABELS.devices}
        showSeconds
        refreshing={refreshing}
        onRefresh={() => void loadData(true)}
        titleVariant="large"
        titleSx={staffLargeTitleSx}
        subtitleSx={staffLargeSubtitleSx}
        showToolbarRefreshOnMobile
        containerSx={{ mb: 3 }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mr: 0.5 }}>
          Fleet CSMS link
        </Typography>
        <AppBadge label={`${linkCounts.online} online`} tone="success" size="small" />
        <AppBadge label={`${linkCounts.stale} recent off`} tone="warning" size="small" />
        <AppBadge label={`${linkCounts.offline} offline`} tone="error" size="small" />
        <AppBadge label={`${linkCounts.never_seen} never`} tone="neutral" size="small" />
      </Box>

      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 3 }}>
        {statistics.slice(0, 4).map((stat) => {
          const link = resolveLogLink(stat.chargePointId);
          return (
            <Grid item xs={12} sm={6} md={3} key={stat.chargePointId}>
              <Paper elevation={0} sx={premiumPanelCardSx}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.04em' }}>
                  {stat.chargePointId}
                </Typography>
                {link?.linkStatus ? (
                  <AppBadge
                    label={getLinkStatusLabel(link.linkStatus)}
                    tone={chipColorToBadgeTone(getLinkStatusChipColor(link.linkStatus))}
                    size="small"
                    sx={{ mt: 0.75, mb: 0.5 }}
                  />
                ) : (
                  <AppBadge label="No link data" tone="neutral" size="small" sx={{ mt: 0.75, mb: 0.5 }} />
                )}
                <Typography variant="h6" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {stat.successfulConnections} / {stat.totalAttempts}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Log success:{' '}
                  {stat.totalAttempts > 0
                    ? Math.round((stat.successfulConnections / stat.totalAttempts) * 100)
                    : 0}
                  %
                </Typography>
                {link && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    Heartbeat {formatSecondsSinceHeartbeat(link.secondsSinceHeartbeat ?? null)}
                  </Typography>
                )}
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      <StaffFilterBar aria-label="Connection log filters">
        <TextField
          fullWidth
          placeholder="Charge point ID or search…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setPage(1);
              void loadData();
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: searchTerm ? (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => {
                    setSearchTerm('');
                    setPage(1);
                    void loadData();
                  }}
                  aria-label="Clear connection log search"
                  sx={(th) => ({ ...sxObject(th, premiumIconButtonTouchSx) })}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
          sx={(th) => ({
            ...sxObject(th, staffFilterFieldSx),
            width: { xs: '100%', sm: 280 },
            maxWidth: '100%',
          })}
        />
        <FormControl
          sx={(th) => ({
            ...sxObject(th, staffFilterFormControlSx),
            flexShrink: 0,
            width: { xs: '100%', sm: 220 },
          })}
        >
          <InputLabel>Event type</InputLabel>
          <Select
            value={eventTypeFilter}
            label="Event type"
            onChange={(e) => {
              setEventTypeFilter(e.target.value as ConnectionEventType | '');
              setPage(1);
            }}
          >
            <MenuItem value="">All events</MenuItem>
            <MenuItem value="connection_attempt">Connection attempt</MenuItem>
            <MenuItem value="connection_success">Connection success</MenuItem>
            <MenuItem value="connection_failed">Connection failed</MenuItem>
            <MenuItem value="connection_closed">Connection closed</MenuItem>
            <MenuItem value="error">Error</MenuItem>
            <MenuItem value="message_error">Message error</MenuItem>
          </Select>
        </FormControl>
      </StaffFilterBar>

      <Paper elevation={0} sx={{ ...premiumTableSurfaceSx, mb: 3, position: 'relative' }}>
        <TableSurfaceProgress active={refreshing && logs.length > 0} ariaLabel="Updating connection logs" />
        <Box
          sx={{
            px: { xs: 2, sm: 2.5 },
            py: { xs: 1.75, sm: 2 },
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Connection events
          </Typography>
        </Box>
        {logs.length === 0 ? (
          <AppEmptyState
            sx={{ border: 0, boxShadow: 'none', borderRadius: 0 }}
            icon={<HubIcon />}
            title="No connection logs found"
            description={
              searchTerm || eventTypeFilter
                ? 'Try another charge point ID or event type filter.'
                : 'Events appear after chargers connect to the CSMS.'
            }
            primaryAction={
              searchTerm || eventTypeFilter
                ? {
                    label: 'Clear filters',
                    onClick: () => {
                      setSearchTerm('');
                      setEventTypeFilter('');
                      setPage(1);
                    },
                    variant: 'secondary',
                  }
                : undefined
            }
          />
        ) : useGroupedList ? (
          <Box sx={{ py: 1 }}>
            <GroupedListSection>
              {logs.map((log, index) => {
                const link = resolveLogLink(log.chargePointId);
                return (
                  <GroupedListRow
                    key={log.id}
                    divider={index < logs.length - 1}
                    showChevron={false}
                    primary={log.chargePointId}
                    secondary={`${log.eventType.replace(/_/g, ' ')} · ${new Date(log.createdAt).toLocaleString()}`}
                    end={
                      <Box sx={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                        {log.status && (
                          <AppBadge
                            label={log.status}
                            tone={chipColorToBadgeTone(getConnectionStatusColor(log.status))}
                            size="small"
                          />
                        )}
                        {link?.linkStatus && (
                          <AppBadge
                            label={getLinkStatusLabel(link.linkStatus)}
                            tone={chipColorToBadgeTone(getLinkStatusChipColor(link.linkStatus))}
                            size="small"
                          />
                        )}
                      </Box>
                    }
                  />
                );
              })}
            </GroupedListSection>
            <MobileListLoadMore
              page={page}
              totalCount={total}
              pageSize={CONNECTION_LOGS_PAGE_SIZE}
              loading={loadingMore}
              onLoadMore={() => void handleLoadMore()}
            />
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Event</TableCell>
                  <TableCell>Device</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => {
                  const link = resolveLogLink(log.chargePointId);
                  return (
                    <TableRow key={log.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {new Date(log.createdAt).toLocaleString()}
                        </Typography>
                        <AppBadge
                          label={log.eventType.replace(/_/g, ' ')}
                          tone={chipColorToBadgeTone(getConnectionEventColor(log.eventType))}
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {log.chargePointId}
                        </Typography>
                        {link?.linkStatus ? (
                          <Tooltip
                            title={
                              link.ocppConnected
                                ? 'WebSocket open now'
                                : `Last heartbeat ${formatSecondsSinceHeartbeat(link.secondsSinceHeartbeat ?? null)}`
                            }
                          >
                            <span>
                              <AppBadge
                                label={getLinkStatusLabel(link.linkStatus)}
                                tone={chipColorToBadgeTone(getLinkStatusChipColor(link.linkStatus))}
                                size="small"
                                sx={{ mt: 0.5 }}
                              />
                            </span>
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            Link unknown
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.status ? (
                          <AppBadge
                            label={log.status}
                            tone={chipColorToBadgeTone(getConnectionStatusColor(log.status))}
                            size="small"
                          />
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{log.errorCode || '—'}</Typography>
                        {log.ipAddress ? (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {log.ipAddress}
                          </Typography>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {!useGroupedList && total > CONNECTION_LOGS_PAGE_SIZE && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={Math.ceil(total / CONNECTION_LOGS_PAGE_SIZE)}
            page={page}
            onChange={(_, value) => void handleDesktopPageChange(_, value)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
}

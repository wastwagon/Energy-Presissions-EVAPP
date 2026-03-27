import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Card,
  CardContent,
  Grid,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Badge,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import BugReportIcon from '@mui/icons-material/BugReport';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useOpsBasePath } from '../../hooks/useOpsBasePath';
import { chargePointsApi, ChargePoint } from '../../services/chargePointsApi';
import { connectionLogsApi, ConnectionLog, ConnectionStatistics } from '../../services/connectionLogsApi';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`devices-tabpanel-${index}`}
      aria-labelledby={`devices-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: { xs: 2, sm: 3 }, px: { xs: 0, sm: 0 } }}>{children}</Box>}
    </div>
  );
}

export function DevicesPage() {
  const navigate = useNavigate();
  const opsBase = useOpsBasePath();
  const [chargePoints, setChargePoints] = useState<ChargePoint[]>([]);
  const [filteredChargePoints, setFilteredChargePoints] = useState<ChargePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [showOnlyRealDevices, setShowOnlyRealDevices] = useState(false);
  
  // Connection logs state
  const [selectedChargePoint, setSelectedChargePoint] = useState<ChargePoint | null>(null);
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [connectionLogs, setConnectionLogs] = useState<ConnectionLog[]>([]);
  const [connectionStats, setConnectionStats] = useState<ConnectionStatistics | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [recentErrors, setRecentErrors] = useState<ConnectionLog[]>([]);

  useEffect(() => {
    loadChargePoints();
    loadRecentErrors();
  }, []);

  // Helper function to determine if a device is real (not dummy data)
  const isRealDevice = (cp: ChargePoint): boolean => {
    // Dummy devices typically have:
    // 1. Generic IDs like CP-ACC-001, CP-ASH-001, CP-WES-001
    const dummyIdPattern = /^CP-(ACC|ASH|WES)-\d{3}$/;
    if (dummyIdPattern.test(cp.chargePointId)) {
      return false;
    }

    // 2. No vendor name
    if (!cp.vendorName && !cp.vendor) {
      return false;
    }

    // 3. No serial number
    if (!cp.serialNumber) {
      return false;
    }

    // 4. Never had a heartbeat (and no connection logs would indicate dummy)
    // But we'll be lenient - if it has vendor and serial, consider it real
    
    return true;
  };

  useEffect(() => {
    // Filter charge points based on search term and real device filter
    let filtered = chargePoints;

    // Apply real device filter first
    if (showOnlyRealDevices) {
      filtered = filtered.filter(isRealDevice);
    }

    // Then apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (cp) =>
          cp.chargePointId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ((cp.vendorName || cp.vendor) && (cp.vendorName || cp.vendor)?.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (cp.model && cp.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (cp.serialNumber && cp.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())),
      );
    }

    setFilteredChargePoints(filtered);
  }, [searchTerm, chargePoints, showOnlyRealDevices]);

  const loadChargePoints = async () => {
    try {
      setError(null);
      const data = await chargePointsApi.getAll(searchTerm || undefined);
      setChargePoints(data);
      setFilteredChargePoints(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load charge points');
      console.error('Error loading charge points:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentErrors = async () => {
    try {
      const errors = await connectionLogsApi.getRecentErrors(10);
      setRecentErrors(errors);
    } catch (err) {
      // Silently fail - errors are not critical
      console.error('Error loading recent errors:', err);
    }
  };

  const handleClearResolvedErrors = async () => {
    try {
      const result = await connectionLogsApi.deleteResolvedErrors(1); // Clear errors older than 1 hour that are resolved
      if (result.deleted > 0) {
        setError(null);
        // Reload errors to refresh the list
        await loadRecentErrors();
        // Show success message
        alert(`Cleared ${result.deleted} resolved error(s).`);
      } else {
        alert('No resolved errors found to clear.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to clear resolved errors');
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadChargePoints();
      return;
    }

    setLoading(true);
    try {
      setError(null);
      const data = await chargePointsApi.getAll(searchTerm);
      setChargePoints(data);
      setFilteredChargePoints(data);
    } catch (err: any) {
      setError(err.message || 'Failed to search charge points');
    } finally {
      setLoading(false);
    }
  };

  const handleViewLogs = async (chargePoint: ChargePoint) => {
    setSelectedChargePoint(chargePoint);
    setLogsDialogOpen(true);
    setLogsLoading(true);

    try {
      const [logs, stats] = await Promise.all([
        connectionLogsApi.getLogs(chargePoint.chargePointId, undefined, 50),
        connectionLogsApi.getStatistics(chargePoint.chargePointId),
      ]);
      setConnectionLogs(logs.logs);
      setConnectionStats(stats);
    } catch (err: any) {
      setError(err.message || 'Failed to load connection logs');
    } finally {
      setLogsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'success';
      case 'Charging':
        return 'info';
      case 'Offline':
        return 'default';
      case 'Faulted':
        return 'error';
      default:
        return 'warning';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  const getErrorCount = (chargePointId: string) => {
    return recentErrors.filter((log) => log.chargePointId === chargePointId).length;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, fontSize: { xs: '1.75rem', sm: '2rem' }, minWidth: 0, flex: '1 1 200px' }}>
          Device Inventory
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            alignItems: 'stretch',
            width: { xs: '100%', sm: 'auto' },
          }}
        >
          <Button
            variant={showOnlyRealDevices ? 'contained' : 'outlined'}
            startIcon={<FilterListIcon />}
            onClick={() => setShowOnlyRealDevices(!showOnlyRealDevices)}
            color={showOnlyRealDevices ? 'primary' : 'inherit'}
            sx={{ width: { xs: '100%', sm: 'auto' }, whiteSpace: { sm: 'nowrap' } }}
          >
            {showOnlyRealDevices ? 'Show All Devices' : 'Real Devices Only'}
          </Button>
          <TextField
            placeholder="Search devices..."
            size="small"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => {
                    setSearchTerm('');
                    loadChargePoints();
                  }}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: { xs: 0, sm: 260 }, flex: { sm: 1 }, maxWidth: { sm: 400 } }}
          />
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2, mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ overflow: 'hidden' }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile>
          <Tab label="All Devices" />
          <Tab 
            label={
              <Badge badgeContent={recentErrors.length} color="error">
                Recent Errors
              </Badge>
            } 
          />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredChargePoints.length === 0 ? (
            <Paper sx={{ p: { xs: 2, sm: 3 }, mt: 2 }}>
              <Typography variant="body1" gutterBottom>
                {showOnlyRealDevices 
                  ? 'No real devices found.' 
                  : searchTerm 
                    ? 'No devices found matching your search.' 
                    : 'No charge points registered yet.'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {showOnlyRealDevices
                  ? 'Real devices are those with vendor name, serial number, and not matching dummy ID patterns (CP-ACC-*, CP-ASH-*, CP-WES-*).'
                  : searchTerm
                    ? 'Try a different search term or clear the search to see all devices.'
                    : 'Charge points will appear here after they connect and send BootNotification.'}
              </Typography>
            </Paper>
          ) : (
            <>
              {showOnlyRealDevices && (
                <Alert
                  severity="info"
                  sx={{ mt: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center', gap: 1, '& .MuiAlert-message': { width: { xs: '100%', sm: 'auto' } } }}
                >
                  Showing only real devices. Real devices have vendor name, serial number, and don't match dummy ID patterns.
                  <Button 
                    size="small" 
                    onClick={() => setShowOnlyRealDevices(false)}
                    sx={{ ml: { xs: 0, sm: 2 }, width: { xs: '100%', sm: 'auto' } }}
                  >
                    Show All Devices
                  </Button>
                </Alert>
              )}
            <TableContainer sx={{ mt: 2, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Charge Point ID</TableCell>
                    <TableCell>Vendor</TableCell>
                    <TableCell>Model</TableCell>
                    <TableCell>Serial Number</TableCell>
                    <TableCell>Firmware</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Last Heartbeat</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredChargePoints.map((cp) => {
                    const errorCount = getErrorCount(cp.chargePointId);
                    const isReal = isRealDevice(cp);
                    const hasRecentActivity = cp.lastHeartbeat && 
                      (new Date().getTime() - new Date(cp.lastHeartbeat).getTime()) < 24 * 60 * 60 * 1000; // Within 24 hours
                    
                    return (
                      <TableRow 
                        key={cp.chargePointId}
                        sx={{
                          backgroundColor: isReal ? 'rgba(76, 175, 80, 0.05)' : 'rgba(158, 158, 158, 0.05)',
                          '&:hover': {
                            backgroundColor: isReal ? 'rgba(76, 175, 80, 0.1)' : 'rgba(158, 158, 158, 0.1)',
                          }
                        }}
                      >
                        <TableCell>
                          <Tooltip title={isReal ? 'Real Device' : 'Dummy/Test Data'}>
                            {isReal ? (
                              <CheckCircleIcon color="success" fontSize="small" />
                            ) : (
                              <WarningIcon color="disabled" fontSize="small" />
                            )}
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight="medium">
                              {cp.chargePointId}
                            </Typography>
                            {hasRecentActivity && (
                              <Chip 
                                label="Active" 
                                color="success" 
                                size="small" 
                                sx={{ height: 18, fontSize: '0.65rem' }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {cp.vendorName || cp.vendor || (
                            <Typography variant="body2" color="text.secondary" fontStyle="italic">
                              No vendor
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{cp.model || '-'}</TableCell>
                        <TableCell>
                          {cp.serialNumber || (
                            <Typography variant="body2" color="text.secondary" fontStyle="italic">
                              No serial
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{cp.firmwareVersion || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={cp.status}
                            color={getStatusColor(cp.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {cp.lastHeartbeat ? (
                            <Tooltip title={new Date(cp.lastHeartbeat).toLocaleString()}>
                              <Typography variant="body2">
                                {new Date(cp.lastHeartbeat).toLocaleString()}
                              </Typography>
                            </Tooltip>
                          ) : (
                            <Typography variant="body2" color="text.secondary" fontStyle="italic">
                              Never
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {cp.locationAddress || (
                            cp.locationLatitude && cp.locationLongitude
                              ? `${cp.locationLatitude.toFixed(6)}, ${cp.locationLongitude.toFixed(6)}`
                              : '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => navigate(`${opsBase}/devices/${cp.chargePointId}`)}
                                color="primary"
                              >
                                <SearchIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="View Connection Logs & Debug">
                              <IconButton
                                size="small"
                                onClick={() => handleViewLogs(cp)}
                                color={errorCount > 0 ? 'error' : 'default'}
                              >
                                <Badge badgeContent={errorCount} color="error">
                                  <BugReportIcon fontSize="small" />
                                </Badge>
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            </>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 2,
              mb: 2,
              mt: 2,
            }}
          >
            <Typography variant="h6" sx={{ minWidth: 0 }}>
              Recent Connection Errors
            </Typography>
            {recentErrors.length > 0 && (
              <Button
                variant="outlined"
                color="primary"
                onClick={handleClearResolvedErrors}
                size="small"
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                Clear Resolved Errors
              </Button>
            )}
          </Box>
          {recentErrors.length === 0 ? (
            <Paper sx={{ p: { xs: 2, sm: 3 }, mt: 2 }}>
              <Typography variant="body1" gutterBottom>
                No recent connection errors.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All devices are connecting successfully.
              </Typography>
            </Paper>
          ) : (
            <TableContainer sx={{ mt: 2, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Charge Point ID</TableCell>
                    <TableCell>Event Type</TableCell>
                    <TableCell>Error Code</TableCell>
                    <TableCell>Error Message</TableCell>
                    <TableCell>Close Code</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentErrors.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {log.chargePointId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.eventType}
                          color={
                            log.eventType === 'error' || log.eventType === 'connection_failed'
                              ? 'error'
                              : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{log.errorCode || '-'}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {log.errorMessage || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>{log.closeCode || '-'}</TableCell>
                      <TableCell>
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={() => {
                            const cp = chargePoints.find((c) => c.chargePointId === log.chargePointId);
                            if (cp) {
                              handleViewLogs(cp);
                            }
                          }}
                        >
                          View Logs
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </Paper>

      {/* Connection Logs Dialog */}
      <Dialog
        open={logsDialogOpen}
        onClose={() => setLogsDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Connection Logs & Debug - {selectedChargePoint?.chargePointId}
        </DialogTitle>
        <DialogContent>
          {logsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              {/* Connection Statistics */}
              {connectionStats && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography variant="caption" color="text.secondary">
                          Total Attempts
                        </Typography>
                        <Typography variant="h6">{connectionStats.totalAttempts}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography variant="caption" color="text.secondary">
                          Successful
                        </Typography>
                        <Typography variant="h6" color="success.main">
                          {connectionStats.successfulConnections}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography variant="caption" color="text.secondary">
                          Failed
                        </Typography>
                        <Typography variant="h6" color="error.main">
                          {connectionStats.failedConnections}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography variant="caption" color="text.secondary">
                          Consecutive Failures
                        </Typography>
                        <Typography variant="h6" color={connectionStats.consecutiveFailures > 0 ? 'error.main' : 'success.main'}>
                          {connectionStats.consecutiveFailures}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {/* Last Error */}
              {connectionStats?.lastErrorCode && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Last Error: {connectionStats.lastErrorCode}
                  </Typography>
                  <Typography variant="body2">
                    {connectionStats.lastErrorMessage}
                  </Typography>
                  {connectionStats.lastFailedConnection && (
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      {new Date(connectionStats.lastFailedConnection).toLocaleString()}
                    </Typography>
                  )}
                </Alert>
              )}

              {/* Connection Logs Table */}
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Recent Connection Events
              </Typography>
              <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Event Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Error Code</TableCell>
                      <TableCell>Error Message</TableCell>
                      <TableCell>Close Code</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {connectionLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                            No connection logs found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      connectionLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            {new Date(log.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={log.eventType}
                              color={
                                log.eventType === 'error' || log.eventType === 'connection_failed'
                                  ? 'error'
                                  : log.eventType === 'connection_success'
                                  ? 'success'
                                  : 'default'
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {log.status && (
                              <Chip
                                label={log.status}
                                color={
                                  log.status === 'failed' || log.status === 'error'
                                    ? 'error'
                                    : log.status === 'success'
                                    ? 'success'
                                    : 'default'
                                }
                                size="small"
                              />
                            )}
                          </TableCell>
                          <TableCell>{log.errorCode || '-'}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {log.errorMessage || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {log.closeCode ? (
                              <Tooltip title={log.closeReason || ''}>
                                <Chip label={log.closeCode} size="small" color="error" />
                              </Tooltip>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


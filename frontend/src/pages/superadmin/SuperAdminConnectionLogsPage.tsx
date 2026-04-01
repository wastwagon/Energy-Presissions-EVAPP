import { useState, useEffect } from 'react';
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
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import IconButton from '@mui/material/IconButton';
import { connectionLogsApi, ConnectionLog, ConnectionEventType, ConnectionStatistics } from '../../services/connectionLogsApi';
import { dashboardPageTitleSx, dashboardPageSubtitleSx } from '../../theme/jampackShell';
import { getConnectionEventColor, getConnectionStatusColor } from '../../utils/statusColors';

export function SuperAdminConnectionLogsPage() {
  const [logs, setLogs] = useState<ConnectionLog[]>([]);
  const [statistics, setStatistics] = useState<ConnectionStatistics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<ConnectionEventType | ''>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  useEffect(() => {
    loadData();
  }, [page, eventTypeFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Only use searchTerm as chargePointId if it looks like a charge point ID
      // Otherwise, use search API
      let logsData;
      if (searchTerm && searchTerm.trim()) {
        // Try to get logs by chargePointId first
        try {
          logsData = await connectionLogsApi.getLogs(
            searchTerm.trim(),
            eventTypeFilter || undefined,
            limit,
            (page - 1) * limit,
          );
        } catch (searchErr) {
          // If that fails, try search API
          logsData = await connectionLogsApi.searchLogs(
            searchTerm.trim(),
            limit,
            (page - 1) * limit,
          );
        }
      } else {
        // No search term, get all logs
        logsData = await connectionLogsApi.getLogs(
          undefined,
          eventTypeFilter || undefined,
          limit,
          (page - 1) * limit,
        );
      }
      
      const statsData = await connectionLogsApi.getAllStatistics();
      
      setLogs(logsData.logs);
      setTotal(logsData.total);
      setStatistics(statsData);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load connection logs';
      setError(errorMessage);
      console.error('Error loading connection logs:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && logs.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" component="h1" sx={dashboardPageTitleSx}>
          Connection Logs
        </Typography>
        <Typography variant="body2" sx={dashboardPageSubtitleSx}>
          Monitor and debug charge point connections
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statistics.slice(0, 4).map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.chargePointId}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {stat.chargePointId}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {stat.successfulConnections} / {stat.totalAttempts}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Success Rate: {stat.totalAttempts > 0
                    ? Math.round((stat.successfulConnections / stat.totalAttempts) * 100)
                    : 0}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            placeholder="Search by charge point ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setPage(1); // Reset to first page when searching
                loadData();
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSearchTerm('');
                      setPage(1);
                      loadData();
                    }}
                    aria-label="Clear connection log search"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Event Type</InputLabel>
            <Select
              value={eventTypeFilter}
              label="Event Type"
              onChange={(e) => setEventTypeFilter(e.target.value as ConnectionEventType | '')}
            >
              <MenuItem value="">All Events</MenuItem>
              <MenuItem value="connection_attempt">Connection Attempt</MenuItem>
              <MenuItem value="connection_success">Connection Success</MenuItem>
              <MenuItem value="connection_failed">Connection Failed</MenuItem>
              <MenuItem value="connection_closed">Connection Closed</MenuItem>
              <MenuItem value="error">Error</MenuItem>
              <MenuItem value="message_error">Message Error</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <TableContainer component={Paper} sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>Charge Point</TableCell>
              <TableCell>Event Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Error Code</TableCell>
              <TableCell>IP Address</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No connection logs found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell>
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>{log.chargePointId}</TableCell>
                  <TableCell>
                    <Chip
                      label={log.eventType.replace('_', ' ')}
                      color={getConnectionEventColor(log.eventType)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {log.status && (
                      <Chip
                        label={log.status}
                        color={getConnectionStatusColor(log.status)}
                        size="small"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {log.errorCode || '-'}
                  </TableCell>
                  <TableCell>{log.ipAddress || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {total > limit && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={Math.ceil(total / limit)}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
}


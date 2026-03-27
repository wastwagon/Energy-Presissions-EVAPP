import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Button,
} from '@mui/material';
import MemoryIcon from '@mui/icons-material/Memory';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import RefreshIcon from '@mui/icons-material/Refresh';
import { healthApi } from '../../services/healthApi';

export function SuperAdminHealthPage() {
  const [health, setHealth] = useState<{ status: string; timestamp: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHealth = async () => {
    try {
      setError(null);
      const data = await healthApi.getHealth();
      setHealth(data);
    } catch (err: any) {
      setError(err.message || 'Failed to reach API');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
            System Health
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Monitor API and service status
          </Typography>
        </Box>
        <Button startIcon={<RefreshIcon />} onClick={loadHealth}>
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <MemoryIcon color="action" />
            <Typography variant="h6">API Status</Typography>
            {health ? (
              <Chip
                icon={<CheckCircleIcon />}
                label="Healthy"
                color="success"
                size="small"
              />
            ) : (
              <Chip
                icon={<ErrorIcon />}
                label="Unreachable"
                color="error"
                size="small"
              />
            )}
          </Box>
          {health && (
            <Typography variant="body2" color="text.secondary">
              Last check: {new Date(health.timestamp).toLocaleString()}
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

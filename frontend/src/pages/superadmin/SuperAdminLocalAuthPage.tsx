import { useState } from 'react';
import { Box, Typography, Paper, TextField, Button, Alert } from '@mui/material';
import { localAuthListApi } from '../../services/localAuthListApi';

export function SuperAdminLocalAuthPage() {
  const [chargePointId, setChargePointId] = useState('');
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadVersion = async () => {
    setError(null);
    setResult(null);
    const cp = chargePointId.trim();
    if (!cp) {
      setError('Charge point ID is required.');
      return;
    }
    setLoading(true);
    try {
      const data = await localAuthListApi.getVersion(cp);
      setResult(data);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography
        variant="h4"
        component="h1"
        sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5, fontSize: { xs: '1.75rem', sm: '2rem' } }}
      >
        Local authorization list
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Read local list version from a charge point. Sending list updates is done via the API from trusted operators.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { sm: 'flex-start' } }}>
          <TextField
            label="Charge point ID"
            size="small"
            value={chargePointId}
            onChange={(e) => setChargePointId(e.target.value)}
            fullWidth
            sx={{ maxWidth: { sm: 400 } }}
          />
          <Button variant="contained" onClick={loadVersion} disabled={loading} sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: 160 }}>
            {loading ? 'Loading…' : 'Get list version'}
          </Button>
        </Box>
        {result != null && (
          <Box
            component="pre"
            sx={{
              mt: 2,
              p: 2,
              borderRadius: 1,
              bgcolor: 'grey.100',
              fontSize: '0.875rem',
              overflow: 'auto',
            }}
          >
            {JSON.stringify(result, null, 2)}
          </Box>
        )}
      </Paper>
    </Box>
  );
}

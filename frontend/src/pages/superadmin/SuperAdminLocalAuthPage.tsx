import { useState } from 'react';
import { Box, Typography, Paper, TextField, Button, Alert } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { localAuthListApi } from '../../services/localAuthListApi';
import { authFormFieldSx, compactContainedCtaSx, sxObject } from '../../styles/authShell';
import { dashboardPageSubtitleSx, dashboardPageTitleSx, premiumPanelCardSx } from '../../theme/jampackShell';
import { OpsQuickActions } from '../../components/dashboard/OpsQuickActions';

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
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <Typography variant="h6" component="h1" sx={dashboardPageTitleSx}>
        Local authorization list
      </Typography>
      <Typography variant="body2" sx={{ ...dashboardPageSubtitleSx, mb: 2 }}>
        Read local list version from a charge point. Sending list updates is done via the API from trusted operators.
      </Typography>

      <OpsQuickActions />

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2, py: 0.5 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper elevation={0} sx={premiumPanelCardSx}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, alignItems: { sm: 'flex-end' } }}>
          <TextField
            label="Charge point ID"
            size="small"
            value={chargePointId}
            onChange={(e) => setChargePointId(e.target.value)}
            fullWidth
            margin="none"
            sx={(th) => ({
              ...sxObject(th, authFormFieldSx),
              flex: 1,
              maxWidth: { sm: 420 },
            })}
          />
          <Button
            variant="contained"
            color="primary"
            disableElevation
            onClick={loadVersion}
            disabled={loading}
            sx={(th) => ({
              ...sxObject(th, compactContainedCtaSx),
              width: { xs: '100%', sm: 'auto' },
              minWidth: { sm: 168 },
            })}
          >
            {loading ? 'Loading…' : 'Get list version'}
          </Button>
        </Box>
        {result != null && (
          <Box
            component="pre"
            sx={(theme) => ({
              mt: 2,
              p: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.text.primary, 0.04),
              border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
              fontSize: '0.8125rem',
              overflow: 'auto',
              WebkitOverflowScrolling: 'touch',
              lineHeight: 1.5,
            })}
          >
            {JSON.stringify(result, null, 2)}
          </Box>
        )}
      </Paper>
    </Box>
  );
}

import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
} from '@mui/material';
import { smartChargingApi } from '../../services/smartChargingApi';
import { dashboardPageTitleSx, dashboardPageSubtitleSx, premiumPanelCardSx } from '../../theme/jampackShell';
import {
  authFormFieldSx,
  compactContainedCtaSx,
  compactOutlinedCtaSx,
  sxObject,
} from '../../styles/authShell';

export function SuperAdminSmartChargingPage() {
  const [chargePointId, setChargePointId] = useState('');
  const [connectorId, setConnectorId] = useState('1');
  const [duration, setDuration] = useState('3600');
  const [profilesCpId, setProfilesCpId] = useState('');
  const [result, setResult] = useState<unknown>(null);
  const [profilesResult, setProfilesResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedule = async () => {
    setError(null);
    setResult(null);
    const cp = chargePointId.trim();
    const ci = parseInt(connectorId, 10);
    const dur = parseInt(duration, 10);
    if (!cp || Number.isNaN(ci) || Number.isNaN(dur)) {
      setError('Charge point ID, connector ID, and duration are required.');
      return;
    }
    setLoading(true);
    try {
      const data = await smartChargingApi.getCompositeSchedule({
        chargePointId: cp,
        connectorId: ci,
        duration: dur,
      });
      setResult(data);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    setError(null);
    setProfilesResult(null);
    const cp = profilesCpId.trim();
    if (!cp) {
      setError('Charge point ID is required for profiles.');
      return;
    }
    setProfilesLoading(true);
    try {
      const data = await smartChargingApi.getProfiles(cp);
      setProfilesResult(data);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Request failed');
    } finally {
      setProfilesLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" component="h1" sx={dashboardPageTitleSx}>
        Smart charging
      </Typography>
      <Typography variant="body2" sx={{ ...dashboardPageSubtitleSx, mb: 3 }}>
        Inspect composite schedules and charging profiles via the CSMS API (OCPP smart charging).
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper elevation={0} sx={{ ...premiumPanelCardSx, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Composite schedule
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Charge point ID"
            size="small"
            value={chargePointId}
            onChange={(e) => setChargePointId(e.target.value)}
            sx={(th) => ({
              ...sxObject(th, authFormFieldSx),
              minWidth: { sm: 200 },
              flex: { sm: 1 },
            })}
          />
          <TextField
            label="Connector ID"
            size="small"
            type="number"
            value={connectorId}
            onChange={(e) => setConnectorId(e.target.value)}
            sx={(th) => ({
              ...sxObject(th, authFormFieldSx),
              width: { xs: '100%', sm: 120 },
            })}
          />
          <TextField
            label="Duration (sec)"
            size="small"
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            sx={(th) => ({
              ...sxObject(th, authFormFieldSx),
              width: { xs: '100%', sm: 140 },
            })}
          />
          <Button
            variant="contained"
            disableElevation
            onClick={fetchSchedule}
            disabled={loading}
            sx={(th) => ({
              ...sxObject(th, compactContainedCtaSx),
              width: { xs: '100%', sm: 'auto' },
              minWidth: { sm: 140 },
            })}
          >
            {loading ? 'Loading…' : 'Fetch schedule'}
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
              fontSize: '0.75rem',
              overflow: 'auto',
              maxHeight: 320,
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {JSON.stringify(result, null, 2)}
          </Box>
        )}
      </Paper>

      <Paper elevation={0} sx={premiumPanelCardSx}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Charging profiles for charge point
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { sm: 'center' } }}>
          <TextField
            label="Charge point ID"
            size="small"
            value={profilesCpId}
            onChange={(e) => setProfilesCpId(e.target.value)}
            fullWidth
            sx={(th) => ({
              ...sxObject(th, authFormFieldSx),
              maxWidth: { sm: 400 },
            })}
          />
          <Button
            variant="outlined"
            onClick={fetchProfiles}
            disabled={profilesLoading}
            sx={(th) => ({
              ...sxObject(th, compactOutlinedCtaSx),
              width: { xs: '100%', sm: 'auto' },
              minWidth: { sm: 140 },
            })}
          >
            {profilesLoading ? 'Loading…' : 'Load profiles'}
          </Button>
        </Box>
        {profilesResult != null && (
          <Box
            component="pre"
            sx={{
              mt: 2,
              p: 2,
              borderRadius: 1,
              bgcolor: 'grey.100',
              fontSize: '0.75rem',
              overflow: 'auto',
              maxHeight: 320,
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {JSON.stringify(profilesResult, null, 2)}
          </Box>
        )}
      </Paper>
    </Box>
  );
}

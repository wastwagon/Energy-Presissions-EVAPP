import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import {
  CELLULAR_OPS_SUMMARY,
  CELLULAR_PROVIDER_OPTIONS,
} from '../../constants/chargerCellularGhana';
import { AppBadge } from '../ui/AppBadge';

interface ChargerCellularGuideProps {
  /** Show compact single-line alert only */
  compact?: boolean;
}

export function ChargerCellularGuide({ compact = false }: ChargerCellularGuideProps) {
  if (compact) {
    return (
      <Alert severity="info" icon={<SignalCellularAltIcon />} sx={{ mb: 2 }}>
        {CELLULAR_OPS_SUMMARY}
      </Alert>
    );
  }

  return (
    <Accordion
      disableGutters
      elevation={0}
      sx={{
        mb: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        '&:before': { display: 'none' },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <SignalCellularAltIcon color="primary" fontSize="small" />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Cellular SIM (MTN recommended)
          </Typography>
          <AppBadge label="Not Telecel" tone="neutral" size="small" sx={{ ml: 0.5 }} />
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        <Typography variant="body2" color="text.secondary" paragraph>
          {CELLULAR_OPS_SUMMARY} If the charger shows offline or stale heartbeats, verify power,
          antenna, and that the modem APN matches the SIM operator.
        </Typography>
        {CELLULAR_PROVIDER_OPTIONS.filter((p) => p.id !== 'Other').map((preset) => (
          <Box
            key={preset.id}
            sx={{
              mb: 1.5,
              p: 1.5,
              borderRadius: 1.5,
              bgcolor: preset.recommended ? 'action.hover' : 'transparent',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {preset.label}
              </Typography>
              {preset.recommended && <AppBadge label="Recommended" tone="brand" size="small" />}
              <Typography variant="caption" color="text.secondary">
                APN: <strong>{preset.apn || '—'}</strong>
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" display="block">
              {preset.notes}
            </Typography>
          </Box>
        ))}
        <Alert severity="warning" sx={{ mt: 1 }}>
          ICCID and IMSI are filled automatically when the charger boots over OCPP. Record the site
          provider and APN in device settings so field teams stay consistent.
        </Alert>
      </AccordionDetails>
    </Accordion>
  );
}

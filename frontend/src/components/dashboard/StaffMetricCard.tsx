import type { ReactNode } from 'react';
import { Box, Paper, Typography, type SxProps, type Theme } from '@mui/material';
import { premiumPanelCardSx } from '../../theme/jampackShell';

export type StaffMetricTone = 'default' | 'brand' | 'success' | 'warning' | 'info';

export type StaffMetricCardProps = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  /** Prefer `default` / `brand` for premium SaaS calm; reserve warning/info for true signals. */
  tone?: StaffMetricTone;
  sx?: SxProps<Theme>;
};

const valueColor: Record<StaffMetricTone, string> = {
  default: 'text.primary',
  brand: 'primary.main',
  success: 'primary.dark',
  warning: 'warning.dark',
  info: 'info.dark',
};

/**
 * Compact KPI tile — Untitled UI–style metrics without rainbow number colors.
 */
export function StaffMetricCard({
  label,
  value,
  hint,
  icon,
  tone = 'default',
  sx,
}: StaffMetricCardProps) {
  return (
    <Paper
      elevation={0}
      sx={[
        premiumPanelCardSx,
        { p: { xs: 1.75, sm: 2 } },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75, minHeight: 24 }}>
        {icon ? (
          <Box sx={{ display: 'flex', color: 'primary.main', '& .MuiSvgIcon-root': { fontSize: 20 } }} aria-hidden>
            {icon}
          </Box>
        ) : null}
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, letterSpacing: '-0.01em' }}>
          {label}
        </Typography>
      </Box>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: valueColor[tone],
          lineHeight: 1.25,
          fontSize: { xs: '1.35rem', sm: '1.5rem' },
        }}
      >
        {value}
      </Typography>
      {hint ? (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.75, lineHeight: 1.4 }}>
          {hint}
        </Typography>
      ) : null}
    </Paper>
  );
}

import type { ReactNode, KeyboardEvent } from 'react';
import { Box, Paper, Typography, type SxProps, type Theme } from '@mui/material';
import { premiumPanelCardSx, jampackKpiCardHoverSx } from '../../theme/jampackShell';
import { MiniSparkline } from './MiniSparkline';
import { formatTrendPercent } from '../../utils/revenueTrendCompare';

export type StaffMetricTone = 'default' | 'brand' | 'success' | 'warning' | 'info';

export type StaffMetricCardProps = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  /** Prefer `default` / `brand` for premium SaaS calm; reserve warning/info for true signals. */
  tone?: StaffMetricTone;
  /** Period-over-period % change (e.g. +7.4). */
  trendPercent?: number | null;
  /** Optional sparkline series (same period). */
  sparklineValues?: number[];
  sparklineLabel?: string;
  /** When set, card is keyboard-activatable. */
  onClick?: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  ariaLabel?: string;
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
  trendPercent,
  sparklineValues,
  sparklineLabel,
  onClick,
  onKeyDown,
  ariaLabel,
  sx,
}: StaffMetricCardProps) {
  const interactive = onClick != null;
  const trendLabel = formatTrendPercent(trendPercent);
  const trendPositive = trendPercent != null && trendPercent > 0;
  const trendNegative = trendPercent != null && trendPercent < 0;

  return (
    <Paper
      elevation={0}
      sx={[
        premiumPanelCardSx,
        { p: { xs: 1.75, sm: 2 } },
        ...(interactive ? [jampackKpiCardHoverSx, { cursor: 'pointer' }] : []),
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      onClick={onClick}
      onKeyDown={onKeyDown}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={ariaLabel}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 0.75 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minHeight: 24, minWidth: 0 }}>
          {icon ? (
            <Box sx={{ display: 'flex', color: 'primary.main', '& .MuiSvgIcon-root': { fontSize: 20 } }} aria-hidden>
              {icon}
            </Box>
          ) : null}
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, letterSpacing: '-0.01em' }}>
            {label}
          </Typography>
        </Box>
        {sparklineValues && sparklineValues.length >= 2 ? (
          <MiniSparkline values={sparklineValues} label={sparklineLabel ?? `${label} trend`} />
        ) : null}
      </Box>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: valueColor[tone],
          lineHeight: 1.25,
          fontSize: { xs: '1.35rem', sm: '1.5rem' },
          wordBreak: 'break-word',
        }}
      >
        {value}
      </Typography>
      {trendLabel ? (
        <Typography
          variant="caption"
          display="block"
          sx={{
            mt: 0.75,
            fontWeight: 600,
            color: trendPositive ? 'success.dark' : trendNegative ? 'error.dark' : 'text.secondary',
          }}
        >
          {trendLabel}
          <Typography component="span" variant="caption" color="text.secondary" sx={{ fontWeight: 500, ml: 0.5 }}>
            vs prior half
          </Typography>
        </Typography>
      ) : null}
      {hint ? (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: trendLabel ? 0.35 : 0.75, lineHeight: 1.4 }}>
          {hint}
        </Typography>
      ) : null}
    </Paper>
  );
}

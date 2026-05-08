import { Paper, Box, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { jampackKpiCardBaseSx, jampackKpiCardHoverSx } from '../../theme/jampackShell';

export type DashboardMetricHoverAccent = 'primary' | 'info' | 'secondary';

export type DashboardMetricCardProps = {
  value: React.ReactNode;
  label: string;
  icon: React.ReactNode;
  /** Accessible name when card is interactive */
  ariaLabel: string;
  onClick: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  /** Optional hover border tint (desktop / fine pointer) */
  hoverAccent?: DashboardMetricHoverAccent;
  /** e.g. currency: smaller fluid type on narrow screens */
  valueSx?: SxProps<Theme>;
};

export function DashboardMetricCard({
  value,
  label,
  icon,
  ariaLabel,
  onClick,
  onKeyDown,
  hoverAccent,
  valueSx,
}: DashboardMetricCardProps) {
  const hoverTint =
    hoverAccent != null
      ? ([
          {
            '@media (hover: hover) and (pointer: fine)': {
              '&:hover': { borderColor: `${hoverAccent}.main` as const },
            },
          },
        ] as const)
      : [];

  return (
    <Paper
      elevation={0}
      sx={[jampackKpiCardBaseSx, jampackKpiCardHoverSx, { cursor: 'pointer' }, ...hoverTint]}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, ...valueSx }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
          </Box>
          {icon}
        </Box>
      </Box>
    </Paper>
  );
}

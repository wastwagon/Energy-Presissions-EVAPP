import { Box } from '@mui/material';
import { alpha, Theme } from '@mui/material/styles';
import { jampackKpiCardBaseSx } from '../../theme/jampackShell';

export type DashboardNavAccent = 'primary' | 'info' | 'success' | 'error' | 'secondary';

export function DashboardNavIcon({
  accent,
  children,
  compact,
  noRightMargin,
}: {
  accent: DashboardNavAccent;
  children: React.ReactNode;
  /** Tighter padding for stat / KPI rows */
  compact?: boolean;
  /** Use when icon sits in a space-between row */
  noRightMargin?: boolean;
}) {
  return (
    <Box
      sx={{
        p: compact ? 1.5 : 1.75,
        borderRadius: 2,
        bgcolor: (theme) => alpha(theme.palette[accent].main, 0.12),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mr: noRightMargin ? 0 : 2,
        flexShrink: 0,
      }}
    >
      {children}
    </Box>
  );
}

/** Hover lift + shadow for clickable dashboard module cards (Jampack surface). */
export function premiumNavCardSx(accent: DashboardNavAccent) {
  return {
    ...jampackKpiCardBaseSx,
    cursor: 'pointer',
    transition: 'box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
    '@media (hover: hover) and (pointer: fine)': {
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: (theme: Theme) => theme.shadows[4],
        borderColor: (theme: Theme) => theme.palette[accent].main,
      },
    },
  };
}

/** Subtle hover for non-clickable KPI / stat cards */
export function premiumStatCardSx(accent: DashboardNavAccent) {
  return {
    ...jampackKpiCardBaseSx,
    transition: 'box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
    '@media (hover: hover) and (pointer: fine)': {
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: (theme: Theme) => theme.shadows[3],
        borderColor: (theme: Theme) => theme.palette[accent].main,
      },
    },
  };
}

import { Paper, Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { DashboardNavIcon, type DashboardNavAccent, premiumStatCardSx } from './DashboardNavIcon';

export type DashboardStatTileProps = {
  value: ReactNode;
  /** Short line under the value (sentence case) */
  caption: string;
  icon: ReactNode;
  accent: DashboardNavAccent;
  /** Optional label opposite the icon (e.g. “Stations”) */
  kicker?: string;
};

/**
 * Non-interactive KPI tile (e.g. operations overview). Uses grouped “iOS settings” style surface.
 */
export function DashboardStatTile({ caption, value, icon, accent, kicker }: DashboardStatTileProps) {
  return (
    <Paper elevation={0} sx={{ bgcolor: 'background.paper', ...premiumStatCardSx(accent) }}>
      <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <DashboardNavIcon accent={accent} compact noRightMargin>
            {icon}
          </DashboardNavIcon>
          {kicker != null ? (
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {kicker}
            </Typography>
          ) : null}
        </Box>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: 'text.primary',
            mb: 0.5,
            fontSize: { xs: '1.5rem', sm: '1.75rem' },
          }}
        >
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {caption}
        </Typography>
      </Box>
    </Paper>
  );
}

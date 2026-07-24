import type { ReactNode } from 'react';
import { Box, type SxProps, type Theme } from '@mui/material';
import { iosRadii } from '../../theme/iosMobileTokens';

export type StaffFilterBarProps = {
  children: ReactNode;
  /** Accessible name for the filter region */
  'aria-label'?: string;
  sx?: SxProps<Theme>;
};

/**
 * Shared filter / search toolbar for staff tables — keeps filters out of the page title row.
 */
export function StaffFilterBar({
  children,
  'aria-label': ariaLabel = 'Filters',
  sx,
}: StaffFilterBarProps) {
  return (
    <Box
      role="search"
      aria-label={ariaLabel}
      sx={[
        {
          mb: 2,
          p: { xs: 1.5, sm: 2 },
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1.5,
          alignItems: 'center',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: `${iosRadii.md}px`,
          boxShadow: (theme) =>
            theme.palette.mode === 'light' ? '0 1px 0 rgba(15, 23, 42, 0.04)' : 'none',
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}
    </Box>
  );
}

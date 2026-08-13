import type { ReactNode } from 'react';
import { Box, Button, Stack } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { StaffFilterBar } from './StaffFilterBar';
import { StaffPeriodChips, type StaffPeriodDays } from './StaffPeriodChips';
import { compactContainedCtaSx, sxObject } from '../../styles/authShell';

export type StaffReportToolbarProps = {
  periodDays: StaffPeriodDays;
  onPeriodChange: (days: StaffPeriodDays) => void;
  onExport?: () => void;
  exportLabel?: string;
  exportDisabled?: boolean;
  exporting?: boolean;
  /** Extra actions (e.g. Billing link) rendered after export */
  endActions?: ReactNode;
  'aria-label'?: string;
};

/**
 * Untitled UI–style reports chrome: period chips + primary export CTA.
 */
export function StaffReportToolbar({
  periodDays,
  onPeriodChange,
  onExport,
  exportLabel = 'Export report',
  exportDisabled,
  exporting,
  endActions,
  'aria-label': ariaLabel = 'Report period and export',
}: StaffReportToolbarProps) {
  return (
    <StaffFilterBar aria-label={ariaLabel} sx={{ mb: 2.5 }}>
      <StaffPeriodChips value={periodDays} onChange={onPeriodChange} disabled={exporting} />
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        sx={{
          ml: { xs: 0, sm: 'auto' },
          width: { xs: '100%', sm: 'auto' },
          alignItems: { xs: 'stretch', sm: 'center' },
        }}
      >
        {onExport ? (
          <Button
            variant="contained"
            disableElevation
            startIcon={<DownloadIcon />}
            disabled={exportDisabled || exporting}
            onClick={onExport}
            sx={(th) => ({
              ...sxObject(th, compactContainedCtaSx),
              width: { xs: '100%', sm: 'auto' },
              minHeight: 44,
            })}
          >
            {exporting ? 'Exporting…' : exportLabel}
          </Button>
        ) : null}
        {endActions ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 1,
              width: { xs: '100%', sm: 'auto' },
              '& > *': { width: { xs: '100%', sm: 'auto' } },
            }}
          >
            {endActions}
          </Box>
        ) : null}
      </Stack>
    </StaffFilterBar>
  );
}

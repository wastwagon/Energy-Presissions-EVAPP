import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { iosRadii } from '../../theme/iosMobileTokens';

export type StaffPeriodDays = 7 | 30 | 90;

const OPTIONS: { value: StaffPeriodDays; label: string }[] = [
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
];

type StaffPeriodChipsProps = {
  value: StaffPeriodDays;
  onChange: (days: StaffPeriodDays) => void;
  /** Disable while trend data is refreshing */
  disabled?: boolean;
};

/**
 * Period selector for staff dashboards / reports (Untitled UI light pattern).
 */
export function StaffPeriodChips({ value, onChange, disabled }: StaffPeriodChipsProps) {
  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={value}
      disabled={disabled}
      onChange={(_, next: StaffPeriodDays | null) => {
        if (next != null) onChange(next);
      }}
      aria-label="Dashboard period"
      sx={{
        flexWrap: 'wrap',
        gap: 0.5,
        '& .MuiToggleButtonGroup-grouped': {
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: `${iosRadii.sm}px !important`,
          mx: 0,
          px: 1.25,
          py: 0.5,
          minWidth: 44,
          minHeight: 36,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.8125rem',
          color: 'text.secondary',
          '&.Mui-selected': {
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            borderColor: 'primary.main',
            '&:hover': { bgcolor: 'primary.dark' },
          },
        },
      }}
    >
      {OPTIONS.map((opt) => (
        <ToggleButton key={opt.value} value={opt.value} aria-label={`Last ${opt.label}`}>
          {opt.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

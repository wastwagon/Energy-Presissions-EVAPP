import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { iosRadii } from '../../theme/iosMobileTokens';

export type StaffStatusTabOption<T extends string = string> = {
  value: T;
  label: string;
  /** Optional count shown as “Label (n)” */
  count?: number;
};

type StaffStatusTabsProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: StaffStatusTabOption<T>[];
  'aria-label'?: string;
  disabled?: boolean;
};

/**
 * Untitled UI–style status / segment chips for staff list pages (light theme).
 */
export function StaffStatusTabs<T extends string>({
  value,
  onChange,
  options,
  'aria-label': ariaLabel = 'Status filter',
  disabled,
}: StaffStatusTabsProps<T>) {
  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={value}
      disabled={disabled}
      onChange={(_, next: T | null) => {
        if (next != null) onChange(next);
      }}
      aria-label={ariaLabel}
      sx={{
        flexWrap: 'wrap',
        gap: 0.5,
        width: { xs: '100%', sm: 'auto' },
        '& .MuiToggleButtonGroup-grouped': {
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: `${iosRadii.sm}px !important`,
          mx: 0,
          px: 1.25,
          py: 0.5,
          minHeight: 36,
          minWidth: 44,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.8125rem',
          color: 'text.secondary',
          '&.Mui-selected': {
            bgcolor: 'action.selected',
            color: 'text.primary',
            borderColor: 'primary.main',
            '&:hover': { bgcolor: 'action.selected' },
          },
        },
      }}
    >
      {options.map((opt) => (
        <ToggleButton key={opt.value} value={opt.value} aria-label={opt.label}>
          {opt.count != null ? `${opt.label} (${opt.count})` : opt.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

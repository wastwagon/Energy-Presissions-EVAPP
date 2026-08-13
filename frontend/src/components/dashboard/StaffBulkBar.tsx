import { Box, Button, Checkbox, Typography } from '@mui/material';
import { compactContainedCtaSx, compactOutlinedCtaSx, sxObject } from '../../styles/authShell';

export function StaffSelectCheckbox({
  checked,
  indeterminate,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <Checkbox
      checked={checked}
      indeterminate={Boolean(indeterminate)}
      onChange={(event) => onChange(event.target.checked)}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      inputProps={{ 'aria-label': label }}
      sx={{ minWidth: 44, minHeight: 44 }}
    />
  );
}

type BulkAction = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
};

export function StaffBulkBar({
  count,
  progress,
  onClear,
  actions,
}: {
  count: number;
  progress?: string | null;
  onClear: () => void;
  actions: BulkAction[];
}) {
  if (count <= 0 && !progress) return null;

  return (
    <Box
      sx={{
        px: { xs: 2, sm: 2.5 },
        py: 1.25,
        borderBottom: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: 1,
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', flex: 1 }}>
        {progress || `${count} selected`}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          width: { xs: '100%', sm: 'auto' },
        }}
      >
        {actions.map((action) => (
          <Button
            key={action.label}
            disableElevation
            variant={action.variant === 'primary' ? 'contained' : 'outlined'}
            disabled={action.disabled || Boolean(progress)}
            onClick={action.onClick}
            sx={(th) => ({
              ...sxObject(th, action.variant === 'primary' ? compactContainedCtaSx : compactOutlinedCtaSx),
              flex: { xs: '1 1 calc(50% - 4px)', sm: '0 0 auto' },
              minHeight: 44,
            })}
          >
            {action.label}
          </Button>
        ))}
        <Button
          disableElevation
          variant="outlined"
          disabled={Boolean(progress)}
          onClick={onClear}
          sx={(th) => ({
            ...sxObject(th, compactOutlinedCtaSx),
            flex: { xs: '1 1 calc(50% - 4px)', sm: '0 0 auto' },
            minHeight: 44,
          })}
        >
          Clear
        </Button>
      </Box>
    </Box>
  );
}

import { Switch, ListItem, ListItemText, Divider, type SwitchProps } from '@mui/material';
import { iosGroupedListRowSx, iosGroupedRowDividerSx } from '../../theme/iosGroupedList';
import { triggerHaptic } from '../../utils/haptics';

interface GroupedSwitchRowProps {
  label: string;
  secondary?: string;
  checked: boolean;
  onChange: SwitchProps['onChange'];
  disabled?: boolean;
  divider?: boolean;
}

/** iOS Settings-style toggle row inside a grouped list. */
export function GroupedSwitchRow({
  label,
  secondary,
  checked,
  onChange,
  disabled = false,
  divider = false,
}: GroupedSwitchRowProps) {
  return (
    <>
      <ListItem
        sx={{
          ...iosGroupedListRowSx,
          py: secondary ? 1 : 1.25,
        }}
        secondaryAction={
          <Switch
            edge="end"
            checked={checked}
            onChange={(e, value) => {
              if (!disabled) triggerHaptic('light');
              onChange?.(e, value);
            }}
            disabled={disabled}
            inputProps={{ 'aria-label': label }}
          />
        }
        disablePadding
      >
        <ListItemText
          primary={label}
          secondary={secondary}
          primaryTypographyProps={{ fontWeight: 500, fontSize: '1rem' }}
          secondaryTypographyProps={{ fontSize: '0.8125rem' }}
        />
      </ListItem>
      {divider ? <Divider sx={iosGroupedRowDividerSx} /> : null}
    </>
  );
}

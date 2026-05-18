import { ReactNode } from 'react';
import {
  ListItemButton,
  ListItemText,
  Divider,
  Box,
  type ListItemTextProps,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { iosGroupedListRowSx, iosGroupedRowDividerSx } from '../../theme/iosGroupedList';
import { triggerHaptic } from '../../utils/haptics';

interface GroupedListRowProps {
  primary: ReactNode;
  secondary?: ReactNode;
  onClick?: () => void;
  end?: ReactNode;
  showChevron?: boolean;
  divider?: boolean;
  disabled?: boolean;
  /** Light tap feedback when the row is pressed (default on for interactive rows). */
  haptic?: boolean;
  primaryTypographyProps?: ListItemTextProps['primaryTypographyProps'];
  secondaryTypographyProps?: ListItemTextProps['secondaryTypographyProps'];
  'aria-label'?: string;
}

export function GroupedListRow({
  primary,
  secondary,
  onClick,
  end,
  showChevron = Boolean(onClick),
  divider = false,
  disabled = false,
  haptic = true,
  primaryTypographyProps,
  secondaryTypographyProps,
  'aria-label': ariaLabel,
}: GroupedListRowProps) {
  const interactive = Boolean(onClick) && !disabled;

  const handleClick = () => {
    if (!onClick || disabled) return;
    if (haptic) triggerHaptic('light');
    onClick();
  };

  return (
    <>
      <ListItemButton
        onClick={handleClick}
        disabled={disabled || !onClick}
        aria-label={ariaLabel}
        sx={{
          ...iosGroupedListRowSx,
          cursor: interactive ? 'pointer' : 'default',
        }}
      >
        <ListItemText
          primary={primary}
          secondary={secondary}
          primaryTypographyProps={{
            fontWeight: 500,
            fontSize: '1rem',
            letterSpacing: '-0.01em',
            ...primaryTypographyProps,
          }}
          secondaryTypographyProps={{
            fontSize: '0.8125rem',
            color: 'text.secondary',
            ...secondaryTypographyProps,
          }}
        />
        {(end || (showChevron && interactive)) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0, ml: 1 }}>
            {end}
            {showChevron && interactive ? (
              <ChevronRightIcon sx={{ fontSize: 22, color: 'text.disabled' }} aria-hidden />
            ) : null}
          </Box>
        )}
      </ListItemButton>
      {divider ? <Divider sx={iosGroupedRowDividerSx} /> : null}
    </>
  );
}

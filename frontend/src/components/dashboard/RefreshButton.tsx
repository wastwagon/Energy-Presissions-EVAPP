import { Button, CircularProgress, SxProps, Theme } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { triggerHaptic } from '../../utils/haptics';

interface RefreshButtonProps {
  refreshing: boolean;
  onClick: () => void;
  disabled?: boolean;
  label?: string;
  sx?: SxProps<Theme>;
}

export function RefreshButton({
  refreshing,
  onClick,
  disabled = false,
  label = 'Refresh',
  sx,
}: RefreshButtonProps) {
  return (
    <Button
      variant="outlined"
      onClick={() => {
        if (!refreshing && !disabled) triggerHaptic('light');
        onClick();
      }}
      disabled={disabled || refreshing}
      startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
      sx={sx}
    >
      {label}
    </Button>
  );
}

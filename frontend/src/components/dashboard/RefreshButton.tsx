import { Button, CircularProgress, SxProps, Theme } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

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
      onClick={onClick}
      disabled={disabled || refreshing}
      startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
      sx={sx}
    >
      {label}
    </Button>
  );
}

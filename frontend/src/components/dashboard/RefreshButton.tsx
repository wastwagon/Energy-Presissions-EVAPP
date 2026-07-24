import { Button, CircularProgress, SxProps, Theme } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { triggerHaptic } from '../../utils/haptics';
import { compactOutlinedCtaSx, sxObject } from '../../styles/authShell';

interface RefreshButtonProps {
  refreshing: boolean;
  onClick: () => void;
  disabled?: boolean;
  label?: string;
  sx?: SxProps<Theme>;
}

/** Secondary outlined refresh — always uses compact CTA chrome (Untitled UI secondary). */
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
      startIcon={refreshing ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
      aria-busy={refreshing || undefined}
      sx={(theme) => ({
        ...sxObject(theme, compactOutlinedCtaSx),
        ...(sx ? sxObject(theme, sx) : {}),
      })}
    >
      {refreshing ? 'Refreshing…' : label}
    </Button>
  );
}

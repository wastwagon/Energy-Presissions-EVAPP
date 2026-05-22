import { Box } from '@mui/material';
import type { PointerEvent } from 'react';
import { premiumIconButtonTouchSx, sxObject } from '../../styles/authShell';
import type { Theme } from '@mui/material/styles';

const handleSx = {
  width: 36,
  height: 5,
  borderRadius: 3,
  bgcolor: 'rgba(60, 60, 67, 0.3)',
  mx: 'auto',
  flexShrink: 0,
};

type SheetDragHandleProps = {
  /** When set, the handle is a button that cycles sheet height (e.g. map list on mobile). */
  onSnapToggle?: () => void;
  ariaLabel?: string;
  onPointerDown?: (e: PointerEvent<HTMLButtonElement>) => void;
  onPointerMove?: (e: PointerEvent<HTMLButtonElement>) => void;
  onPointerUp?: (e: PointerEvent<HTMLButtonElement>) => void;
  onPointerCancel?: (e: PointerEvent<HTMLButtonElement>) => void;
};

/** iOS-style grab handle for bottom sheets and map panels. */
export function SheetDragHandle({
  onSnapToggle,
  ariaLabel = 'Adjust panel height',
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: SheetDragHandleProps) {
  const handle = <Box sx={handleSx} aria-hidden />;

  if (!onSnapToggle) {
    return (
      <Box sx={{ mt: 1.25, mb: 0.75, flexShrink: 0 }} aria-hidden>
        {handle}
      </Box>
    );
  }

  return (
    <Box
      component="button"
      type="button"
      onClick={onSnapToggle}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      aria-label={ariaLabel}
      style={{ touchAction: 'none' }}
      sx={(th: Theme) => ({
        ...sxObject(th, premiumIconButtonTouchSx),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: 44,
        mt: 0.5,
        mb: 0.25,
        flexShrink: 0,
        border: 0,
        bgcolor: 'transparent',
        cursor: 'pointer',
        borderRadius: 2,
      })}
    >
      {handle}
    </Box>
  );
}

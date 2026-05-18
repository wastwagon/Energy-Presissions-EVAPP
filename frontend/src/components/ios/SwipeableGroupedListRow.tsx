import { ReactNode, useRef, useState } from 'react';
import { Box, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { IOS_TOUCH_TARGET_PX } from '../../theme/iosMobileTokens';
import { triggerHaptic } from '../../utils/haptics';
import { premiumIconButtonTouchSx, sxObject } from '../../styles/authShell';

const REVEAL_PX = 72;
const OPEN_THRESHOLD_PX = 36;

interface SwipeableGroupedListRowProps {
  children: ReactNode;
  onDelete: () => void;
  deleteAriaLabel?: string;
  disabled?: boolean;
}

/**
 * Swipe left on a grouped list row to reveal delete (iOS Mail-style).
 */
export function SwipeableGroupedListRow({
  children,
  onDelete,
  deleteAriaLabel = 'Delete',
  disabled = false,
}: SwipeableGroupedListRowProps) {
  const [offsetX, setOffsetX] = useState(0);
  const touchStartX = useRef(0);
  const dragging = useRef(false);

  const clampOffset = (x: number) => Math.max(-REVEAL_PX, Math.min(0, x));

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: REVEAL_PX,
          bgcolor: 'error.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IconButton
          onClick={() => {
            setOffsetX(0);
            triggerHaptic('medium');
            onDelete();
          }}
          aria-label={deleteAriaLabel}
          sx={(th) => ({
            ...sxObject(th, premiumIconButtonTouchSx),
            color: 'error.contrastText',
            minWidth: IOS_TOUCH_TARGET_PX,
            minHeight: IOS_TOUCH_TARGET_PX,
          })}
        >
          <DeleteIcon />
        </IconButton>
      </Box>
      <Box
        sx={{
          transform: `translateX(${offsetX}px)`,
          transition: dragging.current ? 'none' : 'transform 0.22s ease',
          bgcolor: 'background.paper',
          touchAction: disabled ? 'auto' : 'pan-y',
        }}
        onTouchStart={(e) => {
          if (disabled) return;
          touchStartX.current = e.touches[0]?.clientX ?? 0;
          dragging.current = true;
        }}
        onTouchMove={(e) => {
          if (disabled || !dragging.current) return;
          const dx = (e.touches[0]?.clientX ?? 0) - touchStartX.current;
          if (dx < -4 || offsetX < 0) {
            setOffsetX(clampOffset(dx));
          }
        }}
        onTouchEnd={() => {
          dragging.current = false;
          setOffsetX((prev) => (prev <= -OPEN_THRESHOLD_PX ? -REVEAL_PX : 0));
        }}
        onTouchCancel={() => {
          dragging.current = false;
          setOffsetX(0);
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

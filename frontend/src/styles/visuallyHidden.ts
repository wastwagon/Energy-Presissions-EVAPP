import type { SxProps, Theme } from '@mui/material';

/** Screen-reader-only text (WCAG technique: visually hidden, still available to AT). */
export const visuallyHiddenSx: SxProps<Theme> = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

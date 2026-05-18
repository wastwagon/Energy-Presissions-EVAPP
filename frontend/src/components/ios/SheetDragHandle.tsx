import { Box } from '@mui/material';

/** iOS-style grab handle for bottom sheets and map panels. */
export function SheetDragHandle() {
  return (
    <Box
      sx={{
        width: 36,
        height: 5,
        borderRadius: 3,
        bgcolor: 'rgba(60, 60, 67, 0.3)',
        mx: 'auto',
        mt: 1.25,
        mb: 0.75,
        flexShrink: 0,
      }}
      aria-hidden
    />
  );
}

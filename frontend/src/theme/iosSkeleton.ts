import type { Theme } from '@mui/material/styles';
import type { SystemStyleObject } from '@mui/system';

/** MUI Skeleton surfaces that read well on light and dark page backgrounds. */
export const iosSkeletonSx: SystemStyleObject<Theme> = {
  bgcolor: (theme) =>
    theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.06)',
  '&::after': {
    background: (theme) =>
      theme.palette.mode === 'dark'
        ? 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.06), transparent)'
        : undefined,
  },
};

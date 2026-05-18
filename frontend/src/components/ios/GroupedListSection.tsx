import { ReactNode } from 'react';
import { Box, Paper, List, Typography, SxProps, Theme } from '@mui/material';
import {
  iosGroupedPaperSx,
  iosGroupedSectionHeaderSx,
} from '../../theme/iosGroupedList';

interface GroupedListSectionProps {
  title?: string;
  footer?: ReactNode;
  children: ReactNode;
  sx?: SxProps<Theme>;
  /** Extra sx on the inner Paper */
  paperSx?: SxProps<Theme>;
}

export function GroupedListSection({ title, footer, children, sx, paperSx }: GroupedListSectionProps) {
  return (
    <Box component="section" sx={{ mb: 2.5, ...sx }}>
      {title ? (
        <Typography component="h2" variant="caption" sx={iosGroupedSectionHeaderSx}>
          {title}
        </Typography>
      ) : null}
      <Paper elevation={0} sx={{ ...iosGroupedPaperSx, ...paperSx }}>
        <List disablePadding>{children}</List>
      </Paper>
      {footer}
    </Box>
  );
}

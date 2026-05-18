import { ReactNode } from 'react';
import { ListItem, ListItemText, Divider, Box } from '@mui/material';
import { iosGroupedListRowSx, iosGroupedRowDividerSx } from '../../theme/iosGroupedList';

interface GroupedDetailRowProps {
  label: string;
  value: ReactNode;
  divider?: boolean;
}

/** Read-only label/value row inside a grouped list (Settings-style). */
export function GroupedDetailRow({ label, value, divider = false }: GroupedDetailRowProps) {
  return (
    <>
      <ListItem sx={iosGroupedListRowSx} disablePadding>
        <ListItemText
          primary={label}
          primaryTypographyProps={{
            fontSize: '0.8125rem',
            color: 'text.secondary',
            fontWeight: 400,
          }}
        />
        <Box sx={{ textAlign: 'right', maxWidth: '58%', flexShrink: 0, ml: 1 }}>{value}</Box>
      </ListItem>
      {divider ? <Divider sx={iosGroupedRowDividerSx} /> : null}
    </>
  );
}

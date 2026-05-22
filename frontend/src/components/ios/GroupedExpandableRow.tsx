import { ReactNode, useId, useState } from 'react';
import {
  Box,
  Collapse,
  Divider,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { iosGroupedListRowSx, iosGroupedRowDividerSx } from '../../theme/iosGroupedList';
import { authPageBodySx } from '../../styles/authShell';
import { iosMotion } from '../../theme/iosMobileTokens';
import { triggerHaptic } from '../../utils/haptics';
import { usePrefersReducedMotion } from '../../utils/motionPreference';

interface GroupedExpandableRowProps {
  /** Question / row title */
  primary: ReactNode;
  /** Answer body */
  children: ReactNode;
  divider?: boolean;
  defaultExpanded?: boolean;
}

/**
 * iOS Settings–style FAQ row: tap to expand in place (no MUI Accordion chrome).
 */
export function GroupedExpandableRow({
  primary,
  children,
  divider = false,
  defaultExpanded = false,
}: GroupedExpandableRowProps) {
  const [open, setOpen] = useState(defaultExpanded);
  const contentId = useId();
  const reducedMotion = usePrefersReducedMotion();

  const toggle = () => {
    triggerHaptic('light');
    setOpen((v) => !v);
  };

  return (
    <>
      <ListItemButton
        onClick={toggle}
        aria-expanded={open}
        aria-controls={contentId}
        sx={{
          ...iosGroupedListRowSx,
          pr: 1.5,
        }}
      >
        <ListItemText
          primary={primary}
          primaryTypographyProps={{
            fontWeight: 500,
            fontSize: '1rem',
            letterSpacing: '-0.01em',
          }}
        />
        <ExpandMoreIcon
          aria-hidden
          sx={{
            color: 'text.disabled',
            fontSize: 22,
            flexShrink: 0,
            transition: reducedMotion ? 'none' : `transform ${iosMotion.standard}ms ease`,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </ListItemButton>
      <Collapse
        in={open}
        timeout={reducedMotion ? 0 : iosMotion.standard}
        id={contentId}
        unmountOnExit={false}
      >
        <Box sx={{ px: 2, pt: 0, pb: 2 }}>
          {typeof children === 'string' ? (
            <Typography component="p" sx={authPageBodySx}>
              {children}
            </Typography>
          ) : (
            children
          )}
        </Box>
      </Collapse>
      {divider ? <Divider sx={iosGroupedRowDividerSx} /> : null}
    </>
  );
}

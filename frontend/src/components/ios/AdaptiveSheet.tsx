import { ReactNode } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  SwipeableDrawer,
  Drawer,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  type DialogProps,
} from '@mui/material';
import { premiumDialogPaperSx, sheetTitleTypographySx, sxObject } from '../../styles/authShell';
import { iosMotion, iosRadii, iosSheetBlurBg } from '../../theme/iosMobileTokens';
import { usePrefersReducedMotion } from '../../utils/motionPreference';
import { SheetDragHandle } from './SheetDragHandle';

interface AdaptiveSheetProps {
  open: boolean;
  onClose: () => void;
  /** Plain-text title (sheet + dialog). Ignored when `header` is set. */
  title: string;
  /** Custom header (e.g. icon + subtitle) — mobile sheet + desktop dialog title area */
  header?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  maxWidth?: DialogProps['maxWidth'];
  disableClose?: boolean;
  /** Taller sheet for forms (start charging, etc.) */
  tall?: boolean;
  /** Extra sx on scrollable content region */
  contentSx?: object;
}

const sheetPaperSx = (tall: boolean) => ({
  borderTopLeftRadius: iosRadii.lg,
  borderTopRightRadius: iosRadii.lg,
  background: iosSheetBlurBg('light'),
  backdropFilter: 'saturate(180%) blur(20px)',
  WebkitBackdropFilter: 'saturate(180%) blur(20px)',
  pb: 'max(env(safe-area-inset-bottom, 0px), 12px)',
  maxHeight: tall ? 'min(94dvh, 800px)' : 'min(92dvh, 720px)',
  display: 'flex',
  flexDirection: 'column',
});

/**
 * Centered dialog on md+; bottom sheet with grab handle on xs/sm (iOS action-sheet pattern).
 * Uses a non-swipe Drawer when prefers-reduced-motion is set.
 */
export function AdaptiveSheet({
  open,
  onClose,
  title,
  header,
  children,
  actions,
  maxWidth = 'sm',
  disableClose = false,
  tall = false,
  contentSx,
}: AdaptiveSheetProps) {
  const theme = useTheme();
  const isMobileSheet = useMediaQuery(theme.breakpoints.down('md'));
  const reducedMotion = usePrefersReducedMotion();
  const sheetModalProps = {
    keepMounted: false,
    disableScrollLock: false,
    sx: { zIndex: theme.zIndex.modal },
  };

  const titleNode = header ?? (
    <Typography component="h2" sx={sheetTitleTypographySx}>
      {title}
    </Typography>
  );

  if (isMobileSheet) {
    const paperProps = { sx: sheetPaperSx(tall) };
    const sheetBody = (
      <>
        <SheetDragHandle />
        <Box sx={{ px: 2.5, pt: 1, pb: 1.5, flexShrink: 0 }}>{titleNode}</Box>
        <Box
          sx={{
            px: 2.5,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            flex: 1,
            minHeight: 0,
            ...contentSx,
          }}
        >
          {children}
        </Box>
        {actions ? (
          <Box
            sx={{
              px: 2.5,
              pt: 2,
              pb: 1,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              '& .MuiButton-root': { width: '100%' },
            }}
          >
            {actions}
          </Box>
        ) : null}
      </>
    );

    if (reducedMotion) {
      return (
        <Drawer
          anchor="bottom"
          open={open}
          onClose={disableClose ? undefined : onClose}
          ModalProps={sheetModalProps}
          PaperProps={paperProps}
          transitionDuration={0}
        >
          {sheetBody}
        </Drawer>
      );
    }

    return (
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={disableClose ? () => {} : onClose}
        onOpen={() => {}}
        disableSwipeToOpen
        disableDiscovery
        ModalProps={sheetModalProps}
        transitionDuration={{ enter: iosMotion.standard, exit: iosMotion.fast }}
        PaperProps={paperProps}
      >
        {sheetBody}
      </SwipeableDrawer>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={disableClose ? undefined : onClose}
      maxWidth={maxWidth}
      fullWidth
      PaperProps={{
        sx: (th) => ({
          ...sxObject(th, premiumDialogPaperSx),
          ...(tall ? { maxHeight: '90vh' } : {}),
        }),
      }}
    >
      <DialogTitle
        sx={(th) => ({
          ...sxObject(th, sheetTitleTypographySx),
          pb: header ? 1 : undefined,
        })}
      >
        {header ?? title}
      </DialogTitle>
      <DialogContent sx={contentSx}>{children}</DialogContent>
      {actions ? <DialogActions sx={{ px: 3, pb: 2, pt: 1, flexWrap: 'wrap', gap: 1 }}>{actions}</DialogActions> : null}
    </Dialog>
  );
}

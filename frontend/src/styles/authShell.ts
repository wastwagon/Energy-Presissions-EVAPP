import type { SxProps, Theme } from '@mui/material/styles';

/** Shared light shell for all auth pages (mobile-first). */
export const authPageRootSx: SxProps<Theme> = {
  minHeight: '100dvh',
  display: 'flex',
  alignItems: { xs: 'flex-start', sm: 'center' },
  justifyContent: 'center',
  bgcolor: 'background.default',
  px: { xs: 2, sm: 3 },
  pt: { xs: 'max(env(safe-area-inset-top), 16px)', sm: 'max(env(safe-area-inset-top), 24px)' },
  pb: 'max(env(safe-area-inset-bottom), 16px)',
};

export const authPagePaperSx: SxProps<Theme> = {
  p: { xs: 2, sm: 2.5 },
  borderRadius: 2,
  bgcolor: 'background.paper',
  border: '1px solid',
  borderColor: 'divider',
  boxShadow: (theme) =>
    theme.palette.mode === 'light'
      ? '0 1px 2px rgba(15, 23, 42, 0.05), 0 4px 20px rgba(15, 23, 42, 0.06)'
      : undefined,
};

export const authPageTitleSx: SxProps<Theme> = {
  fontWeight: 700,
  color: 'text.primary',
  mb: 1.5,
  textAlign: 'center',
  letterSpacing: '0.01em',
};

import type { SxProps, Theme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

/** Turn SxProps into a plain object for spreading (MUI SxProps can be an array; spreading that breaks TS). */
export function sxObject(theme: Theme, sx: SxProps<Theme>): Record<string, unknown> {
  const v = typeof sx === 'function' ? sx(theme) : sx;
  if (v == null || typeof v !== 'object' || Array.isArray(v)) return {};
  return { ...(v as Record<string, unknown>) };
}

/** Shared light shell for all auth pages (mobile-first). */
export const authPageRootSx: SxProps<Theme> = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  bgcolor: 'background.default',
  px: { xs: 2, sm: 3 },
  py: { xs: 'max(env(safe-area-inset-top), env(safe-area-inset-bottom), 12px)', sm: 3 },
  boxSizing: 'border-box',
  '@supports (min-height: 100dvh)': {
    minHeight: '100dvh',
  },
};

export const authPagePaperSx: SxProps<Theme> = {
  p: { xs: 1.75, sm: 2.75 },
  borderRadius: 3,
  width: '100%',
  maxWidth: { xs: 400, sm: 440 },
  mx: 'auto',
  bgcolor: 'background.paper',
  border: '1px solid',
  borderColor: (theme) => alpha(theme.palette.text.primary, 0.07),
  boxShadow: (theme) =>
    theme.palette.mode === 'light'
      ? '0 1px 0 rgba(15, 23, 42, 0.04), 0 8px 28px rgba(15, 23, 42, 0.08), 0 24px 48px rgba(15, 23, 42, 0.06)'
      : undefined,
};

/** Modal / dialog shell — matches auth card elevation language. */
export const premiumDialogPaperSx: SxProps<Theme> = (theme) => ({
  borderRadius: 3,
  border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
  boxShadow:
    theme.palette.mode === 'light'
      ? '0 24px 56px rgba(15, 23, 42, 0.14), 0 8px 20px rgba(15, 23, 42, 0.08)'
      : undefined,
  overflow: 'hidden',
});

/** App bar account menu — matches premium dialog border + shadow. */
export const premiumMenuPaperSx: SxProps<Theme> = (theme) => ({
  mt: 1.5,
  minWidth: 200,
  borderRadius: 2,
  border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
  boxShadow:
    theme.palette.mode === 'light'
      ? '0 24px 56px rgba(15, 23, 42, 0.14), 0 8px 20px rgba(15, 23, 42, 0.08)'
      : undefined,
  overflow: 'hidden',
});

/** Minimum 44×44 tap target for IconButtons (mobile-first). */
export const premiumIconButtonTouchSx: SxProps<Theme> = {
  minWidth: 44,
  minHeight: 44,
};

export const authPageTitleSx: SxProps<Theme> = {
  fontWeight: 700,
  color: 'text.primary',
  mb: { xs: 1, sm: 1.125 },
  textAlign: 'left',
  letterSpacing: '-0.02em',
  fontSize: { xs: '1.0625rem', sm: '1.125rem' },
  lineHeight: 1.3,
};

/** Compact outlined fields: tighter helper text, soft borders, focus ring. */
export const authFormFieldSx: SxProps<Theme> = (theme) => ({
  mt: 0.25,
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    transition: 'box-shadow 0.18s ease, background-color 0.18s ease',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: alpha(theme.palette.text.primary, 0.11),
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: alpha(theme.palette.primary.main, 0.38),
    },
    '&.Mui-focused': {
      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.12)}`,
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.primary.main,
      borderWidth: 1,
    },
  },
  '& .MuiInputLabel-root': {
    fontSize: '0.8125rem',
  },
  '& .MuiOutlinedInput-input': {
    py: 0.875,
    fontSize: '0.875rem',
  },
  '& .MuiFormHelperText-root': {
    mt: 0.5,
    mx: 0,
    fontSize: '0.6875rem',
    lineHeight: 1.35,
    letterSpacing: '0.01em',
  },
});

/** Compact premium outlined CTA (cards, station rows) — 44px touch, clean border, no elevation. */
export const compactOutlinedCtaSx: SxProps<Theme> = (theme) => ({
  py: 1,
  px: 2,
  minHeight: 44,
  borderRadius: 2,
  fontWeight: 600,
  fontSize: '0.875rem',
  letterSpacing: '-0.01em',
  textTransform: 'none',
  boxShadow: 'none',
  borderWidth: 1,
  borderColor: alpha(theme.palette.primary.main, 0.4),
  color: theme.palette.primary.main,
  lineHeight: 1.2,
  '& .MuiButton-startIcon': {
    marginRight: '6px',
    marginLeft: '-2px',
    '& .MuiSvgIcon-root': { fontSize: 18 },
  },
  '&:hover': {
    borderWidth: 1,
    borderColor: theme.palette.primary.main,
    bgcolor: alpha(theme.palette.primary.main, 0.06),
    boxShadow: 'none',
  },
  '&:disabled': {
    borderColor: alpha(theme.palette.text.primary, 0.12),
    color: theme.palette.text.disabled,
  },
});

/** Compact premium contained primary CTA — flat default, soft glow on hover (pairs with `disableElevation`). */
export const compactContainedCtaSx: SxProps<Theme> = (theme) => ({
  py: 1,
  px: 2,
  minHeight: 44,
  borderRadius: 2,
  fontWeight: 600,
  fontSize: '0.875rem',
  letterSpacing: '-0.01em',
  textTransform: 'none',
  boxShadow: 'none',
  lineHeight: 1.2,
  bgcolor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  '& .MuiButton-startIcon': {
    marginRight: '6px',
    marginLeft: '-2px',
    '& .MuiSvgIcon-root': { fontSize: 18 },
  },
  '&:hover': {
    bgcolor: theme.palette.primary.dark,
    boxShadow:
      theme.palette.mode === 'light'
        ? `0 4px 14px ${alpha(theme.palette.primary.main, 0.28)}`
        : undefined,
  },
  '&:disabled': {
    bgcolor: alpha(theme.palette.text.primary, 0.08),
    color: theme.palette.text.disabled,
  },
});

/** Contained CTA — error palette (destructive confirms). */
export const compactErrorContainedCtaSx: SxProps<Theme> = (theme) => ({
  ...sxObject(theme, compactContainedCtaSx),
  bgcolor: theme.palette.error.main,
  color: theme.palette.error.contrastText,
  '&:hover': {
    bgcolor: theme.palette.error.dark,
    boxShadow:
      theme.palette.mode === 'light'
        ? `0 4px 14px ${alpha(theme.palette.error.main, 0.28)}`
        : undefined,
  },
});

/** Contained CTA — warning palette (e.g. leave impersonation). */
export const compactWarningContainedCtaSx: SxProps<Theme> = (theme) => ({
  ...sxObject(theme, compactContainedCtaSx),
  bgcolor: theme.palette.warning.main,
  color: theme.palette.warning.contrastText,
  '&:hover': {
    bgcolor: theme.palette.warning.dark,
    boxShadow:
      theme.palette.mode === 'light'
        ? `0 4px 14px ${alpha(theme.palette.warning.main, 0.32)}`
        : undefined,
  },
});

/** Contained CTA — success palette (e.g. confirm cash received). */
export const compactSuccessContainedCtaSx: SxProps<Theme> = (theme) => ({
  ...sxObject(theme, compactContainedCtaSx),
  bgcolor: theme.palette.success.main,
  color: theme.palette.success.contrastText,
  '&:hover': {
    bgcolor: theme.palette.success.dark,
    boxShadow:
      theme.palette.mode === 'light'
        ? `0 4px 14px ${alpha(theme.palette.success.main, 0.28)}`
        : undefined,
  },
});

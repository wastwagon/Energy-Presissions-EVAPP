import { createTheme, alpha } from '@mui/material/styles';
import { iosBrandColors, iosFontStacks, iosRadii, iosMotion } from './iosMobileTokens';

export type AppThemeOptions = {
  /** SF-only typography on customer shell. */
  customerTypography?: boolean;
};

const shadows = [
  'none',
  '0 1px 2px rgba(15, 23, 42, 0.04)',
  '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
  '0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)',
  '0 10px 15px -3px rgba(15, 23, 42, 0.07), 0 4px 6px -4px rgba(15, 23, 42, 0.04)',
  '0 20px 25px -5px rgba(15, 23, 42, 0.07), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
  '0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.05)',
  '0 20px 25px -5px rgba(15, 23, 42, 0.09), 0 8px 10px -6px rgba(15, 23, 42, 0.05)',
  '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.06)',
  '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.06)',
  '0 20px 25px -5px rgba(15, 23, 42, 0.11), 0 8px 10px -6px rgba(15, 23, 42, 0.06)',
  '0 20px 25px -5px rgba(15, 23, 42, 0.11), 0 8px 10px -6px rgba(15, 23, 42, 0.07)',
  '0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.07)',
  '0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.07)',
  '0 20px 25px -5px rgba(15, 23, 42, 0.13), 0 8px 10px -6px rgba(15, 23, 42, 0.08)',
  '0 20px 25px -5px rgba(15, 23, 42, 0.13), 0 8px 10px -6px rgba(15, 23, 42, 0.08)',
  '0 20px 25px -5px rgba(15, 23, 42, 0.14), 0 8px 10px -6px rgba(15, 23, 42, 0.08)',
  '0 20px 25px -5px rgba(15, 23, 42, 0.14), 0 8px 10px -6px rgba(15, 23, 42, 0.09)',
  '0 20px 25px -5px rgba(15, 23, 42, 0.15), 0 8px 10px -6px rgba(15, 23, 42, 0.09)',
  '0 20px 25px -5px rgba(15, 23, 42, 0.15), 0 8px 10px -6px rgba(15, 23, 42, 0.09)',
  '0 20px 25px -5px rgba(15, 23, 42, 0.16), 0 8px 10px -6px rgba(15, 23, 42, 0.1)',
  '0 20px 25px -5px rgba(15, 23, 42, 0.16), 0 8px 10px -6px rgba(15, 23, 42, 0.1)',
  '0 20px 25px -5px rgba(15, 23, 42, 0.17), 0 8px 10px -6px rgba(15, 23, 42, 0.1)',
  '0 20px 25px -5px rgba(15, 23, 42, 0.18), 0 8px 10px -6px rgba(15, 23, 42, 0.11)',
  '0 20px 25px -5px rgba(15, 23, 42, 0.19), 0 8px 10px -6px rgba(15, 23, 42, 0.11)',
] as const;

/** App theme — light mode only. */
export function createAppTheme(options: AppThemeOptions = {}) {
  const fontStackDisplay = options.customerTypography ? iosFontStacks.ui : iosFontStacks.display;
  const fontStackBody = iosFontStacks.ui;

  return createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: iosBrandColors.primary,
        light: '#14919e',
        dark: iosBrandColors.primaryDark,
        contrastText: '#ffffff',
      },
      secondary: {
        main: iosBrandColors.secondary,
        light: '#18a7b5',
        dark: '#0d5c66',
        contrastText: '#ffffff',
      },
      background: { default: iosBrandColors.background, paper: iosBrandColors.paper },
      text: { primary: '#0f172a', secondary: '#64748b' },
      divider: alpha('#0f172a', 0.08),
      success: { main: '#0d9488', dark: '#0f766e', contrastText: '#fff' },
      info: { main: '#0284c7', dark: '#0369a1', contrastText: '#fff' },
      error: { main: '#dc2626', dark: '#b91c1c', contrastText: '#fff' },
      warning: { main: '#d97706', dark: '#b45309', contrastText: '#fff' },
    },
    shape: { borderRadius: iosRadii.md },
    typography: {
      fontFamily: fontStackBody,
      fontSize: 16,
      htmlFontSize: 16,
      h1: { fontFamily: fontStackDisplay, fontWeight: 700, letterSpacing: '-0.03em' },
      h2: { fontFamily: fontStackDisplay, fontWeight: 700, letterSpacing: '-0.03em' },
      h3: { fontFamily: fontStackDisplay, fontWeight: 700, letterSpacing: '-0.02em' },
      h4: { fontFamily: fontStackDisplay, fontWeight: 700, letterSpacing: '-0.02em' },
      h5: { fontFamily: fontStackDisplay, fontWeight: 600, letterSpacing: '-0.02em' },
      h6: { fontFamily: fontStackDisplay, fontWeight: 600, letterSpacing: '-0.01em' },
      subtitle1: { fontWeight: 600, letterSpacing: '-0.01em' },
      subtitle2: { fontWeight: 600 },
      body1: { letterSpacing: '-0.01em' },
      body2: { letterSpacing: '-0.005em' },
      button: { fontWeight: 600, letterSpacing: '0.02em', textTransform: 'none' },
    },
    shadows: [...shadows],
    components: {
      MuiCssBaseline: {
        styleOverrides: (theme) => ({
          html: {
            height: '100%',
            maxHeight: '100%',
            overflow: 'hidden',
            overscrollBehavior: 'none',
            backgroundColor: theme.palette.background.default,
            colorScheme: 'light',
            '@supports (height: 100svh)': {
              height: '100svh',
              maxHeight: '100svh',
            },
          },
          body: {
            height: '100%',
            maxHeight: '100%',
            overflow: 'hidden',
            overscrollBehavior: 'none',
            backgroundColor: theme.palette.background.default,
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            WebkitTapHighlightColor: 'transparent',
            '@supports (height: 100svh)': {
              height: '100svh',
              maxHeight: '100svh',
            },
          },
          'button, a, [role="button"]': {
            WebkitTouchCallout: 'none',
          },
          '#root': {
            height: '100%',
            maxHeight: '100%',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: theme.palette.background.default,
            '@supports (height: 100svh)': {
              height: '100svh',
              maxHeight: '100svh',
            },
          },
          '@media (prefers-reduced-motion: reduce)': {
            '*, *::before, *::after': {
              animationDuration: '0.01ms !important',
              animationIterationCount: '1 !important',
              transitionDuration: '0.01ms !important',
            },
          },
        }),
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
          elevation1: {
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(15, 23, 42, 0.08)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: iosRadii.md,
            border: `1px solid`,
            borderColor: alpha('#0f172a', 0.06),
            boxShadow: 'none',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: iosRadii.sm,
            transitionDuration: `${iosMotion.fast}ms`,
            minHeight: 44,
            '@media (min-width:600px)': { minHeight: 40 },
            boxShadow: 'none',
            '&:focus-visible': {
              outline: `2px solid ${iosBrandColors.primary}`,
              outlineOffset: 2,
            },
          },
          contained: {
            boxShadow: 'none',
            '&:hover': { boxShadow: '0 2px 8px rgba(12, 74, 110, 0.25)' },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { minHeight: 28 },
          sizeSmall: { minHeight: 24, '& .MuiChip-label': { px: 1 } },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            minWidth: 44,
            minHeight: 44,
            transitionDuration: `${iosMotion.fast}ms`,
            padding: 10,
            borderRadius: 10,
            '&:focus-visible': {
              outline: `2px solid ${iosBrandColors.primary}`,
              outlineOffset: 2,
            },
          },
        },
      },
      MuiSkeleton: {
        styleOverrides: {
          root: {
            bgcolor: 'rgba(15, 23, 42, 0.06)',
          },
        },
      },
      MuiAppBar: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiTableCell: {
        styleOverrides: {
          root: { fontVariantNumeric: 'tabular-nums' },
        },
      },
      MuiTextField: { defaultProps: { variant: 'outlined' } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { borderRadius: iosRadii.sm },
          input: {
            fontSize: '1rem',
            '@media (min-width:600px)': { fontSize: '0.875rem' },
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          h1: {
            fontSize: '1.875rem',
            lineHeight: 1.2,
            '@media (min-width:600px)': { fontSize: '2.5rem' },
            '@media (min-width:900px)': { fontSize: '3rem' },
          },
          h2: {
            fontSize: '1.625rem',
            lineHeight: 1.25,
            '@media (min-width:600px)': { fontSize: '2.125rem' },
            '@media (min-width:900px)': { fontSize: '2.5rem' },
          },
          h3: {
            fontSize: '1.5rem',
            '@media (min-width:600px)': { fontSize: '1.75rem' },
            '@media (min-width:900px)': { fontSize: '2rem' },
          },
          h4: {
            fontSize: '1.375rem',
            '@media (min-width:600px)': { fontSize: '1.625rem' },
            '@media (min-width:900px)': { fontSize: '1.875rem' },
          },
          h5: {
            fontSize: '1.125rem',
            '@media (min-width:600px)': { fontSize: '1.25rem' },
          },
          h6: {
            fontSize: '1rem',
            '@media (min-width:600px)': { fontSize: '1.125rem' },
          },
        },
      },
    },
  });
}

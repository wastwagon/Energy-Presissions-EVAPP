import { createTheme, alpha } from '@mui/material/styles';

/** Brand accent — refined teal, nudged toward Jampack #007d88 for harmony with template shell */
export const brandColors = {
  primary: '#0a6570',
  secondary: '#127a87',
  background: '#f4f7f9',
  paper: '#ffffff',
  primaryDark: '#074854',
} as const;

const fontStack = '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: brandColors.primary,
      light: '#14919e',
      dark: brandColors.primaryDark,
      contrastText: '#ffffff',
    },
    secondary: {
      main: brandColors.secondary,
      light: '#18a7b5',
      dark: '#0d5c66',
      contrastText: '#ffffff',
    },
    background: {
      default: brandColors.background,
      paper: brandColors.paper,
    },
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
    },
    divider: alpha('#0f172a', 0.08),
    success: { main: '#0d9488', dark: '#0f766e', contrastText: '#fff' },
    info: { main: '#0284c7', dark: '#0369a1', contrastText: '#fff' },
    error: { main: '#dc2626', dark: '#b91c1c', contrastText: '#fff' },
    warning: { main: '#d97706', dark: '#b45309', contrastText: '#fff' },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: fontStack,
    h1: { fontWeight: 700, letterSpacing: '-0.03em' },
    h2: { fontWeight: 700, letterSpacing: '-0.03em' },
    h3: { fontWeight: 700, letterSpacing: '-0.02em' },
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 600, letterSpacing: '-0.02em' },
    h6: { fontWeight: 600, letterSpacing: '-0.01em' },
    subtitle1: { fontWeight: 600, letterSpacing: '-0.01em' },
    subtitle2: { fontWeight: 600 },
    body1: { letterSpacing: '-0.01em' },
    body2: { letterSpacing: '-0.005em' },
    button: { fontWeight: 600, letterSpacing: '0.02em', textTransform: 'none' },
  },
  shadows: [
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
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          minHeight: '100dvh',
          backgroundColor: brandColors.background,
        },
        body: {
          minHeight: '100dvh',
          backgroundColor: brandColors.background,
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        '#root': {
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: brandColors.background,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(15, 23, 42, 0.08)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: `1px solid ${alpha('#0f172a', 0.06)}`,
          boxShadow: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          minHeight: 44,
          '@media (min-width:600px)': { minHeight: 40 },
          boxShadow: 'none',
          '&:focus-visible': {
            outline: `2px solid ${brandColors.primary}`,
            outlineOffset: 2,
          },
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(12, 74, 110, 0.25)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: 44,
          minHeight: 44,
          padding: 10,
          borderRadius: 10,
          '&:focus-visible': {
            outline: `2px solid ${brandColors.primary}`,
            outlineOffset: 2,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
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

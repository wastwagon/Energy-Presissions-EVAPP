import { createTheme } from '@mui/material/styles';

/** Clean Motion Ghana brand palette (logo colors) */
export const brandColors = {
  primary: '#0A3D62',    // Deep teal/blue - logo symbol & CleanMotion text
  secondary: '#1A5F7A',  // Lighter teal - Ghana text, contrast
  background: '#FFFFFF',  // Pure white
  primaryDark: '#062540', // Darker teal for SuperAdmin hierarchy
} as const;

export const theme = createTheme({
  palette: {
    primary: {
      main: brandColors.primary,
      light: '#0d5a8a',
      dark: brandColors.primaryDark,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: brandColors.secondary,
      light: '#2584a8',
      dark: '#124560',
      contrastText: '#FFFFFF',
    },
    background: {
      default: brandColors.background,
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h3: { fontSize: '1.75rem' },
    h4: { fontSize: '1.5rem' },
  },
  components: {
    MuiTypography: {
      styleOverrides: {
        h3: {
          fontSize: '1.5rem',
          '@media (min-width:600px)': { fontSize: '1.75rem' },
          '@media (min-width:900px)': { fontSize: '2rem' },
        },
        h4: {
          fontSize: '1.5rem',
          '@media (min-width:600px)': { fontSize: '1.75rem' },
          '@media (min-width:900px)': { fontSize: '2rem' },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 44,
          '@media (min-width:600px)': { minHeight: 36 },
          '&:focus-visible': {
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: 2,
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
          '&:focus-visible': {
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: 2,
          },
        },
      },
    },
  },
});




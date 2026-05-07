import { Link } from '@mui/material';
import { APP_MAIN_CONTENT_ID } from '../constants/a11y';

/**
 * WCAG-friendly skip link: off-screen until keyboard focus, then jumps to `#app-main-content`.
 * Pair the target landmark with `id={APP_MAIN_CONTENT_ID}` and `tabIndex={-1}`.
 */
export function SkipToMain() {
  return (
    <Link
      href={`#${APP_MAIN_CONTENT_ID}`}
      underline="none"
      sx={{
        position: 'fixed',
        top: -48,
        left: 8,
        zIndex: (theme) => theme.zIndex.snackbar + 1,
        px: 2,
        py: 1,
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        borderRadius: 1,
        fontWeight: 600,
        fontSize: '0.875rem',
        boxShadow: 2,
        transition: 'top 0.15s ease-out',
        '&:focus': {
          top: 8,
          outline: '2px solid',
          outlineColor: 'background.paper',
          outlineOffset: 2,
        },
      }}
    >
      Skip to main content
    </Link>
  );
}

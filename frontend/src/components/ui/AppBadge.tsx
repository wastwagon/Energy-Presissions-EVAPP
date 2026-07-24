import { Chip, type ChipProps } from '@mui/material';
import { alpha, type Theme } from '@mui/material/styles';
import type { SxProps } from '@mui/material/styles';
import { iosRadii } from '../../theme/iosMobileTokens';
import { sxObject } from '../../styles/authShell';

export type AppBadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'error' | 'info';

export type AppBadgeProps = Omit<ChipProps, 'color' | 'variant'> & {
  /** Soft semantic tone (Untitled UI–style pills). Default: neutral. */
  tone?: AppBadgeTone;
};

function tonePalette(theme: Theme, tone: AppBadgeTone) {
  switch (tone) {
    case 'brand':
      return theme.palette.primary;
    case 'success':
      return theme.palette.success;
    case 'warning':
      return theme.palette.warning;
    case 'error':
      return theme.palette.error;
    case 'info':
      return theme.palette.info;
    case 'neutral':
    default:
      return {
        main: theme.palette.text.secondary,
        dark: theme.palette.text.primary,
        contrastText: theme.palette.text.primary,
      };
  }
}

/** Soft filled badge sx — keep brand teal via `tone="brand"`. */
export function softBadgeSx(tone: AppBadgeTone = 'neutral'): SxProps<Theme> {
  return (theme) => {
    const p = tonePalette(theme, tone);
    const isNeutral = tone === 'neutral';
    return {
      height: 24,
      maxWidth: '100%',
      borderRadius: `${iosRadii.sm}px`,
      fontWeight: 600,
      fontSize: '0.7rem',
      letterSpacing: '-0.01em',
      bgcolor: isNeutral ? alpha(theme.palette.text.primary, 0.06) : alpha(p.main, 0.12),
      color: isNeutral ? theme.palette.text.secondary : p.dark,
      border: '1px solid',
      borderColor: isNeutral ? alpha(theme.palette.text.primary, 0.08) : alpha(p.main, 0.22),
      '& .MuiChip-label': { px: 1 },
      '& .MuiChip-icon': { color: 'inherit', ml: 0.5 },
    };
  };
}

/** Map legacy MUI Chip color helpers → soft badge tones. */
export function chipColorToBadgeTone(
  color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning',
): AppBadgeTone {
  switch (color) {
    case 'primary':
    case 'secondary':
      return 'brand';
    case 'success':
      return 'success';
    case 'warning':
      return 'warning';
    case 'error':
      return 'error';
    case 'info':
      return 'info';
    default:
      return 'neutral';
  }
}

/**
 * Soft status pill — replaces default MUI filled chips for a premium, brand-safe look.
 */
export function AppBadge({ tone = 'neutral', sx, size = 'small', ...rest }: AppBadgeProps) {
  return (
    <Chip
      size={size}
      variant="filled"
      sx={(theme) => ({
        ...sxObject(theme, softBadgeSx(tone)),
        ...(sx ? sxObject(theme, sx) : {}),
      })}
      {...rest}
    />
  );
}

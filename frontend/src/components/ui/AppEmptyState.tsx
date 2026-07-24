import type { ReactNode } from 'react';
import { Box, Button, Paper, Typography, type SxProps, type Theme } from '@mui/material';
import { iosRadii } from '../../theme/iosMobileTokens';
import { premiumEmptyStatePaperSx } from '../../theme/jampackShell';
import { compactContainedCtaSx, compactOutlinedCtaSx, sxObject } from '../../styles/authShell';

export type AppEmptyStateAction = {
  label: string;
  onClick: () => void;
  /** Default: primary contained. Use secondary for outline. */
  variant?: 'primary' | 'secondary';
  startIcon?: ReactNode;
};

export type AppEmptyStateProps = {
  icon?: ReactNode;
  /** Optional photographic / illustrated asset (preferred over icon when set). */
  illustrationSrc?: string;
  illustrationAlt?: string;
  title: string;
  description?: ReactNode;
  /** Optional footnote under the description (e.g. operator hints). */
  footnote?: ReactNode;
  primaryAction?: AppEmptyStateAction;
  secondaryAction?: AppEmptyStateAction;
  sx?: SxProps<Theme>;
};

/**
 * Shared empty state — Untitled UI–style title / body / CTA, brand teal CTAs.
 * Use on customer lists and staff tables for consistent “finished product” empties.
 */
export function AppEmptyState({
  icon,
  illustrationSrc,
  illustrationAlt = '',
  title,
  description,
  footnote,
  primaryAction,
  secondaryAction,
  sx,
}: AppEmptyStateProps) {
  const actions = [primaryAction, secondaryAction].filter(Boolean) as AppEmptyStateAction[];

  return (
    <Paper
      elevation={0}
      role="status"
      aria-live="polite"
      sx={[premiumEmptyStatePaperSx, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
    >
      {illustrationSrc ? (
        <Box
          component="img"
          src={illustrationSrc}
          alt={illustrationAlt}
          loading="lazy"
          decoding="async"
          sx={{
            width: { xs: 140, sm: 168 },
            height: { xs: 140, sm: 168 },
            objectFit: 'cover',
            borderRadius: `${iosRadii.md}px`,
            mx: 'auto',
            mb: 2,
            display: 'block',
          }}
        />
      ) : icon ? (
        <Box
          sx={(theme) => ({
            width: 72,
            height: 72,
            mx: 'auto',
            mb: 2,
            borderRadius: `${iosRadii.md}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: theme.palette.action.hover,
            color: 'text.secondary',
            '& .MuiSvgIcon-root': { fontSize: 36 },
          })}
        >
          {icon}
        </Box>
      ) : null}
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: description || footnote || actions.length ? 0.5 : 0 }}>
        {title}
      </Typography>
      {description ? (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mx: 'auto' }}>
          {description}
        </Typography>
      ) : null}
      {footnote ? (
        <Typography
          variant="caption"
          color="text.secondary"
          component="div"
          sx={{ display: 'block', mt: 1.5, lineHeight: 1.5, maxWidth: 480, mx: 'auto' }}
        >
          {footnote}
        </Typography>
      ) : null}
      {actions.length > 0 ? (
        <Box
          sx={{
            mt: 3,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1.5,
            justifyContent: 'center',
            alignItems: 'stretch',
          }}
        >
          {actions.map((action) => {
            const isPrimary = (action.variant ?? 'primary') === 'primary';
            return (
              <Button
                key={action.label}
                variant={isPrimary ? 'contained' : 'outlined'}
                disableElevation={isPrimary}
                startIcon={action.startIcon}
                onClick={action.onClick}
                sx={(th) => ({
                  ...sxObject(th, isPrimary ? compactContainedCtaSx : compactOutlinedCtaSx),
                  width: { xs: '100%', sm: 'auto' },
                })}
              >
                {action.label}
              </Button>
            );
          })}
        </Box>
      ) : null}
    </Paper>
  );
}

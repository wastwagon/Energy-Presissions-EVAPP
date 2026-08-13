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
  /**
   * `card` — bordered panel (staff tables).
   * `plain` — iOS-style empty: no chrome, SF-sized glyph, air, one tinted action.
   */
  variant?: 'card' | 'plain';
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
  variant = 'card',
}: AppEmptyStateProps) {
  const actions = [primaryAction, secondaryAction].filter(Boolean) as AppEmptyStateAction[];
  const plain = variant === 'plain';

  const body = (
    <>
      {illustrationSrc ? (
        <Box
          component="img"
          src={illustrationSrc}
          alt={illustrationAlt}
          loading="lazy"
          decoding="async"
          sx={{
            width: plain ? { xs: 128, sm: 148 } : { xs: 140, sm: 168 },
            height: plain ? { xs: 128, sm: 148 } : { xs: 140, sm: 168 },
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
            width: plain ? 56 : 72,
            height: plain ? 56 : 72,
            mx: 'auto',
            mb: plain ? 1.75 : 2,
            borderRadius: plain ? '50%' : `${iosRadii.md}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: plain ? 'rgba(60, 60, 67, 0.08)' : theme.palette.action.hover,
            color: plain ? 'text.secondary' : 'text.secondary',
            '& .MuiSvgIcon-root': { fontSize: plain ? 28 : 36 },
          })}
        >
          {icon}
        </Box>
      ) : null}
      <Typography
        variant={plain ? 'h6' : 'subtitle1'}
        sx={{
          fontWeight: plain ? 700 : 600,
          letterSpacing: plain ? '-0.022em' : undefined,
          fontSize: plain ? '1.25rem' : undefined,
          mb: description || footnote || actions.length ? 0.75 : 0,
        }}
      >
        {title}
      </Typography>
      {description ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: plain ? 280 : 420, mx: 'auto', fontSize: plain ? '0.9375rem' : undefined, lineHeight: 1.45 }}
        >
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
            mt: plain ? 2.5 : 3,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1.25,
            justifyContent: 'center',
            alignItems: 'stretch',
          }}
        >
          {actions.map((action) => {
            const isPrimary = (action.variant ?? 'primary') === 'primary';
            return (
              <Button
                key={action.label}
                variant={plain && isPrimary ? 'contained' : isPrimary ? 'contained' : 'text'}
                disableElevation={isPrimary}
                startIcon={plain ? undefined : action.startIcon}
                onClick={action.onClick}
                sx={(th) => ({
                  ...(plain
                    ? {
                        ...sxObject(th, isPrimary ? compactContainedCtaSx : compactOutlinedCtaSx),
                        minHeight: 44,
                        borderRadius: 999,
                        fontWeight: 600,
                        ...(isPrimary ? {} : { border: 'none', color: 'primary.main' }),
                      }
                    : sxObject(th, isPrimary ? compactContainedCtaSx : compactOutlinedCtaSx)),
                  width: { xs: '100%', sm: 'auto' },
                })}
              >
                {action.label}
              </Button>
            );
          })}
        </Box>
      ) : null}
    </>
  );

  if (plain) {
    return (
      <Box
        role="status"
        aria-live="polite"
        sx={[
          {
            py: { xs: 6, sm: 8 },
            px: 2,
            textAlign: 'center',
          },
          ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
        ]}
      >
        {body}
      </Box>
    );
  }

  return (
    <Paper
      elevation={0}
      role="status"
      aria-live="polite"
      sx={[premiumEmptyStatePaperSx, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
    >
      {body}
    </Paper>
  );
}

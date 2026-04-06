import { Box, Paper, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import type { SvgIconComponent } from '@mui/icons-material';

export interface QuickActionTileProps {
  Icon: SvgIconComponent;
  displayLabel: string;
  ariaLabel: string;
  onNavigate: () => void;
}

export function QuickActionTile({ Icon, displayLabel, ariaLabel, onNavigate }: QuickActionTileProps) {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={onNavigate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onNavigate();
        }
      }}
      sx={{
        p: { xs: 1.25, sm: 1.5 },
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        cursor: 'pointer',
        textAlign: 'center',
        minHeight: { xs: 88, sm: 92 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.75,
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
        '&:focus-visible': {
          outline: '2px solid',
          outlineColor: 'primary.main',
          outlineOffset: 2,
        },
        '@media (hover: hover) and (pointer: fine)': {
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: alpha(theme.palette.primary.main, 0.04),
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)',
          },
        },
      }}
    >
      <Box sx={{ color: 'primary.main', display: 'flex', '& .MuiSvgIcon-root': { fontSize: 26 } }}>
        <Icon fontSize="inherit" aria-hidden />
      </Box>
      <Typography variant="caption" sx={{ fontWeight: 700, lineHeight: 1.25, px: 0.5 }}>
        {displayLabel}
      </Typography>
    </Paper>
  );
}

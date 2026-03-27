import { Box, Typography } from '@mui/material';

interface DrawerBrandHeaderProps {
  /** e.g. "Super Admin Portal" */
  subtitle: string;
}

/** Matches Jampack classic `.menu-header` (~65px, tight horizontal padding). */
export function DrawerBrandHeader({ subtitle }: DrawerBrandHeaderProps) {
  return (
    <Box
      sx={{
        flexShrink: 0,
        minHeight: 65,
        px: '1.1875rem',
        py: 1.25,
        display: 'flex',
        alignItems: 'center',
        bgcolor: '#ffffff',
        borderBottom: '1px solid rgba(47, 52, 58, 0.09)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
        <img src="/logo.jpeg" alt="" style={{ height: 34, objectFit: 'contain' }} />
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              fontSize: '1rem',
              lineHeight: 1.25,
              letterSpacing: '-0.02em',
              color: 'text.primary',
            }}
          >
            Clean Motion Ghana
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: 'block', mt: 0.25 }}>
            {subtitle}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

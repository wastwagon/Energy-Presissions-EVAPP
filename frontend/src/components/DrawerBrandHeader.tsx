import { Box, Typography } from '@mui/material';

interface DrawerBrandHeaderProps {
  /** e.g. "Super Admin Portal" */
  subtitle: string;
}

export function DrawerBrandHeader({ subtitle }: DrawerBrandHeaderProps) {
  return (
    <Box
      sx={{
        p: 2,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <img src="/logo.jpeg" alt="" style={{ height: 32, objectFit: 'contain' }} />
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

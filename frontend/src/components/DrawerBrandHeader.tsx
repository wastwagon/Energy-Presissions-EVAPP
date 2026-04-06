import { Box, Typography } from '@mui/material';
import { LOGO_PUBLIC_URL } from '../config/branding';

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
        <img src={LOGO_PUBLIC_URL} alt="" style={{ height: 40, width: 'auto', objectFit: 'contain' }} />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.3 }}>
            {subtitle}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

import React from 'react';
import { Box, List } from '@mui/material';
import { MenuSectionComponent } from './MenuSection';
import { adminMenuConfig } from '../../config/menu.config';
import { brandColors } from '../../theme';
import { jampackMenuListSx } from '../../theme/jampackShell';

interface AdminMenuProps {
  onItemClick?: () => void;
}

export function AdminMenu({ onItemClick }: AdminMenuProps) {
  const themeColor = brandColors.secondary;

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '3px',
          '&:hover': {
            background: 'rgba(0, 0, 0, 0.3)',
          },
        },
      }}
    >
      <List sx={jampackMenuListSx}>
        {adminMenuConfig.map((section) => (
          <MenuSectionComponent key={section.id} section={section} onItemClick={onItemClick} themeColor={themeColor} />
        ))}
      </List>
    </Box>
  );
}


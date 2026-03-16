import React from 'react';
import { useLocation } from 'react-router-dom';
import { Box, List } from '@mui/material';
import { MenuSectionComponent } from './MenuSection';
import { superAdminMenuConfig } from '../../config/menu.config';

interface SuperAdminMenuProps {
  onItemClick?: () => void;
}

export function SuperAdminMenu({ onItemClick }: SuperAdminMenuProps) {
  const location = useLocation();
  const themeColor = '#062540'; // Brand primary dark (hierarchy)

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
      <List sx={{ flex: 1, pt: 2, pb: 2, px: 0.5 }}>
        {superAdminMenuConfig.map((section) => (
          <MenuSectionComponent
            key={section.id}
            section={section}
            location={location.pathname}
            onItemClick={onItemClick}
            themeColor={themeColor}
          />
        ))}
      </List>
    </Box>
  );
}


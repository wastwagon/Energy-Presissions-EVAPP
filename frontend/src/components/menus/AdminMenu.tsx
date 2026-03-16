import React from 'react';
import { useLocation } from 'react-router-dom';
import { Box, List } from '@mui/material';
import { MenuSectionComponent } from './MenuSection';
import { adminMenuConfig } from '../../config/menu.config';

interface AdminMenuProps {
  onItemClick?: () => void;
}

export function AdminMenu({ onItemClick }: AdminMenuProps) {
  const location = useLocation();
  const themeColor = '#1A5F7A'; // Brand secondary (lighter teal)

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
        {adminMenuConfig.map((section) => (
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


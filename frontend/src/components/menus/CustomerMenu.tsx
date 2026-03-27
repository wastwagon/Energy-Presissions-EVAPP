import React from 'react';
import { useLocation } from 'react-router-dom';
import { Box, List } from '@mui/material';
import { MenuSectionComponent } from './MenuSection';
import { customerMenuConfig } from '../../config/menu.config';
import { brandColors } from '../../theme';

interface CustomerMenuProps {
  onItemClick?: () => void;
}

export function CustomerMenu({ onItemClick }: CustomerMenuProps) {
  const location = useLocation();
  const themeColor = brandColors.primary;

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
        {customerMenuConfig.map((section) => (
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


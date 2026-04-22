import React, { useState } from 'react';
import {
  Box,
  Typography,
  Collapse,
  List,
  Divider,
  IconButton,
  alpha,
  useTheme,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { MenuItem } from './MenuItem';
import { MenuSection as MenuSectionType } from '../../config/menu.config';
import { getStoredAccountType } from '../../utils/authSession';
import { getRoleAccentColor } from '../../utils/roleTheme';
import { premiumIconButtonTouchSx, sxObject } from '../../styles/authShell';

interface MenuSectionProps {
  section: MenuSectionType;
  onItemClick?: () => void;
  themeColor?: string;
}

export function MenuSectionComponent({
  section,
  onItemClick,
  themeColor,
}: MenuSectionProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(
    section.defaultExpanded ?? !section.collapsible,
  );

  const handleToggle = () => {
    if (section.collapsible) {
      setExpanded(!expanded);
    }
  };

  const handleToggleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!section.collapsible) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggle();
    }
  };

  const userAccountType = getStoredAccountType();
  const primaryColor = themeColor ?? getRoleAccentColor(userAccountType);
  const userRole = userAccountType || 'Customer';

  return (
    <Box sx={{ mb: 1 }}>
      {section.title && (
        <Box
          onClick={handleToggle}
          onKeyDown={handleToggleKeyDown}
          role={section.collapsible ? 'button' : undefined}
          tabIndex={section.collapsible ? 0 : undefined}
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 2.5,
            py: 1.25,
            cursor: section.collapsible ? 'pointer' : 'default',
            borderRadius: '10px',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': section.collapsible
              ? {
                  backgroundColor: alpha('#000', 0.03),
                }
              : {},
          }}
        >
          {section.icon && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 1.5,
                color: 'text.secondary',
                fontSize: '1.1rem',
                opacity: 0.7,
              }}
            >
              {section.icon}
            </Box>
          )}
          <Typography
            component="div"
            variant="body2"
            sx={{
              fontWeight: 500,
              fontSize: '0.875rem',
              letterSpacing: '0.01em',
              color: 'text.secondary',
              flex: 1,
              lineHeight: 1.2,
            }}
          >
            {section.title}
          </Typography>
          {section.collapsible && (
            <IconButton
              size="small"
              aria-label={expanded ? `Collapse ${section.title ?? 'menu section'}` : `Expand ${section.title ?? 'menu section'}`}
              sx={{
                ...sxObject(theme, premiumIconButtonTouchSx),
                p: 0.5,
                color: 'text.secondary',
                transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  backgroundColor: alpha(primaryColor, 0.1),
                  color: primaryColor,
                },
              }}
            >
              <ChevronRightIcon sx={{ fontSize: '1rem' }} />
            </IconButton>
          )}
        </Box>
      )}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <List sx={{ pt: 0.5, pb: 0.5, px: 0 }}>
          {section.items.map((item, index) => {
            // Filter by role if specified
            if (item.roles && !item.roles.includes(userRole)) {
              return null;
            }

            return (
              <React.Fragment key={item.id}>
                <MenuItem item={item} onClick={onItemClick} themeColor={themeColor} />
                {item.divider && index < section.items.length - 1 && (
                  <Divider
                    sx={{
                      my: 0.75,
                      mx: 3,
                      borderColor: alpha('#000', 0.06),
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </List>
      </Collapse>
    </Box>
  );
}


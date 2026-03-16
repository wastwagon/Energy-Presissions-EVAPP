import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import { MenuItem as MenuItemType } from '../../config/menu.config';

interface MenuItemProps {
  item: MenuItemType;
  location: string;
  onClick?: () => void;
  themeColor?: string; // For role-specific colors
}

export function MenuItem({ item, location, onClick, themeColor }: MenuItemProps) {
  // More precise active state: only exact matches
  // This prevents parent paths from being highlighted when viewing child routes
  // e.g., /superadmin/ops should NOT be active when on /superadmin/ops/devices
  // Only the exact matching route should be highlighted
  // Use exact match, but also handle trailing slashes
  const normalizedLocation = location.replace(/\/$/, '');
  const normalizedPath = item.path.replace(/\/$/, '');
  const isActive = normalizedLocation === normalizedPath;

  // Get theme color from localStorage or use default
  const getThemeColor = () => {
    if (themeColor) return themeColor;
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        if (userData.accountType === 'SuperAdmin') return '#062540';
        if (userData.accountType === 'Admin') return '#1A5F7A';
        return '#0A3D62';
      } catch (e) {
        return '#0A3D62';
      }
    }
    return '#0A3D62';
  };

  const primaryColor = getThemeColor();

  if (item.disabled) {
    return (
      <ListItem disablePadding sx={{ mb: 0.25, px: 1 }}>
        <Tooltip title="Coming soon" arrow placement="right">
          <ListItemButton
            disabled
            sx={{
              borderRadius: '12px',
              py: 1.5,
              px: 2.5,
              minHeight: 44,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 36,
                color: 'text.disabled',
                '& svg': {
                  fontSize: '1.25rem',
                },
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              primaryTypographyProps={{
                fontWeight: 500,
                fontSize: '0.875rem',
                color: 'text.disabled',
                letterSpacing: '-0.01em',
              }}
            />
            {item.badge && (
              <Badge
                badgeContent={item.badge}
                color={item.badgeColor || 'default'}
                sx={{ ml: 1 }}
              />
            )}
          </ListItemButton>
        </Tooltip>
      </ListItem>
    );
  }

  const buttonContent = (
    <ListItemButton
      component={item.external ? 'a' : Link}
      to={item.external ? undefined : item.path}
      href={item.external ? item.path : undefined}
      target={item.external ? '_blank' : undefined}
      selected={isActive}
      onClick={onClick}
      sx={{
        borderRadius: '12px',
        py: 1.5,
        px: 2.5,
        minHeight: 44,
        mb: 0.25,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&.Mui-selected': {
          background: `linear-gradient(135deg, ${alpha(primaryColor, 0.12)} 0%, ${alpha(primaryColor, 0.08)} 100%)`,
          color: primaryColor,
          fontWeight: 600,
          '&:hover': {
            background: `linear-gradient(135deg, ${alpha(primaryColor, 0.16)} 0%, ${alpha(primaryColor, 0.12)} 100%)`,
            transform: 'none',
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 3,
            height: '60%',
            borderRadius: '0 2px 2px 0',
            background: primaryColor,
          },
          '& .MuiListItemIcon-root': {
            color: primaryColor,
          },
        },
        '&:hover': {
          backgroundColor: alpha(primaryColor, 0.06),
          transform: 'translateX(2px)',
          '& .MuiListItemIcon-root': {
            color: primaryColor,
          },
        },
        '&:active': {
          transform: 'translateX(1px) scale(0.98)',
        },
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: 36,
          color: isActive ? primaryColor : 'text.secondary',
          transition: 'color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '& svg': {
            fontSize: '1.25rem',
          },
        }}
      >
        {item.icon}
      </ListItemIcon>
      <ListItemText
        primary={item.text}
        primaryTypographyProps={{
          fontWeight: isActive ? 600 : 500,
          fontSize: '0.875rem',
          letterSpacing: '-0.01em',
          color: isActive ? 'text.primary' : 'text.secondary',
        }}
      />
      {item.badge && (
        <Badge
          badgeContent={item.badge}
          color={item.badgeColor || 'error'}
          sx={{
            ml: 1,
            '& .MuiBadge-badge': {
              fontSize: '0.7rem',
              minWidth: 18,
              height: 18,
              borderRadius: '9px',
            },
          }}
        />
      )}
      {item.shortcut && (
        <Typography
          variant="caption"
          sx={{
            ml: 1.5,
            color: 'text.disabled',
            fontSize: '0.7rem',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            backgroundColor: alpha('#000', 0.05),
            px: 1,
            py: 0.25,
            borderRadius: '4px',
            letterSpacing: '0.02em',
          }}
        >
          {item.shortcut}
        </Typography>
      )}
    </ListItemButton>
  );

  return (
    <ListItem disablePadding sx={{ px: 1 }}>
      {item.shortcut ? (
        <Tooltip title={`Keyboard shortcut: ${item.shortcut}`} arrow placement="right">
          {buttonContent}
        </Tooltip>
      ) : (
        buttonContent
      )}
    </ListItem>
  );
}


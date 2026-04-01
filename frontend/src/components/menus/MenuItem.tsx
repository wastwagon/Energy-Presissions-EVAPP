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
import { getStoredAccountType } from '../../utils/authSession';
import { getRoleAccentColor } from '../../utils/roleTheme';

interface MenuItemProps {
  item: MenuItemType;
  onClick?: () => void;
  themeColor?: string; // For role-specific colors
}

function normalizePathname(pathname: string) {
  return pathname.replace(/\/$/, '') || '/';
}

function getMenuItemActive(
  itemPath: string,
  pathname: string,
  search: string,
  activeOnlyWithoutSearch?: boolean,
) {
  const q = itemPath.indexOf('?');
  const pathPart = q >= 0 ? itemPath.slice(0, q) : itemPath;
  const expectedSearch = q >= 0 ? itemPath.slice(q) : null;
  const normLoc = normalizePathname(pathname);
  const normItem = normalizePathname(pathPart);
  if (normLoc !== normItem) return false;
  if (expectedSearch !== null) return search === expectedSearch;
  if (activeOnlyWithoutSearch) return search === '';
  return true;
}

export function MenuItem({ item, onClick, themeColor }: MenuItemProps) {
  const { pathname, search } = useLocation();
  const isActive = getMenuItemActive(item.path, pathname, search, item.activeOnlyWithoutSearch);

  const primaryColor = themeColor ?? getRoleAccentColor(getStoredAccountType());

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
        position: 'relative',
        borderRadius: '8px',
        py: 1,
        px: 2,
        minHeight: 44,
        mb: 0.25,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&.Mui-selected': {
          backgroundColor: alpha(primaryColor, 0.12),
          color: primaryColor,
          fontWeight: 600,
          '&:hover': {
            backgroundColor: alpha(primaryColor, 0.16),
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
          backgroundColor: alpha(primaryColor, 0.08),
          transform: 'translateX(5px)',
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
            fontFamily: 'inherit',
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


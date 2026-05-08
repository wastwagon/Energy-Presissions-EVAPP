import { useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { SvgIconComponent } from '@mui/icons-material';
import { customerDrawerMoreItems, type CustomerDrawerNavItem } from '../../config/customerDrawerNav';
import {
  customerNavDrawerLightCloseIconButtonSx,
  customerNavDrawerLightHeaderRowSx,
  customerNavDrawerLightListRowSx,
  customerNavDrawerLightPaperSx,
} from '../../theme/chargingPremiumShell';

export type CustomerAppNavDrawerProps = {
  open: boolean;
  onClose: () => void;
  /** For tests / multiple instances */
  id?: string;
};

/**
 * Signed-in **Customer** / **WalkIn** drawer — light shell matches dashboard pages and bottom nav.
 */
export function CustomerAppNavDrawer({ open, onClose, id = 'customer-app-nav-drawer' }: CustomerAppNavDrawerProps) {
  const navigate = useNavigate();

  const go = (to: string) => {
    navigate(to);
    onClose();
  };

  const renderRow = (item: CustomerDrawerNavItem) => {
    const Icon: SvgIconComponent = item.Icon;
    return (
      <ListItemButton key={`${item.to}-${item.label}`} onClick={() => go(item.to)} sx={customerNavDrawerLightListRowSx}>
        <ListItemIcon sx={{ minWidth: 48, color: 'text.secondary' }}>
          <Icon fontSize="small" />
        </ListItemIcon>
        <ListItemText
          primary={item.label}
          primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9375rem' }}
        />
      </ListItemButton>
    );
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        id,
        'aria-label': 'App navigation and account',
        sx: customerNavDrawerLightPaperSx,
      }}
    >
      <Box sx={customerNavDrawerLightHeaderRowSx}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: 'text.primary' }}>
            Menu
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            CleanMotion · everywhere you drive
          </Typography>
        </Box>
        <IconButton onClick={onClose} aria-label="Close menu" sx={customerNavDrawerLightCloseIconButtonSx}>
          <CloseIcon />
        </IconButton>
      </Box>
      <List component="nav" disablePadding sx={{ py: 1, px: 0.5 }}>
        {customerDrawerMoreItems.map((item) => renderRow(item))}
      </List>
    </Drawer>
  );
}

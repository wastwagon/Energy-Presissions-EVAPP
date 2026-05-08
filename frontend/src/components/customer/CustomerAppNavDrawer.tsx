import { useNavigate } from 'react-router-dom';
import {
  Box,
  Divider,
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
import {
  customerDrawerAccountItems,
  customerDrawerPrimaryItems,
  type CustomerDrawerNavItem,
} from '../../config/customerDrawerNav';
import {
  customerNavDrawerCloseIconButtonSx,
  customerNavDrawerHeaderRowSx,
  customerNavDrawerListRowSx,
  customerNavDrawerPaperSx,
} from '../../theme/chargingPremiumShell';

export type CustomerAppNavDrawerProps = {
  open: boolean;
  onClose: () => void;
  /** For tests / multiple instances */
  id?: string;
};

/**
 * Unified dark nav drawer for signed-in **Customer** / **WalkIn** — premium AppBar pairing.
 * Item list lives in `config/customerDrawerNav.tsx` so routes stay canonical with the product.
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
      <ListItemButton key={`${item.to}-${item.label}`} onClick={() => go(item.to)} sx={customerNavDrawerListRowSx}>
        <ListItemIcon sx={{ minWidth: 48, color: 'rgba(255, 255, 255, 0.9)' }}>
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
        sx: customerNavDrawerPaperSx,
      }}
    >
      <Box sx={customerNavDrawerHeaderRowSx}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
            Menu
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            CleanMotion · everywhere you drive
          </Typography>
        </Box>
        <IconButton onClick={onClose} aria-label="Close menu" sx={customerNavDrawerCloseIconButtonSx}>
          <CloseIcon />
        </IconButton>
      </Box>
      <List component="nav" disablePadding sx={{ py: 1, px: 0.5 }}>
        {customerDrawerPrimaryItems.map((item) => renderRow(item))}
        <Divider sx={{ my: 1.5, borderColor: 'rgba(255, 255, 255, 0.12)' }} />
        <Typography
          component="p"
          variant="caption"
          sx={{
            px: 1.5,
            py: 0.5,
            color: 'rgba(255, 255, 255, 0.45)',
            textTransform: 'uppercase',
            letterSpacing: 0.08,
            fontWeight: 600,
          }}
        >
          Account
        </Typography>
        {customerDrawerAccountItems.map((item) => renderRow(item))}
      </List>
    </Drawer>
  );
}

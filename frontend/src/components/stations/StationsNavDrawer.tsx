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
import EvStationIcon from '@mui/icons-material/EvStation';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import HistoryIcon from '@mui/icons-material/History';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import type { SvgIconComponent } from '@mui/icons-material';
import { CUSTOMER_ROUTES } from '../../config/customerNav.paths';

type NavItem = { label: string; to: string; Icon: SvgIconComponent };

const ITEMS: NavItem[] = [
  { label: 'Charging', to: CUSTOMER_ROUTES.charging, Icon: EvStationIcon },
  { label: 'Dashboard', to: CUSTOMER_ROUTES.dashboard, Icon: DashboardIcon },
  { label: 'Favorites', to: CUSTOMER_ROUTES.favorites, Icon: FavoriteBorderIcon },
  { label: 'Live charging', to: CUSTOMER_ROUTES.sessionsActive, Icon: BatteryChargingFullIcon },
  { label: 'Wallet', to: CUSTOMER_ROUTES.wallet, Icon: AccountBalanceWalletIcon },
  { label: 'History', to: CUSTOMER_ROUTES.sessionsHistory, Icon: HistoryIcon },
  { label: 'Help', to: CUSTOMER_ROUTES.help, Icon: HelpOutlineIcon },
];

export type StationsNavDrawerProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * Right-side dark nav drawer (replaces the on-page “Shortcuts” grid for signed-in customers).
 */
export function StationsNavDrawer({ open, onClose }: StationsNavDrawerProps) {
  const navigate = useNavigate();

  const go = (to: string) => {
    navigate(to);
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        id: 'stations-nav-drawer',
        'aria-label': 'Account and app navigation',
        sx: {
          width: { xs: 'min(100%, 320px)', sm: 320 },
          maxWidth: '100vw',
          background: 'linear-gradient(180deg, #0a0a0b 0%, #121214 100%)',
          color: 'common.white',
          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.35)',
          pt: 'max(12px, env(safe-area-inset-top, 0px))',
          pb: 'env(safe-area-inset-bottom, 0px)',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          px: 2,
          py: 1.5,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
            Menu
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            Go to a screen
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          aria-label="Close menu"
          size="small"
          sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            minWidth: 44,
            minHeight: 44,
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' },
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
      <List component="nav" disablePadding sx={{ py: 1.5, px: 0.5 }}>
        {ITEMS.map(({ label, to, Icon }) => (
          <ListItemButton
            key={to + label}
            onClick={() => go(to)}
            sx={{
              borderRadius: 1.5,
              mx: 0.5,
              mb: 0.5,
              py: 1.5,
              minHeight: 52,
              color: 'common.white',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 48, color: 'rgba(255, 255, 255, 0.9)' }}>
              <Icon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={label}
              primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9375rem' }}
            />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  );
}

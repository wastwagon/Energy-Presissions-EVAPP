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
import EvStationIcon from '@mui/icons-material/EvStation';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import HistoryIcon from '@mui/icons-material/History';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PaymentIcon from '@mui/icons-material/Payment';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import type { SvgIconComponent } from '@mui/icons-material';
import { CUSTOMER_ROUTES } from '../../config/customerNav.paths';

export type NavRow = { label: string; to: string; Icon: SvgIconComponent };

const PRIMARY: NavRow[] = [
  { label: 'Find stations', to: CUSTOMER_ROUTES.stations, Icon: LocationOnIcon },
  { label: 'Charging', to: CUSTOMER_ROUTES.charging, Icon: EvStationIcon },
  { label: 'Wallet', to: CUSTOMER_ROUTES.wallet, Icon: AccountBalanceWalletIcon },
  { label: 'Payments', to: CUSTOMER_ROUTES.payments, Icon: PaymentIcon },
  { label: 'Session history', to: CUSTOMER_ROUTES.sessionsHistory, Icon: HistoryIcon },
  { label: 'Help', to: CUSTOMER_ROUTES.help, Icon: HelpOutlineIcon },
  { label: 'Payment methods', to: CUSTOMER_ROUTES.paymentMethods, Icon: CreditCardIcon },
];

const ACCOUNT: NavRow[] = [
  { label: 'Profile', to: CUSTOMER_ROUTES.profile, Icon: PersonIcon },
  { label: 'Preferences', to: CUSTOMER_ROUTES.preferences, Icon: SettingsIcon },
];

const rowSx = {
  borderRadius: 1.5,
  mx: 0.5,
  mb: 0.5,
  py: 1.5,
  minHeight: 48,
  color: 'common.white' as const,
  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' },
};

export type CustomerAppNavDrawerProps = {
  open: boolean;
  onClose: () => void;
  /** For tests / multiple instances */
  id?: string;
};

/**
 * Unified dark nav drawer for signed-in **Customer** / **WalkIn** — used from the mobile premium AppBar (customer layout, stations).
 */
export function CustomerAppNavDrawer({ open, onClose, id = 'customer-app-nav-drawer' }: CustomerAppNavDrawerProps) {
  const navigate = useNavigate();

  const go = (to: string) => {
    navigate(to);
    onClose();
  };

  const renderRow = (item: NavRow) => {
    const Icon = item.Icon;
    return (
      <ListItemButton key={`${item.to}-${item.label}`} onClick={() => go(item.to)} sx={rowSx}>
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
            CleanMotion · everywhere you drive
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
      <List component="nav" disablePadding sx={{ py: 1, px: 0.5 }}>
        {PRIMARY.map((item) => renderRow(item))}
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
        {ACCOUNT.map((item) => renderRow(item))}
      </List>
    </Drawer>
  );
}

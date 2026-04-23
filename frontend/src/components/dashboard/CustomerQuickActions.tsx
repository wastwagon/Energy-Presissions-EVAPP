import { useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { SvgIconComponent } from '@mui/icons-material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import HistoryIcon from '@mui/icons-material/History';
import PaymentIcon from '@mui/icons-material/Payment';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AddIcon from '@mui/icons-material/Add';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import EvStationIcon from '@mui/icons-material/EvStation';
import { CUSTOMER_ROUTES } from '../../config/customerNav.paths';
import { QuickActionTile } from './QuickActionTile';

export type CustomerQuickActionsPreset =
  | 'dashboard'
  | 'wallet'
  | 'top_up'
  | 'stations'
  | 'sessions_active'
  | 'sessions_history'
  | 'favorites'
  | 'payments'
  | 'help'
  | 'profile'
  | 'payment_methods'
  | 'preferences'
  | 'transaction_detail'
  | 'station_detail'
  | 'charging';

type ActionKey =
  | 'stations'
  | 'favorites'
  | 'live'
  | 'history'
  | 'payments'
  | 'help'
  | 'wallet'
  | 'top_up'
  | 'payment_methods'
  | 'profile'
  | 'preferences'
  | 'charging';

interface ActionDef {
  path: string;
  label: string;
  shortLabel: string;
  ariaLabel: string;
  Icon: SvgIconComponent;
}

const ACTION_DEFS: Record<ActionKey, ActionDef> = {
  charging: {
    path: CUSTOMER_ROUTES.charging,
    label: 'Charging',
    shortLabel: 'Charging',
    ariaLabel: 'Charging hub',
    Icon: EvStationIcon,
  },
  stations: {
    path: CUSTOMER_ROUTES.stations,
    label: 'Find stations',
    shortLabel: 'Stations',
    ariaLabel: 'Find charging stations',
    Icon: LocationOnIcon,
  },
  favorites: {
    path: CUSTOMER_ROUTES.favorites,
    label: 'Favorites',
    shortLabel: 'Saved',
    ariaLabel: 'Favorite stations',
    Icon: FavoriteBorderIcon,
  },
  live: {
    path: CUSTOMER_ROUTES.sessionsActive,
    label: 'Live charging',
    shortLabel: 'Live',
    ariaLabel: 'Active charging sessions',
    Icon: BatteryChargingFullIcon,
  },
  history: {
    path: CUSTOMER_ROUTES.sessionsHistory,
    label: 'History',
    shortLabel: 'History',
    ariaLabel: 'Session history',
    Icon: HistoryIcon,
  },
  payments: {
    path: CUSTOMER_ROUTES.payments,
    label: 'Payments',
    shortLabel: 'Payments',
    ariaLabel: 'Payment history',
    Icon: PaymentIcon,
  },
  help: {
    path: CUSTOMER_ROUTES.help,
    label: 'Help',
    shortLabel: 'Help',
    ariaLabel: 'Help and support',
    Icon: HelpOutlineIcon,
  },
  wallet: {
    path: CUSTOMER_ROUTES.wallet,
    label: 'Wallet',
    shortLabel: 'Wallet',
    ariaLabel: 'My wallet',
    Icon: AccountBalanceWalletIcon,
  },
  top_up: {
    path: CUSTOMER_ROUTES.walletTopUp,
    label: 'Top up wallet',
    shortLabel: 'Top up',
    ariaLabel: 'Top up wallet balance',
    Icon: AddIcon,
  },
  payment_methods: {
    path: CUSTOMER_ROUTES.paymentMethods,
    label: 'Payment methods',
    shortLabel: 'Cards',
    ariaLabel: 'Payment methods',
    Icon: CreditCardIcon,
  },
  profile: {
    path: CUSTOMER_ROUTES.profile,
    label: 'Profile',
    shortLabel: 'Profile',
    ariaLabel: 'My profile',
    Icon: PersonIcon,
  },
  preferences: {
    path: CUSTOMER_ROUTES.preferences,
    label: 'Preferences',
    shortLabel: 'Settings',
    ariaLabel: 'Account preferences',
    Icon: SettingsIcon,
  },
};

const PRESET_KEYS: Record<CustomerQuickActionsPreset, ActionKey[]> = {
  charging: ['stations', 'favorites', 'live', 'history', 'wallet', 'help'],
  dashboard: ['charging', 'stations', 'favorites', 'live', 'history', 'payments', 'help'],
  wallet: ['charging', 'top_up', 'payment_methods', 'stations', 'live', 'history'],
  top_up: ['charging', 'wallet', 'payment_methods', 'stations', 'live', 'history'],
  stations: ['charging', 'favorites', 'live', 'wallet', 'history', 'help'],
  sessions_active: ['charging', 'stations', 'history', 'wallet', 'payments', 'help'],
  sessions_history: ['charging', 'live', 'stations', 'wallet', 'payments', 'help'],
  favorites: ['charging', 'stations', 'live', 'wallet', 'payments', 'help'],
  payments: ['charging', 'wallet', 'payment_methods', 'stations', 'live', 'history'],
  help: ['charging', 'stations', 'wallet', 'live', 'profile', 'payments'],
  profile: ['charging', 'wallet', 'stations', 'live', 'preferences', 'help'],
  payment_methods: ['charging', 'wallet', 'top_up', 'stations', 'live', 'payments'],
  preferences: ['charging', 'profile', 'wallet', 'stations', 'live', 'help'],
  transaction_detail: ['charging', 'history', 'live', 'stations', 'wallet', 'payments'],
  station_detail: ['charging', 'stations', 'favorites', 'live', 'wallet', 'history'],
};

export interface CustomerQuickActionsProps {
  preset: CustomerQuickActionsPreset;
  /** When false, nothing is rendered (e.g. guest on stations). */
  visible?: boolean;
  sectionLabel?: string;
}

export function CustomerQuickActions({
  preset,
  visible = true,
  sectionLabel = 'Shortcuts',
}: CustomerQuickActionsProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobileNav = useMediaQuery(theme.breakpoints.down('sm'));

  if (!visible) {
    return null;
  }

  const keys = PRESET_KEYS[preset];
  const actions = keys.map((k) => ({ key: k, ...ACTION_DEFS[k] }));

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%' }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', mb: 1, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}
      >
        {sectionLabel}
      </Typography>
      <Grid container spacing={{ xs: 1.25, sm: 1.5 }} sx={{ mb: 3 }}>
        {actions.map((action) => (
          <Grid item xs={6} sm={4} md={2} key={`${preset}-${action.path}`}>
            <QuickActionTile
              Icon={action.Icon}
              displayLabel={isMobileNav ? action.shortLabel : action.label}
              ariaLabel={action.ariaLabel}
              onNavigate={() => navigate(action.path)}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

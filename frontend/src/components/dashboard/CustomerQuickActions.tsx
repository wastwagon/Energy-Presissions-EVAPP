import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Grid, useMediaQuery } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import type { SvgIconComponent } from '@mui/icons-material';
import DashboardIcon from '@mui/icons-material/Dashboard';
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
  | 'station_detail';

type ActionKey =
  | 'dashboard'
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
  | 'preferences';

interface ActionDef {
  path: string;
  label: string;
  shortLabel: string;
  ariaLabel: string;
  Icon: SvgIconComponent;
}

const ACTION_DEFS: Record<ActionKey, ActionDef> = {
  dashboard: {
    path: '/user/dashboard',
    label: 'Dashboard',
    shortLabel: 'Home',
    ariaLabel: 'Go to my dashboard',
    Icon: DashboardIcon,
  },
  stations: {
    path: '/stations',
    label: 'Find stations',
    shortLabel: 'Stations',
    ariaLabel: 'Find charging stations',
    Icon: LocationOnIcon,
  },
  favorites: {
    path: '/user/favorites',
    label: 'Favorites',
    shortLabel: 'Saved',
    ariaLabel: 'Favorite stations',
    Icon: FavoriteBorderIcon,
  },
  live: {
    path: '/user/sessions/active',
    label: 'Live charging',
    shortLabel: 'Live',
    ariaLabel: 'Active charging sessions',
    Icon: BatteryChargingFullIcon,
  },
  history: {
    path: '/user/sessions/history',
    label: 'History',
    shortLabel: 'History',
    ariaLabel: 'Session history',
    Icon: HistoryIcon,
  },
  payments: {
    path: '/user/payments',
    label: 'Payments',
    shortLabel: 'Payments',
    ariaLabel: 'Payment history',
    Icon: PaymentIcon,
  },
  help: {
    path: '/user/help',
    label: 'Help',
    shortLabel: 'Help',
    ariaLabel: 'Help and support',
    Icon: HelpOutlineIcon,
  },
  wallet: {
    path: '/user/wallet',
    label: 'Wallet',
    shortLabel: 'Wallet',
    ariaLabel: 'My wallet',
    Icon: AccountBalanceWalletIcon,
  },
  top_up: {
    path: '/user/wallet/top-up',
    label: 'Top up wallet',
    shortLabel: 'Top up',
    ariaLabel: 'Top up wallet balance',
    Icon: AddIcon,
  },
  payment_methods: {
    path: '/user/payment-methods',
    label: 'Payment methods',
    shortLabel: 'Cards',
    ariaLabel: 'Payment methods',
    Icon: CreditCardIcon,
  },
  profile: {
    path: '/user/profile',
    label: 'Profile',
    shortLabel: 'Profile',
    ariaLabel: 'My profile',
    Icon: PersonIcon,
  },
  preferences: {
    path: '/user/preferences',
    label: 'Preferences',
    shortLabel: 'Settings',
    ariaLabel: 'Account preferences',
    Icon: SettingsIcon,
  },
};

const PRESET_KEYS: Record<CustomerQuickActionsPreset, ActionKey[]> = {
  dashboard: ['stations', 'favorites', 'live', 'history', 'payments', 'help'],
  wallet: ['dashboard', 'top_up', 'payment_methods', 'stations', 'live', 'history'],
  top_up: ['dashboard', 'wallet', 'payment_methods', 'stations', 'live', 'history'],
  stations: ['dashboard', 'favorites', 'live', 'wallet', 'history', 'help'],
  sessions_active: ['dashboard', 'stations', 'history', 'wallet', 'payments', 'help'],
  sessions_history: ['dashboard', 'live', 'stations', 'wallet', 'payments', 'help'],
  favorites: ['dashboard', 'stations', 'live', 'wallet', 'payments', 'help'],
  payments: ['dashboard', 'wallet', 'payment_methods', 'stations', 'live', 'history'],
  help: ['dashboard', 'stations', 'wallet', 'live', 'profile', 'payments'],
  profile: ['dashboard', 'wallet', 'stations', 'live', 'preferences', 'help'],
  payment_methods: ['dashboard', 'wallet', 'top_up', 'stations', 'live', 'payments'],
  preferences: ['dashboard', 'profile', 'wallet', 'stations', 'live', 'help'],
  transaction_detail: ['dashboard', 'history', 'live', 'stations', 'wallet', 'payments'],
  station_detail: ['dashboard', 'stations', 'favorites', 'live', 'wallet', 'history'],
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
        {actions.map((action) => {
          const Icon = action.Icon;
          return (
            <Grid item xs={6} sm={4} md={2} key={`${preset}-${action.path}`}>
              <Paper
                elevation={0}
                role="button"
                tabIndex={0}
                aria-label={action.ariaLabel}
                onClick={() => navigate(action.path)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(action.path);
                  }
                }}
                sx={{
                  p: { xs: 1.25, sm: 1.5 },
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  cursor: 'pointer',
                  textAlign: 'center',
                  minHeight: { xs: 88, sm: 92 },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.75,
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
                  '&:focus-visible': {
                    outline: '2px solid',
                    outlineColor: 'primary.main',
                    outlineOffset: 2,
                  },
                  '@media (hover: hover) and (pointer: fine)': {
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
                      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)',
                    },
                  },
                }}
              >
                <Box sx={{ color: 'primary.main', display: 'flex', '& .MuiSvgIcon-root': { fontSize: 26 } }}>
                  <Icon fontSize="inherit" aria-hidden />
                </Box>
                <Typography variant="caption" sx={{ fontWeight: 700, lineHeight: 1.25, px: 0.5 }}>
                  {isMobileNav ? action.shortLabel : action.label}
                </Typography>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

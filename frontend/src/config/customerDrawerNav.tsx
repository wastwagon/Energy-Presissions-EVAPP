/**
 * Canonical customer drawer navigation — single source for labels + routes / icons.
 * Bottom nav tabs stay in menu.config.tsx; keep labels aligned when editing both.
 */
import type { SvgIconComponent } from '@mui/icons-material';
import EvStationIcon from '@mui/icons-material/EvStation';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import HistoryIcon from '@mui/icons-material/History';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PaymentIcon from '@mui/icons-material/Payment';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import { CUSTOMER_ROUTES } from './customerNav.paths';

export type CustomerDrawerNavItem = {
  label: string;
  to: string;
  Icon: SvgIconComponent;
};

export const customerDrawerPrimaryItems: CustomerDrawerNavItem[] = [
  { label: 'Find stations', to: CUSTOMER_ROUTES.stations, Icon: LocationOnIcon },
  { label: 'Charging', to: CUSTOMER_ROUTES.charging, Icon: EvStationIcon },
  { label: 'Wallet', to: CUSTOMER_ROUTES.wallet, Icon: AccountBalanceWalletIcon },
  { label: 'Payments', to: CUSTOMER_ROUTES.payments, Icon: PaymentIcon },
  { label: 'Session history', to: CUSTOMER_ROUTES.sessionsHistory, Icon: HistoryIcon },
  { label: 'Help', to: CUSTOMER_ROUTES.help, Icon: HelpOutlineIcon },
  { label: 'Payment methods', to: CUSTOMER_ROUTES.paymentMethods, Icon: CreditCardIcon },
];

export const customerDrawerAccountItems: CustomerDrawerNavItem[] = [
  { label: 'Profile', to: CUSTOMER_ROUTES.profile, Icon: PersonIcon },
  { label: 'Preferences', to: CUSTOMER_ROUTES.preferences, Icon: SettingsIcon },
];

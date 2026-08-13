/**
 * Secondary Account destinations (not on the tab bar). Map, Charge, Wallet, and Account
 * live in `customerBottomNavItems`.
 */
import type { SvgIconComponent } from '@mui/icons-material';
import HistoryIcon from '@mui/icons-material/History';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PaymentIcon from '@mui/icons-material/Payment';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import SettingsIcon from '@mui/icons-material/Settings';
import { CUSTOMER_ROUTES } from './customerNav.paths';

export type CustomerDrawerNavItem = {
  label: string;
  to: string;
  Icon: SvgIconComponent;
};

/** Secondary destinations only — tab destinations live in `customerBottomNavItems`. */
export const customerDrawerMoreItems: CustomerDrawerNavItem[] = [
  { label: 'Payments', to: CUSTOMER_ROUTES.payments, Icon: PaymentIcon },
  { label: 'Session history', to: CUSTOMER_ROUTES.sessionsHistory, Icon: HistoryIcon },
  { label: 'Help', to: CUSTOMER_ROUTES.help, Icon: HelpOutlineIcon },
  { label: 'Payment methods', to: CUSTOMER_ROUTES.paymentMethods, Icon: CreditCardIcon },
  { label: 'Preferences', to: CUSTOMER_ROUTES.preferences, Icon: SettingsIcon },
];

/**
 * Menu configuration: admin/superadmin drawer sections and shared bottom-nav item lists.
 */

import DashboardIcon from '@mui/icons-material/Dashboard';
import EvStationIcon from '@mui/icons-material/EvStation';
import HistoryIcon from '@mui/icons-material/History';
import BusinessIcon from '@mui/icons-material/Business';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SettingsIcon from '@mui/icons-material/Settings';
import PeopleIcon from '@mui/icons-material/People';
import PaymentIcon from '@mui/icons-material/Payment';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SecurityIcon from '@mui/icons-material/Security';
import StorageIcon from '@mui/icons-material/Storage';
import BuildIcon from '@mui/icons-material/Build';
import BugReportIcon from '@mui/icons-material/BugReport';
import ScheduleIcon from '@mui/icons-material/Schedule';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import BarChartIcon from '@mui/icons-material/BarChart';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import MemoryIcon from '@mui/icons-material/Memory';
import CableIcon from '@mui/icons-material/Cable';
import SpeedIcon from '@mui/icons-material/Speed';
import HomeIcon from '@mui/icons-material/Home';
import LoginIcon from '@mui/icons-material/Login';
import { CUSTOMER_BOTTOM_NAV_PREFIXES, CUSTOMER_ROUTES } from './customerNav.paths';
import { ADMIN_ROUTES, SUPERADMIN_ROUTES } from './staffNav.paths';

export interface MenuItem {
  id: string;
  text: string;
  icon: React.ReactNode;
  path: string;
  badge?: number | string;
  badgeColor?: 'default' | 'primary' | 'error' | 'warning' | 'success';
  divider?: boolean;
  section?: string;
  children?: MenuItem[];
  disabled?: boolean;
  external?: boolean;
  shortcut?: string;
  roles?: string[]; // Which roles can see this item
  /** If true, active only when pathname matches and there is no query string (avoids clashing with another item on the same path). */
  activeOnlyWithoutSearch?: boolean;
}

export interface MenuSection {
  id: string;
  title: string;
  icon?: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  items: MenuItem[];
}

/**
 * Super Admin Menu Configuration
 * Full system access with all features
 */
export const superAdminMenuConfig: MenuSection[] = [
  {
    id: 'overview',
    title: 'Overview',
    collapsible: false,
    defaultExpanded: true,
    items: [
      {
        id: 'dashboard',
        text: 'My Dashboard',
        icon: <DashboardIcon />,
        path: SUPERADMIN_ROUTES.dashboard,
        roles: ['SuperAdmin'],
      },
      {
        id: 'analytics',
        text: 'System Analytics',
        icon: <TrendingUpIcon />,
        path: SUPERADMIN_ROUTES.analytics,
        activeOnlyWithoutSearch: true,
        roles: ['SuperAdmin'],
      },
    ],
  },
  {
    id: 'operations',
    title: 'Operations',
    icon: <CableIcon />,
    collapsible: true,
    defaultExpanded: true,
    items: [
      {
        id: 'ops-dashboard',
        text: 'Operations Dashboard',
        icon: <DashboardIcon />,
        path: SUPERADMIN_ROUTES.ops,
        roles: ['SuperAdmin'],
      },
      {
        id: 'sessions',
        text: 'Charging Sessions',
        icon: <HistoryIcon />,
        path: SUPERADMIN_ROUTES.opsSessions,
        roles: ['SuperAdmin'],
      },
      {
        id: 'devices',
        text: 'Device Management',
        icon: <EvStationIcon />,
        path: SUPERADMIN_ROUTES.opsDevices,
        roles: ['SuperAdmin'],
      },
      {
        id: 'connection-logs',
        text: 'Connection Logs',
        icon: <StorageIcon />,
        path: SUPERADMIN_ROUTES.connectionLogs,
        roles: ['SuperAdmin'],
      },
    ],
  },
  {
    id: 'vendor-management',
    title: 'Vendor Management',
    icon: <BusinessIcon />,
    collapsible: true,
    defaultExpanded: false,
    items: [
      {
        id: 'all-vendors',
        text: 'All Vendors',
        icon: <BusinessIcon />,
        path: SUPERADMIN_ROUTES.vendors,
        roles: ['SuperAdmin'],
      },
      {
        id: 'vendor-settings',
        text: 'Vendor Settings',
        icon: <SettingsIcon />,
        path: SUPERADMIN_ROUTES.vendor,
        roles: ['SuperAdmin'],
      },
      {
        id: 'vendor-analytics',
        text: 'Vendor Analytics',
        icon: <BarChartIcon />,
        path: `${SUPERADMIN_ROUTES.analytics}?scope=vendor`,
        roles: ['SuperAdmin'],
      },
    ],
  },
  {
    id: 'financial',
    title: 'Financial',
    icon: <AttachMoneyIcon />,
    collapsible: true,
    defaultExpanded: true,
    items: [
      {
        id: 'wallet-management',
        text: 'Wallet Management',
        icon: <AccountBalanceWalletIcon />,
        path: SUPERADMIN_ROUTES.wallets,
        roles: ['SuperAdmin'],
      },
      {
        id: 'payment-processing',
        text: 'Payment Processing',
        icon: <PaymentIcon />,
        path: SUPERADMIN_ROUTES.payments,
        roles: ['SuperAdmin'],
      },
      {
        id: 'revenue-reports',
        text: 'Revenue Reports',
        icon: <AssessmentIcon />,
        path: SUPERADMIN_ROUTES.reports,
        roles: ['SuperAdmin'],
      },
      {
        id: 'billing-invoices',
        text: 'Billing & Invoices',
        icon: <ReceiptIcon />,
        path: SUPERADMIN_ROUTES.billing,
        roles: ['SuperAdmin'],
      },
      {
        id: 'billing-settings',
        text: 'Billing Settings',
        icon: <CreditCardIcon />,
        path: SUPERADMIN_ROUTES.settings,
        roles: ['SuperAdmin'],
      },
    ],
  },
  {
    id: 'system-admin',
    title: 'System Administration',
    icon: <SecurityIcon />,
    collapsible: true,
    defaultExpanded: false,
    items: [
      {
        id: 'system-settings',
        text: 'System Settings',
        icon: <SettingsIcon />,
        path: SUPERADMIN_ROUTES.settings,
        roles: ['SuperAdmin'],
      },
      {
        id: 'user-management',
        text: 'User Management',
        icon: <PeopleIcon />,
        path: SUPERADMIN_ROUTES.users,
        roles: ['SuperAdmin'],
      },
      {
        id: 'security-logs',
        text: 'Security & Logs',
        icon: <SecurityIcon />,
        path: SUPERADMIN_ROUTES.security,
        roles: ['SuperAdmin'],
      },
      {
        id: 'system-health',
        text: 'System Health',
        icon: <MemoryIcon />,
        path: SUPERADMIN_ROUTES.health,
        roles: ['SuperAdmin'],
      },
    ],
  },
  {
    id: 'advanced-features',
    title: 'Advanced Features',
    icon: <BuildIcon />,
    collapsible: true,
    defaultExpanded: false,
    items: [
      {
        id: 'tariffs',
        text: 'Tariffs & Pricing',
        icon: <AttachMoneyIcon />,
        path: SUPERADMIN_ROUTES.tariffs,
        roles: ['SuperAdmin'],
      },
      {
        id: 'reservations',
        text: 'Reservations',
        icon: <ScheduleIcon />,
        path: SUPERADMIN_ROUTES.reservations,
        roles: ['SuperAdmin'],
      },
      {
        id: 'firmware',
        text: 'Firmware Management',
        icon: <CloudUploadIcon />,
        path: SUPERADMIN_ROUTES.firmware,
        roles: ['SuperAdmin'],
      },
      {
        id: 'diagnostics',
        text: 'Diagnostics',
        icon: <BugReportIcon />,
        path: SUPERADMIN_ROUTES.diagnostics,
        roles: ['SuperAdmin'],
      },
      {
        id: 'smart-charging',
        text: 'Smart Charging',
        icon: <SpeedIcon />,
        path: SUPERADMIN_ROUTES.smartCharging,
        roles: ['SuperAdmin'],
      },
      {
        id: 'local-auth-list',
        text: 'Local Auth List',
        icon: <VpnKeyIcon />,
        path: SUPERADMIN_ROUTES.localAuth,
        roles: ['SuperAdmin'],
      },
    ],
  },
];

/**
 * Admin/Vendor Menu Configuration
 * Operations-focused with vendor management
 */
export const adminMenuConfig: MenuSection[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    collapsible: false,
    defaultExpanded: true,
    items: [
      {
        id: 'my-dashboard',
        text: 'My Dashboard',
        icon: <DashboardIcon />,
        path: ADMIN_ROUTES.dashboard,
        roles: ['Admin'],
      },
    ],
  },
  {
    id: 'operations',
    title: 'Operations',
    icon: <CableIcon />,
    collapsible: true,
    defaultExpanded: true,
    items: [
      {
        id: 'ops-dashboard',
        text: 'Operations Dashboard',
        icon: <DashboardIcon />,
        path: ADMIN_ROUTES.ops,
        roles: ['Admin'],
      },
      {
        id: 'sessions',
        text: 'Charging Sessions',
        icon: <HistoryIcon />,
        path: ADMIN_ROUTES.opsSessions,
        roles: ['Admin'],
      },
      {
        id: 'devices',
        text: 'Device Management',
        icon: <EvStationIcon />,
        path: ADMIN_ROUTES.opsDevices,
        roles: ['Admin'],
      },
    ],
  },
  {
    id: 'vendor-settings',
    title: 'Vendor Settings',
    icon: <BusinessIcon />,
    collapsible: true,
    defaultExpanded: false,
    items: [
      {
        id: 'vendor-profile',
        text: 'Vendor Profile',
        icon: <BusinessIcon />,
        path: ADMIN_ROUTES.vendorPortal,
        roles: ['Admin'],
      },
      {
        id: 'tariffs-pricing',
        text: 'Tariffs & Pricing',
        icon: <AttachMoneyIcon />,
        path: ADMIN_ROUTES.tariffs,
        roles: ['Admin'],
      },
    ],
  },
  {
    id: 'financial',
    title: 'Financial',
    icon: <AttachMoneyIcon />,
    collapsible: true,
    defaultExpanded: false,
    items: [
      {
        id: 'wallet-management',
        text: 'Wallet Management',
        icon: <AccountBalanceWalletIcon />,
        path: ADMIN_ROUTES.wallets,
        roles: ['Admin'],
      },
      {
        id: 'payment-history',
        text: 'Payment History',
        icon: <PaymentIcon />,
        path: ADMIN_ROUTES.payments,
        roles: ['Admin'],
      },
      {
        id: 'revenue-reports',
        text: 'Revenue Reports',
        icon: <AssessmentIcon />,
        path: ADMIN_ROUTES.reports,
        roles: ['Admin'],
      },
    ],
  },
  {
    id: 'users-access',
    title: 'Users & Access',
    icon: <PeopleIcon />,
    collapsible: true,
    defaultExpanded: false,
    items: [
      {
        id: 'user-management',
        text: 'User Management',
        icon: <PeopleIcon />,
        path: ADMIN_ROUTES.users,
        roles: ['Admin'],
      },
    ],
  },
];

/**
 * Bottom navigation items for mobile/tablet (native app feel)
 */
export const customerBottomNavItems = [
  {
    id: 'stations',
    label: 'Stations',
    icon: <LocationOnIcon />,
    path: CUSTOMER_ROUTES.stations,
    matchPaths: [...CUSTOMER_BOTTOM_NAV_PREFIXES.stations],
  },
  {
    id: 'charging',
    label: 'Charging',
    icon: <EvStationIcon />,
    path: CUSTOMER_ROUTES.charging,
    matchPaths: [...CUSTOMER_BOTTOM_NAV_PREFIXES.sessions],
  },
  {
    id: 'wallet',
    label: 'Wallet',
    icon: <AccountBalanceWalletIcon />,
    path: CUSTOMER_ROUTES.wallet,
    matchPaths: [...CUSTOMER_BOTTOM_NAV_PREFIXES.wallet],
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: <AccountCircleIcon />,
    path: CUSTOMER_ROUTES.profile,
    matchPaths: [...CUSTOMER_BOTTOM_NAV_PREFIXES.profile],
  },
];

export const adminBottomNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, path: ADMIN_ROUTES.dashboard },
  {
    id: 'devices',
    label: 'Devices',
    icon: <EvStationIcon />,
    path: ADMIN_ROUTES.opsDevices,
    matchPaths: [ADMIN_ROUTES.opsDevices, `${ADMIN_ROUTES.opsDevices}/`],
  },
  {
    id: 'sessions',
    label: 'Sessions',
    icon: <HistoryIcon />,
    path: ADMIN_ROUTES.opsSessions,
    matchPaths: [ADMIN_ROUTES.opsSessions],
  },
  { id: 'wallets', label: 'Wallets', icon: <AccountBalanceWalletIcon />, path: ADMIN_ROUTES.wallets },
  { id: 'reports', label: 'Reports', icon: <AssessmentIcon />, path: ADMIN_ROUTES.reports },
];

export const superAdminBottomNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, path: SUPERADMIN_ROUTES.dashboard },
  {
    id: 'ops',
    label: 'Operations',
    icon: <CableIcon />,
    path: SUPERADMIN_ROUTES.ops,
    matchPaths: [SUPERADMIN_ROUTES.ops],
  },
  {
    id: 'devices',
    label: 'Devices',
    icon: <EvStationIcon />,
    path: SUPERADMIN_ROUTES.opsDevices,
    matchPaths: [SUPERADMIN_ROUTES.opsDevices],
  },
  { id: 'reports', label: 'Reports', icon: <AssessmentIcon />, path: SUPERADMIN_ROUTES.reports },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon />, path: SUPERADMIN_ROUTES.settings },
];

export const mainLayoutBottomNavItems = [
  { id: 'home', label: 'Home', icon: <HomeIcon />, path: '/' },
  {
    id: 'stations',
    label: 'Find Stations',
    icon: <LocationOnIcon />,
    path: CUSTOMER_ROUTES.stations,
    matchPaths: [...CUSTOMER_BOTTOM_NAV_PREFIXES.stations],
  },
  { id: 'login', label: 'Login', icon: <LoginIcon />, path: '/login' },
];

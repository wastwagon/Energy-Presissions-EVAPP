/**
 * Menu configuration: admin/superadmin drawer sections and shared bottom-nav item lists.
 *
 * Customer tab bar labels live in `customerBottomNavItems` (Map, Charge, Wallet, Account).
 * Secondary Account rows live in `customerDrawerNav.tsx`.
 */

import DashboardIcon from '@mui/icons-material/Dashboard';
import EvStationIcon from '@mui/icons-material/EvStation';
import EvStationOutlinedIcon from '@mui/icons-material/EvStationOutlined';
import HistoryIcon from '@mui/icons-material/History';
import BusinessIcon from '@mui/icons-material/Business';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
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
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import PersonIcon from '@mui/icons-material/Person';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import MemoryIcon from '@mui/icons-material/Memory';
import CableIcon from '@mui/icons-material/Cable';
import SpeedIcon from '@mui/icons-material/Speed';
import HomeIcon from '@mui/icons-material/Home';
import LoginIcon from '@mui/icons-material/Login';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
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
    id: 'dashboard-operations',
    title: 'Dashboard & operations',
    icon: <CableIcon />,
    collapsible: true,
    defaultExpanded: true,
    items: [
      {
        id: 'dashboard',
        text: 'Dashboard',
        icon: <DashboardIcon />,
        path: SUPERADMIN_ROUTES.dashboard,
        shortcut: 'G D',
        roles: ['SuperAdmin'],
      },
      {
        id: 'analytics',
        text: 'System Analytics',
        icon: <TrendingUpIcon />,
        path: SUPERADMIN_ROUTES.analytics,
        shortcut: 'G A',
        activeOnlyWithoutSearch: true,
        roles: ['SuperAdmin'],
      },
      {
        id: 'ops-dashboard',
        text: 'Operations Dashboard',
        icon: <SpeedIcon />,
        path: SUPERADMIN_ROUTES.ops,
        shortcut: 'G O',
        roles: ['SuperAdmin'],
      },
      {
        id: 'sessions',
        text: 'Charging Sessions',
        icon: <HistoryIcon />,
        path: SUPERADMIN_ROUTES.opsSessions,
        shortcut: 'G S',
        roles: ['SuperAdmin'],
      },
      {
        id: 'devices',
        text: 'Device Management',
        icon: <EvStationIcon />,
        path: SUPERADMIN_ROUTES.opsDevices,
        shortcut: 'G E',
        roles: ['SuperAdmin'],
      },
      {
        id: 'connection-logs',
        text: 'Connection Logs',
        icon: <StorageIcon />,
        path: SUPERADMIN_ROUTES.connectionLogs,
        shortcut: 'G L',
        roles: ['SuperAdmin'],
      },
    ],
  },
  {
    id: 'vendor-management',
    title: 'Vendors',
    icon: <BusinessIcon />,
    collapsible: true,
    defaultExpanded: false,
    items: [
      {
        id: 'all-vendors',
        text: 'All Vendors',
        icon: <BusinessIcon />,
        path: SUPERADMIN_ROUTES.vendors,
        shortcut: 'G V',
        roles: ['SuperAdmin'],
      },
      {
        id: 'vendor-settings',
        text: 'Vendor Settings',
        icon: <SettingsIcon />,
        path: SUPERADMIN_ROUTES.vendor,
        shortcut: 'G N',
        roles: ['SuperAdmin'],
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
        path: SUPERADMIN_ROUTES.wallets,
        shortcut: 'G W',
        roles: ['SuperAdmin'],
      },
      {
        id: 'payment-processing',
        text: 'Payment Processing',
        icon: <PaymentIcon />,
        path: SUPERADMIN_ROUTES.payments,
        shortcut: 'G P',
        roles: ['SuperAdmin'],
      },
      {
        id: 'reports',
        text: 'Reports',
        icon: <AssessmentIcon />,
        path: SUPERADMIN_ROUTES.reports,
        shortcut: 'G R',
        roles: ['SuperAdmin'],
      },
      {
        id: 'billing-invoices',
        text: 'Billing & Invoices',
        icon: <ReceiptIcon />,
        path: SUPERADMIN_ROUTES.billing,
        shortcut: 'G B',
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
        shortcut: 'G I',
        roles: ['SuperAdmin'],
      },
      {
        id: 'user-management',
        text: 'User Management',
        icon: <PeopleIcon />,
        path: SUPERADMIN_ROUTES.users,
        shortcut: 'G U',
        roles: ['SuperAdmin'],
      },
      {
        id: 'security-logs',
        text: 'Security & Logs',
        icon: <SecurityIcon />,
        path: SUPERADMIN_ROUTES.security,
        shortcut: 'G X',
        roles: ['SuperAdmin'],
      },
      {
        id: 'system-health',
        text: 'System Health',
        icon: <MemoryIcon />,
        path: SUPERADMIN_ROUTES.health,
        shortcut: 'G Y',
        roles: ['SuperAdmin'],
      },
      {
        id: 'operator-guide',
        text: 'Operator guide',
        icon: <HelpOutlineIcon />,
        path: SUPERADMIN_ROUTES.help,
        shortcut: 'G H',
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
        shortcut: 'G T',
        roles: ['SuperAdmin'],
      },
      {
        id: 'reservations',
        text: 'Reservations',
        icon: <ScheduleIcon />,
        path: SUPERADMIN_ROUTES.reservations,
        shortcut: 'G M',
        roles: ['SuperAdmin'],
      },
      {
        id: 'firmware',
        text: 'Firmware Management',
        icon: <CloudUploadIcon />,
        path: SUPERADMIN_ROUTES.firmware,
        shortcut: 'G F',
        roles: ['SuperAdmin'],
      },
      {
        id: 'diagnostics',
        text: 'Diagnostics',
        icon: <BugReportIcon />,
        path: SUPERADMIN_ROUTES.diagnostics,
        shortcut: 'G J',
        roles: ['SuperAdmin'],
      },
      {
        id: 'smart-charging',
        text: 'Smart Charging',
        icon: <SpeedIcon />,
        path: SUPERADMIN_ROUTES.smartCharging,
        shortcut: 'G C',
        roles: ['SuperAdmin'],
      },
      {
        id: 'local-auth-list',
        text: 'Local Auth List',
        icon: <VpnKeyIcon />,
        path: SUPERADMIN_ROUTES.localAuth,
        shortcut: 'G 1',
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
    id: 'operations',
    title: 'Operations',
    icon: <CableIcon />,
    collapsible: true,
    defaultExpanded: true,
    items: [
      {
        id: 'dashboard',
        text: 'Dashboard',
        icon: <DashboardIcon />,
        path: ADMIN_ROUTES.dashboard,
        shortcut: 'G D',
        roles: ['Admin'],
      },
      {
        id: 'analytics',
        text: 'Analytics',
        icon: <TrendingUpIcon />,
        path: ADMIN_ROUTES.analytics,
        shortcut: 'G A',
        roles: ['Admin'],
      },
      {
        id: 'ops-dashboard',
        text: 'Operations Dashboard',
        icon: <SpeedIcon />,
        path: ADMIN_ROUTES.ops,
        shortcut: 'G O',
        roles: ['Admin'],
      },
      {
        id: 'sessions',
        text: 'Charging Sessions',
        icon: <HistoryIcon />,
        path: ADMIN_ROUTES.opsSessions,
        shortcut: 'G S',
        roles: ['Admin'],
      },
      {
        id: 'devices',
        text: 'Device Management',
        icon: <EvStationIcon />,
        path: ADMIN_ROUTES.opsDevices,
        shortcut: 'G E',
        roles: ['Admin'],
      },
    ],
  },
  {
    id: 'business',
    title: 'Business',
    icon: <BusinessIcon />,
    collapsible: true,
    defaultExpanded: false,
    items: [
      {
        id: 'vendor-settings',
        text: 'Vendor settings',
        icon: <SettingsIcon />,
        path: ADMIN_ROUTES.vendorSettings,
        shortcut: 'G V',
        roles: ['Admin'],
      },
    ],
  },
  {
    id: 'finance-users',
    title: 'Reports',
    icon: <AccountBalanceWalletIcon />,
    collapsible: true,
    defaultExpanded: false,
    items: [
      {
        id: 'reports',
        text: 'Reports',
        icon: <AssessmentIcon />,
        path: ADMIN_ROUTES.reports,
        shortcut: 'G R',
        roles: ['Admin'],
      },
      {
        id: 'billing-invoices',
        text: 'Billing & Invoices',
        icon: <ReceiptIcon />,
        path: ADMIN_ROUTES.billing,
        shortcut: 'G B',
        roles: ['Admin'],
      },
      {
        id: 'operator-guide',
        text: 'Operator guide',
        icon: <HelpOutlineIcon />,
        path: ADMIN_ROUTES.help,
        shortcut: 'G H',
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
    label: 'Map',
    icon: <LocationOnOutlinedIcon />,
    activeIcon: <LocationOnIcon />,
    path: CUSTOMER_ROUTES.stations,
    matchPaths: [...CUSTOMER_BOTTOM_NAV_PREFIXES.stations],
  },
  {
    id: 'charging',
    label: 'Charge',
    icon: <EvStationOutlinedIcon />,
    activeIcon: <EvStationIcon />,
    path: CUSTOMER_ROUTES.charging,
    matchPaths: [...CUSTOMER_BOTTOM_NAV_PREFIXES.sessions],
  },
  {
    id: 'wallet',
    label: 'Wallet',
    icon: <AccountBalanceWalletOutlinedIcon />,
    activeIcon: <AccountBalanceWalletIcon />,
    path: CUSTOMER_ROUTES.wallet,
    matchPaths: [...CUSTOMER_BOTTOM_NAV_PREFIXES.wallet],
  },
  {
    id: 'profile',
    label: 'Account',
    icon: <PersonOutlineIcon />,
    activeIcon: <PersonIcon />,
    path: CUSTOMER_ROUTES.profile,
    matchPaths: [...CUSTOMER_BOTTOM_NAV_PREFIXES.profile],
  },
];

export const adminBottomNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, path: ADMIN_ROUTES.dashboard },
  {
    id: 'ops',
    label: 'Operations',
    icon: <CableIcon />,
    path: ADMIN_ROUTES.ops,
    matchPaths: [ADMIN_ROUTES.ops],
  },
  {
    id: 'sessions',
    label: 'Sessions',
    icon: <HistoryIcon />,
    path: ADMIN_ROUTES.opsSessions,
    matchPaths: [ADMIN_ROUTES.opsSessions],
  },
  {
    id: 'devices',
    label: 'Devices',
    icon: <EvStationIcon />,
    path: ADMIN_ROUTES.opsDevices,
    matchPaths: [ADMIN_ROUTES.opsDevices, `${ADMIN_ROUTES.opsDevices}/`],
  },
];

/** Mobile nav when focused on the vendor portal (`/vendor`). */
export const vendorBottomNavItems = [
  { id: 'home', label: 'Home', icon: <DashboardIcon />, path: ADMIN_ROUTES.vendorPortal },
  {
    id: 'ops',
    label: 'Operations',
    icon: <CableIcon />,
    path: ADMIN_ROUTES.ops,
    matchPaths: [ADMIN_ROUTES.ops],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <SettingsIcon />,
    path: ADMIN_ROUTES.vendorSettings,
    matchPaths: [ADMIN_ROUTES.vendorSettings],
  },
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
    id: 'sessions',
    label: 'Sessions',
    icon: <HistoryIcon />,
    path: SUPERADMIN_ROUTES.opsSessions,
    matchPaths: [SUPERADMIN_ROUTES.opsSessions],
  },
  {
    id: 'devices',
    label: 'Devices',
    icon: <EvStationIcon />,
    path: SUPERADMIN_ROUTES.opsDevices,
    matchPaths: [SUPERADMIN_ROUTES.opsDevices, `${SUPERADMIN_ROUTES.opsDevices}/`],
  },
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

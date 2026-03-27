/**
 * Menu Configuration
 * Centralized menu definitions for all user roles
 * Maps database features to menu items
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
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import HelpIcon from '@mui/icons-material/Help';
import DescriptionIcon from '@mui/icons-material/Description';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import BarChartIcon from '@mui/icons-material/BarChart';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import MemoryIcon from '@mui/icons-material/Memory';
import CableIcon from '@mui/icons-material/Cable';
import SpeedIcon from '@mui/icons-material/Speed';
import HomeIcon from '@mui/icons-material/Home';
import LoginIcon from '@mui/icons-material/Login';

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
        path: '/superadmin/dashboard',
        roles: ['SuperAdmin'],
      },
      {
        id: 'analytics',
        text: 'System Analytics',
        icon: <TrendingUpIcon />,
        path: '/superadmin/analytics',
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
        path: '/superadmin/ops',
        roles: ['SuperAdmin'],
      },
      {
        id: 'sessions',
        text: 'Charging Sessions',
        icon: <HistoryIcon />,
        path: '/superadmin/ops/sessions',
        roles: ['SuperAdmin'],
      },
      {
        id: 'devices',
        text: 'Device Management',
        icon: <EvStationIcon />,
        path: '/superadmin/ops/devices',
        roles: ['SuperAdmin'],
      },
      {
        id: 'connection-logs',
        text: 'Connection Logs',
        icon: <StorageIcon />,
        path: '/superadmin/connection-logs',
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
        path: '/superadmin/vendors',
        roles: ['SuperAdmin'],
      },
      {
        id: 'vendor-settings',
        text: 'Vendor Settings',
        icon: <SettingsIcon />,
        path: '/superadmin/vendor',
        roles: ['SuperAdmin'],
      },
      {
        id: 'vendor-analytics',
        text: 'Vendor Analytics',
        icon: <BarChartIcon />,
        path: '/superadmin/analytics?scope=vendor',
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
        path: '/superadmin/wallets',
        roles: ['SuperAdmin'],
      },
      {
        id: 'payment-processing',
        text: 'Payment Processing',
        icon: <PaymentIcon />,
        path: '/superadmin/payments',
        roles: ['SuperAdmin'],
      },
      {
        id: 'revenue-reports',
        text: 'Revenue Reports',
        icon: <AssessmentIcon />,
        path: '/superadmin/reports',
        roles: ['SuperAdmin'],
      },
      {
        id: 'billing-invoices',
        text: 'Billing & Invoices',
        icon: <ReceiptIcon />,
        path: '/superadmin/billing',
        roles: ['SuperAdmin'],
      },
      {
        id: 'billing-settings',
        text: 'Billing Settings',
        icon: <CreditCardIcon />,
        path: '/superadmin/settings',
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
        path: '/superadmin/settings',
        roles: ['SuperAdmin'],
      },
      {
        id: 'user-management',
        text: 'User Management',
        icon: <PeopleIcon />,
        path: '/superadmin/users',
        roles: ['SuperAdmin'],
      },
      {
        id: 'security-logs',
        text: 'Security & Logs',
        icon: <SecurityIcon />,
        path: '/superadmin/security',
        roles: ['SuperAdmin'],
      },
      {
        id: 'system-health',
        text: 'System Health',
        icon: <MemoryIcon />,
        path: '/superadmin/health',
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
        path: '/superadmin/tariffs',
        roles: ['SuperAdmin'],
      },
      {
        id: 'reservations',
        text: 'Reservations',
        icon: <ScheduleIcon />,
        path: '/superadmin/reservations',
        roles: ['SuperAdmin'],
      },
      {
        id: 'firmware',
        text: 'Firmware Management',
        icon: <CloudUploadIcon />,
        path: '/superadmin/firmware',
        roles: ['SuperAdmin'],
      },
      {
        id: 'diagnostics',
        text: 'Diagnostics',
        icon: <BugReportIcon />,
        path: '/superadmin/diagnostics',
        roles: ['SuperAdmin'],
      },
      {
        id: 'smart-charging',
        text: 'Smart Charging',
        icon: <SpeedIcon />,
        path: '/superadmin/smart-charging',
        roles: ['SuperAdmin'],
      },
      {
        id: 'local-auth-list',
        text: 'Local Auth List',
        icon: <VpnKeyIcon />,
        path: '/superadmin/local-auth',
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
        path: '/admin/dashboard',
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
        path: '/admin/ops',
        roles: ['Admin'],
      },
      {
        id: 'sessions',
        text: 'Charging Sessions',
        icon: <HistoryIcon />,
        path: '/admin/ops/sessions',
        roles: ['Admin'],
      },
      {
        id: 'devices',
        text: 'Device Management',
        icon: <EvStationIcon />,
        path: '/admin/ops/devices',
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
        path: '/vendor',
        roles: ['Admin'],
      },
      {
        id: 'tariffs-pricing',
        text: 'Tariffs & Pricing',
        icon: <AttachMoneyIcon />,
        path: '/admin/tariffs',
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
        path: '/admin/wallets',
        roles: ['Admin'],
      },
      {
        id: 'payment-history',
        text: 'Payment History',
        icon: <PaymentIcon />,
        path: '/admin/payments',
        roles: ['Admin'],
      },
      {
        id: 'revenue-reports',
        text: 'Revenue Reports',
        icon: <AssessmentIcon />,
        path: '/admin/reports',
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
        path: '/admin/users',
        roles: ['Admin'],
      },
      {
        id: 'access-control',
        text: 'Access Control',
        icon: <SecurityIcon />,
        path: '/admin/access',
        disabled: true, // TODO: Create access control page
        roles: ['Admin'],
      },
      {
        id: 'team-members',
        text: 'Team Members',
        icon: <PeopleIcon />,
        path: '/admin/team',
        disabled: true, // TODO: Create team members page
        roles: ['Admin'],
      },
    ],
  },
];

/**
 * Customer Menu Configuration
 * Personal dashboard with charging and wallet features
 */
export const customerMenuConfig: MenuSection[] = [
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
        path: '/user/dashboard',
        roles: ['Customer', 'WalkIn'],
      },
      {
        id: 'find-stations',
        text: 'Find Stations',
        icon: <LocationOnIcon />,
        path: '/stations',
        roles: ['Customer', 'WalkIn'],
      },
    ],
  },
  {
    id: 'charging',
    title: 'Charging',
    icon: <EvStationIcon />,
    collapsible: true,
    defaultExpanded: true,
    items: [
      {
        id: 'active-sessions',
        text: 'Active Sessions',
        icon: <HistoryIcon />,
        path: '/user/sessions/active',
        roles: ['Customer', 'WalkIn'],
      },
      {
        id: 'session-history',
        text: 'Session History',
        icon: <ReceiptIcon />,
        path: '/user/sessions/history',
        roles: ['Customer', 'WalkIn'],
      },
      {
        id: 'favorite-stations',
        text: 'Favorite Stations',
        icon: <LocationOnIcon />,
        path: '/user/favorites',
        roles: ['Customer', 'WalkIn'],
      },
      {
        id: 'saved-locations',
        text: 'Saved Locations',
        icon: <LocationOnIcon />,
        path: '/user/locations',
        disabled: true, // TODO: Create saved locations page
        roles: ['Customer', 'WalkIn'],
      },
    ],
  },
  {
    id: 'wallet-payments',
    title: 'Wallet & Payments',
    icon: <AccountBalanceWalletIcon />,
    collapsible: true,
    defaultExpanded: false,
    items: [
      {
        id: 'wallet-balance',
        text: 'Wallet Balance',
        icon: <AccountBalanceWalletIcon />,
        path: '/user/wallet',
        roles: ['Customer', 'WalkIn'],
      },
      {
        id: 'top-up',
        text: 'Top Up Wallet',
        icon: <LocalAtmIcon />,
        path: '/user/wallet/top-up',
        roles: ['Customer', 'WalkIn'],
      },
      {
        id: 'payment-history',
        text: 'Payment History',
        icon: <PaymentIcon />,
        path: '/user/payments',
        roles: ['Customer', 'WalkIn'],
      },
      {
        id: 'payment-methods',
        text: 'Payment Methods',
        icon: <CreditCardIcon />,
        path: '/user/payment-methods',
        roles: ['Customer', 'WalkIn'],
      },
    ],
  },
  {
    id: 'account',
    title: 'Account',
    icon: <AccountCircleIcon />,
    collapsible: true,
    defaultExpanded: false,
    items: [
      {
        id: 'profile',
        text: 'Profile Settings',
        icon: <AccountCircleIcon />,
        path: '/user/profile',
        roles: ['Customer', 'WalkIn'],
      },
      {
        id: 'preferences',
        text: 'Preferences',
        icon: <SettingsIcon />,
        path: '/user/preferences',
        roles: ['Customer', 'WalkIn'],
      },
      {
        id: 'notifications',
        text: 'Notifications',
        icon: <NotificationsIcon />,
        path: '/user/notifications',
        disabled: true, // TODO: Create notifications page
        roles: ['Customer', 'WalkIn'],
      },
      {
        id: 'help',
        text: 'Help & Support',
        icon: <HelpIcon />,
        path: '/user/help',
        roles: ['Customer', 'WalkIn'],
      },
    ],
  },
];

/**
 * Bottom navigation items for mobile/tablet (native app feel)
 */
export const customerBottomNavItems = [
  { id: 'dashboard', label: 'Home', icon: <DashboardIcon />, path: '/user/dashboard' },
  { id: 'stations', label: 'Stations', icon: <LocationOnIcon />, path: '/stations', matchPaths: ['/stations'] },
  { id: 'sessions', label: 'Sessions', icon: <HistoryIcon />, path: '/user/sessions/active', matchPaths: ['/user/sessions'] },
  { id: 'wallet', label: 'Wallet', icon: <AccountBalanceWalletIcon />, path: '/user/wallet', matchPaths: ['/user/wallet', '/user/payments'] },
  { id: 'profile', label: 'Profile', icon: <AccountCircleIcon />, path: '/user/profile', matchPaths: ['/user/profile', '/user/preferences', '/user/help'] },
];

export const adminBottomNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
  { id: 'devices', label: 'Devices', icon: <EvStationIcon />, path: '/admin/ops/devices', matchPaths: ['/admin/ops/devices', '/admin/ops/devices/'] },
  { id: 'sessions', label: 'Sessions', icon: <HistoryIcon />, path: '/admin/ops/sessions', matchPaths: ['/admin/ops/sessions'] },
  { id: 'wallets', label: 'Wallets', icon: <AccountBalanceWalletIcon />, path: '/admin/wallets' },
  { id: 'reports', label: 'Reports', icon: <AssessmentIcon />, path: '/admin/reports' },
];

export const superAdminBottomNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, path: '/superadmin/dashboard' },
  { id: 'ops', label: 'Operations', icon: <CableIcon />, path: '/superadmin/ops', matchPaths: ['/superadmin/ops'] },
  { id: 'devices', label: 'Devices', icon: <EvStationIcon />, path: '/superadmin/ops/devices', matchPaths: ['/superadmin/ops/devices'] },
  { id: 'reports', label: 'Reports', icon: <AssessmentIcon />, path: '/superadmin/reports' },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon />, path: '/superadmin/settings' },
];

export const mainLayoutBottomNavItems = [
  { id: 'home', label: 'Home', icon: <HomeIcon />, path: '/' },
  { id: 'stations', label: 'Find Stations', icon: <LocationOnIcon />, path: '/stations', matchPaths: ['/stations'] },
  { id: 'login', label: 'Login', icon: <LoginIcon />, path: '/login' },
];

/**
 * Get menu configuration for a role
 */
export function getMenuConfig(role: string): MenuSection[] {
  switch (role) {
    case 'SuperAdmin':
      return superAdminMenuConfig;
    case 'Admin':
      return adminMenuConfig;
    case 'Customer':
    case 'WalkIn':
      return customerMenuConfig;
    default:
      return [];
  }
}

/**
 * Get all menu items flattened (for search)
 */
export function getAllMenuItems(role: string): MenuItem[] {
  const config = getMenuConfig(role);
  const items: MenuItem[] = [];
  
  config.forEach((section) => {
    section.items.forEach((item) => {
      items.push(item);
      if (item.children) {
        items.push(...item.children);
      }
    });
  });
  
  return items;
}


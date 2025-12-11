import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { CustomerDashboardLayout } from './layouts/CustomerDashboardLayout';
import { AdminDashboardLayout } from './layouts/AdminDashboardLayout';
import { SuperAdminDashboardLayout } from './layouts/SuperAdminDashboardLayout';
import { HomePage } from './pages/HomePage';
import { StationsPage } from './pages/StationsPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { WalletManagementPage } from './pages/admin/WalletManagementPage';
import { VendorManagementPage } from './pages/admin/VendorManagementPage';
import { SuspendedPage } from './pages/vendor/SuspendedPage';
import { DisabledPage } from './pages/vendor/DisabledPage';
import { useVendorStatus } from './hooks/useVendorStatus';
import { OperationsDashboard } from './pages/ops/OperationsDashboard';
import { SessionsPage } from './pages/ops/SessionsPage';
import { DevicesPage } from './pages/ops/DevicesPage';
import { ChargePointDetailPage } from './pages/ops/ChargePointDetailPage';
import { TransactionDetailPage } from './pages/ops/TransactionDetailPage';
import { LoginPage } from './pages/auth/LoginPage';
import { SuperAdminLoginPage } from './pages/auth/SuperAdminLoginPage';
import { AdminLoginPage } from './pages/auth/AdminLoginPage';
import { UserLoginPage } from './pages/auth/UserLoginPage';
import { CustomerDashboardPage } from './pages/user/CustomerDashboardPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { VendorSettingsPage } from './pages/vendor/VendorSettingsPage';
import { AdminOperationsDashboard } from './pages/admin/AdminOperationsDashboard';
import { AdminSessionsPage } from './pages/admin/AdminSessionsPage';
import { AdminDevicesPage } from './pages/admin/AdminDevicesPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { SuperAdminOperationsDashboard } from './pages/superadmin/SuperAdminOperationsDashboard';
import { SuperAdminSessionsPage } from './pages/superadmin/SuperAdminSessionsPage';
import { SuperAdminDevicesPage } from './pages/superadmin/SuperAdminDevicesPage';
import { SuperAdminDashboardPage } from './pages/superadmin/SuperAdminDashboardPage';

// Component to check vendor status and redirect if needed
function VendorStatusGuard({ children }: { children: React.ReactNode }) {
  const { status, loading, isDisabled, isSuspended } = useVendorStatus();
  const location = useLocation();

  useEffect(() => {
    if (!loading && status) {
      // Don't redirect if already on suspended/disabled pages
      if (location.pathname === '/suspended' || location.pathname === '/disabled') {
        return;
      }

      if (isDisabled) {
        window.location.href = '/disabled';
      } else if (isSuspended) {
        // Allow read-only access, but could redirect to suspended page
        // For now, we'll allow access but show a banner
      }
    }
  }, [status, loading, isDisabled, isSuspended, location.pathname]);

  // Don't block rendering while loading - allow app to render normally
  // Vendor status check is non-blocking
  return <>{children}</>;
}

function App() {
  return (
    <VendorStatusGuard>
      <Routes>
        {/* Vendor status pages (no guard) */}
        <Route path="/suspended" element={<SuspendedPage />} />
        <Route path="/disabled" element={<DisabledPage />} />

        {/* Auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/super-admin" element={<SuperAdminLoginPage />} />
        <Route path="/login/admin" element={<AdminLoginPage />} />
        <Route path="/login/user" element={<UserLoginPage />} />
        <Route path="/login/vendor" element={<AdminLoginPage />} />
        <Route path="/register" element={<UserLoginPage />} />

        {/* Public routes */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="stations" element={<StationsPage />} />
        </Route>

            {/* User/Customer routes - Customer layout only - NO SHARING */}
            <Route path="/user" element={<CustomerDashboardLayout />}>
              <Route path="dashboard" element={<CustomerDashboardPage />} />
            </Route>

            {/* Admin routes - Admin layout - Admin-specific pages only */}
            <Route path="/admin" element={<AdminDashboardLayout />}>
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="ops" element={<AdminOperationsDashboard />} />
              <Route path="ops/sessions" element={<AdminSessionsPage />} />
              <Route path="ops/sessions/:id" element={<TransactionDetailPage />} />
              <Route path="ops/devices" element={<AdminDevicesPage />} />
              <Route path="ops/devices/:id" element={<ChargePointDetailPage />} />
              <Route path="wallets" element={<WalletManagementPage />} />
            </Route>

            {/* Vendor routes - Admin layout (for Admin users) */}
            <Route path="/vendor" element={<AdminDashboardLayout />}>
              <Route index element={<VendorSettingsPage />} />
            </Route>

            {/* SuperAdmin routes - SuperAdmin layout - SuperAdmin-specific pages only */}
            <Route path="/superadmin" element={<SuperAdminDashboardLayout />}>
              <Route path="dashboard" element={<SuperAdminDashboardPage />} />
              <Route path="ops" element={<SuperAdminOperationsDashboard />} />
              <Route path="ops/sessions" element={<SuperAdminSessionsPage />} />
              <Route path="ops/sessions/:id" element={<TransactionDetailPage />} />
              <Route path="ops/devices" element={<SuperAdminDevicesPage />} />
              <Route path="ops/devices/:id" element={<ChargePointDetailPage />} />
              <Route path="vendor" element={<VendorSettingsPage />} />
              <Route path="settings" element={<AdminDashboard />} />
              <Route path="wallets" element={<WalletManagementPage />} />
              <Route path="vendors" element={<VendorManagementPage />} />
              <Route path="users" element={<UserManagementPage />} />
            </Route>

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </VendorStatusGuard>
  );
}

export default App;


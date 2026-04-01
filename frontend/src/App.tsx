import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useVendorStatus } from './hooks/useVendorStatus';

const MainLayout = lazy(() =>
  import('./layouts/MainLayout').then((m) => ({ default: m.MainLayout })),
);
const CustomerDashboardLayout = lazy(() =>
  import('./layouts/CustomerDashboardLayout').then((m) => ({ default: m.CustomerDashboardLayout })),
);
const AdminDashboardLayout = lazy(() =>
  import('./layouts/AdminDashboardLayout').then((m) => ({ default: m.AdminDashboardLayout })),
);
const SuperAdminDashboardLayout = lazy(() =>
  import('./layouts/SuperAdminDashboardLayout').then((m) => ({ default: m.SuperAdminDashboardLayout })),
);
const HomePage = lazy(() =>
  import('./pages/HomePage').then((m) => ({ default: m.HomePage })),
);
const StationsPage = lazy(() =>
  import('./pages/StationsPage').then((m) => ({ default: m.StationsPage })),
);
const StationDetailPage = lazy(() =>
  import('./pages/StationDetailPage').then((m) => ({ default: m.StationDetailPage })),
);
const SuperAdminSettingsPage = lazy(() =>
  import('./pages/superadmin/SuperAdminSettingsPage').then((m) => ({ default: m.SuperAdminSettingsPage })),
);
const WalletManagementPage = lazy(() =>
  import('./pages/admin/WalletManagementPage').then((m) => ({ default: m.WalletManagementPage })),
);
const VendorManagementPage = lazy(() =>
  import('./pages/admin/VendorManagementPage').then((m) => ({ default: m.VendorManagementPage })),
);
const SuspendedPage = lazy(() =>
  import('./pages/vendor/SuspendedPage').then((m) => ({ default: m.SuspendedPage })),
);
const DisabledPage = lazy(() =>
  import('./pages/vendor/DisabledPage').then((m) => ({ default: m.DisabledPage })),
);
const OperationsDashboard = lazy(() =>
  import('./pages/ops/OperationsDashboard').then((m) => ({ default: m.OperationsDashboard })),
);
const SessionsPage = lazy(() =>
  import('./pages/ops/SessionsPage').then((m) => ({ default: m.SessionsPage })),
);
const DevicesPage = lazy(() =>
  import('./pages/ops/DevicesPage').then((m) => ({ default: m.DevicesPage })),
);
const ChargePointDetailPage = lazy(() =>
  import('./pages/ops/ChargePointDetailPage').then((m) => ({ default: m.ChargePointDetailPage })),
);
const TransactionDetailPage = lazy(() =>
  import('./pages/ops/TransactionDetailPage').then((m) => ({ default: m.TransactionDetailPage })),
);
const LoginPage = lazy(() =>
  import('./pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import('./pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })),
);
const ForgotPasswordPage = lazy(() =>
  import('./pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })),
);
const CustomerDashboardPage = lazy(() =>
  import('./pages/user/CustomerDashboardPage').then((m) => ({ default: m.CustomerDashboardPage })),
);
const CustomerActiveSessionsPage = lazy(() =>
  import('./pages/user/CustomerActiveSessionsPage').then((m) => ({ default: m.CustomerActiveSessionsPage })),
);
const CustomerSessionHistoryPage = lazy(() =>
  import('./pages/user/CustomerSessionHistoryPage').then((m) => ({ default: m.CustomerSessionHistoryPage })),
);
const CustomerWalletPage = lazy(() =>
  import('./pages/user/CustomerWalletPage').then((m) => ({ default: m.CustomerWalletPage })),
);
const CustomerTopUpPage = lazy(() =>
  import('./pages/user/CustomerTopUpPage').then((m) => ({ default: m.CustomerTopUpPage })),
);
const CustomerPaymentHistoryPage = lazy(() =>
  import('./pages/user/CustomerPaymentHistoryPage').then((m) => ({ default: m.CustomerPaymentHistoryPage })),
);
const CustomerProfilePage = lazy(() =>
  import('./pages/user/CustomerProfilePage').then((m) => ({ default: m.CustomerProfilePage })),
);
const CustomerTransactionDetailPage = lazy(() =>
  import('./pages/user/CustomerTransactionDetailPage').then((m) => ({ default: m.CustomerTransactionDetailPage })),
);
const CustomerFavoritesPage = lazy(() =>
  import('./pages/user/CustomerFavoritesPage').then((m) => ({ default: m.CustomerFavoritesPage })),
);
const CustomerHelpPage = lazy(() =>
  import('./pages/user/CustomerHelpPage').then((m) => ({ default: m.CustomerHelpPage })),
);
const CustomerPaymentMethodsPage = lazy(() =>
  import('./pages/user/CustomerPaymentMethodsPage').then((m) => ({ default: m.CustomerPaymentMethodsPage })),
);
const CustomerPreferencesPage = lazy(() =>
  import('./pages/user/CustomerPreferencesPage').then((m) => ({ default: m.CustomerPreferencesPage })),
);
const UserManagementPage = lazy(() =>
  import('./pages/admin/UserManagementPage').then((m) => ({ default: m.UserManagementPage })),
);
const VendorSettingsPage = lazy(() =>
  import('./pages/vendor/VendorSettingsPage').then((m) => ({ default: m.VendorSettingsPage })),
);
const AdminOperationsDashboard = lazy(() =>
  import('./pages/admin/AdminOperationsDashboard').then((m) => ({ default: m.AdminOperationsDashboard })),
);
const AdminSessionsPage = lazy(() =>
  import('./pages/admin/AdminSessionsPage').then((m) => ({ default: m.AdminSessionsPage })),
);
const AdminDevicesPage = lazy(() =>
  import('./pages/admin/AdminDevicesPage').then((m) => ({ default: m.AdminDevicesPage })),
);
const AdminDashboardPage = lazy(() =>
  import('./pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })),
);
const SuperAdminOperationsDashboard = lazy(() =>
  import('./pages/superadmin/SuperAdminOperationsDashboard').then((m) => ({ default: m.SuperAdminOperationsDashboard })),
);
const SuperAdminSessionsPage = lazy(() =>
  import('./pages/superadmin/SuperAdminSessionsPage').then((m) => ({ default: m.SuperAdminSessionsPage })),
);
const SuperAdminDevicesPage = lazy(() =>
  import('./pages/superadmin/SuperAdminDevicesPage').then((m) => ({ default: m.SuperAdminDevicesPage })),
);
const SuperAdminDashboardPage = lazy(() =>
  import('./pages/superadmin/SuperAdminDashboardPage').then((m) => ({ default: m.SuperAdminDashboardPage })),
);
const SuperAdminAnalyticsPage = lazy(() =>
  import('./pages/superadmin/SuperAdminAnalyticsPage').then((m) => ({ default: m.SuperAdminAnalyticsPage })),
);
const SuperAdminConnectionLogsPage = lazy(() =>
  import('./pages/superadmin/SuperAdminConnectionLogsPage').then((m) => ({ default: m.SuperAdminConnectionLogsPage })),
);
const SuperAdminTariffsPage = lazy(() =>
  import('./pages/superadmin/SuperAdminTariffsPage').then((m) => ({ default: m.SuperAdminTariffsPage })),
);
const SuperAdminReportsPage = lazy(() =>
  import('./pages/superadmin/SuperAdminReportsPage').then((m) => ({ default: m.SuperAdminReportsPage })),
);
const SuperAdminSecurityLogsPage = lazy(() =>
  import('./pages/superadmin/SuperAdminSecurityLogsPage').then((m) => ({ default: m.SuperAdminSecurityLogsPage })),
);
const SuperAdminHealthPage = lazy(() =>
  import('./pages/superadmin/SuperAdminHealthPage').then((m) => ({ default: m.SuperAdminHealthPage })),
);
const SuperAdminReservationsPage = lazy(() =>
  import('./pages/superadmin/SuperAdminReservationsPage').then((m) => ({ default: m.SuperAdminReservationsPage })),
);
const SuperAdminFirmwarePage = lazy(() =>
  import('./pages/superadmin/SuperAdminFirmwarePage').then((m) => ({ default: m.SuperAdminFirmwarePage })),
);
const SuperAdminDiagnosticsPage = lazy(() =>
  import('./pages/superadmin/SuperAdminDiagnosticsPage').then((m) => ({ default: m.SuperAdminDiagnosticsPage })),
);
const SuperAdminBillingPage = lazy(() =>
  import('./pages/superadmin/SuperAdminBillingPage').then((m) => ({ default: m.SuperAdminBillingPage })),
);
const SuperAdminSmartChargingPage = lazy(() =>
  import('./pages/superadmin/SuperAdminSmartChargingPage').then((m) => ({ default: m.SuperAdminSmartChargingPage })),
);
const SuperAdminLocalAuthPage = lazy(() =>
  import('./pages/superadmin/SuperAdminLocalAuthPage').then((m) => ({ default: m.SuperAdminLocalAuthPage })),
);
const AdminTariffsPage = lazy(() =>
  import('./pages/admin/AdminTariffsPage').then((m) => ({ default: m.AdminTariffsPage })),
);
const AdminPaymentsPage = lazy(() =>
  import('./pages/admin/AdminPaymentsPage').then((m) => ({ default: m.AdminPaymentsPage })),
);
const AdminReportsPage = lazy(() =>
  import('./pages/admin/AdminReportsPage').then((m) => ({ default: m.AdminReportsPage })),
);

function AppLoadingFallback() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        bgcolor: 'background.default',
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <CircularProgress size={32} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Loading dashboard...
        </Typography>
      </Box>
    </Box>
  );
}

function InAppLoadingFallback() {
  return (
    <Box
      sx={{
        minHeight: 320,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
      }}
    >
      <CircularProgress size={28} />
    </Box>
  );
}

function RouteSuspense({
  children,
  mode = 'in-app',
}: {
  children: React.ReactNode;
  mode?: 'full-page' | 'in-app';
}) {
  return (
    <Suspense fallback={mode === 'full-page' ? <AppLoadingFallback /> : <InAppLoadingFallback />}>
      {children}
    </Suspense>
  );
}

// Component to check vendor status and redirect if needed
function VendorStatusGuard({ children }: { children: React.ReactNode }) {
  const { status, loading, isDisabled, isSuspended } = useVendorStatus();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && status) {
      // Don't redirect if already on suspended/disabled pages
      if (location.pathname === '/suspended' || location.pathname === '/disabled') {
        return;
      }

      if (isDisabled) {
        navigate('/disabled', { replace: true });
      } else if (isSuspended) {
        // Allow read-only access, but could redirect to suspended page
        // For now, we'll allow access but show a banner
      }
    }
  }, [status, loading, isDisabled, isSuspended, location.pathname, navigate]);

  // Don't block rendering while loading - allow app to render normally
  // Vendor status check is non-blocking
  return <>{children}</>;
}

function App() {
  return (
    <VendorStatusGuard>
      <Routes>
        {/* Vendor status pages (no guard) */}
        <Route
          path="/suspended"
          element={
            <RouteSuspense mode="full-page">
              <SuspendedPage />
            </RouteSuspense>
          }
        />
        <Route
          path="/disabled"
          element={
            <RouteSuspense mode="full-page">
              <DisabledPage />
            </RouteSuspense>
          }
        />

        {/* Auth routes */}
        <Route
          path="/login"
          element={
            <RouteSuspense mode="full-page">
              <LoginPage />
            </RouteSuspense>
          }
        />
        <Route path="/login/super-admin" element={<Navigate to="/login" replace />} />
        <Route path="/login/admin" element={<Navigate to="/login" replace />} />
        <Route path="/login/user" element={<Navigate to="/login" replace />} />
        <Route path="/login/vendor" element={<Navigate to="/login" replace />} />
        <Route
          path="/register"
          element={
            <RouteSuspense mode="full-page">
              <RegisterPage />
            </RouteSuspense>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <RouteSuspense mode="full-page">
              <ForgotPasswordPage />
            </RouteSuspense>
          }
        />

        {/* Protected routes - require login */}
        <Route
          path="/"
          element={
            <RouteSuspense mode="full-page">
              <MainLayout />
            </RouteSuspense>
          }
        >
          <Route index element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } />
          <Route path="stations" element={
            <ProtectedRoute>
              <StationsPage />
            </ProtectedRoute>
          } />
          <Route path="stations/:id" element={
            <ProtectedRoute>
              <StationDetailPage />
            </ProtectedRoute>
          } />
        </Route>

            {/* User/Customer routes - Customer layout only - NO SHARING */}
            <Route
              path="/user"
              element={
                <RouteSuspense>
                  <ProtectedRoute allowedRoles={['Customer', 'WalkIn']}>
                    <CustomerDashboardLayout />
                  </ProtectedRoute>
                </RouteSuspense>
              }
            >
              <Route index element={<Navigate to="/user/dashboard" replace />} />
              <Route path="dashboard" element={<CustomerDashboardPage />} />
              <Route path="sessions/active" element={<CustomerActiveSessionsPage />} />
              <Route path="sessions/history" element={<CustomerSessionHistoryPage />} />
              <Route path="sessions/:id" element={<CustomerTransactionDetailPage />} />
              <Route path="favorites" element={<CustomerFavoritesPage />} />
              <Route path="wallet" element={<CustomerWalletPage />} />
              <Route path="wallet/top-up" element={<CustomerTopUpPage />} />
              <Route path="payments" element={<CustomerPaymentHistoryPage />} />
              <Route path="profile" element={<CustomerProfilePage />} />
              <Route path="help" element={<CustomerHelpPage />} />
              <Route path="payment-methods" element={<CustomerPaymentMethodsPage />} />
              <Route path="preferences" element={<CustomerPreferencesPage />} />
            </Route>

            {/* Admin routes - Admin layout - Admin-specific pages only */}
            <Route
              path="/admin"
              element={
                <RouteSuspense>
                  <ProtectedRoute allowedRoles={['Admin', 'SuperAdmin']}>
                    <AdminDashboardLayout />
                  </ProtectedRoute>
                </RouteSuspense>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="ops" element={<AdminOperationsDashboard />} />
              <Route path="ops/sessions" element={<AdminSessionsPage />} />
              <Route path="ops/sessions/:id" element={<TransactionDetailPage />} />
              <Route path="ops/devices" element={<AdminDevicesPage />} />
              <Route path="ops/devices/:id" element={<ChargePointDetailPage />} />
              <Route path="wallets" element={<WalletManagementPage />} />
              <Route path="tariffs" element={<AdminTariffsPage />} />
              <Route path="payments" element={<AdminPaymentsPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="users" element={<UserManagementPage />} />
            </Route>

            {/* Vendor routes - Admin layout (for Admin users) */}
            <Route
              path="/vendor"
              element={
                <RouteSuspense>
                  <ProtectedRoute allowedRoles={['Admin', 'SuperAdmin']}>
                    <AdminDashboardLayout />
                  </ProtectedRoute>
                </RouteSuspense>
              }
            >
              <Route index element={<VendorSettingsPage />} />
            </Route>

            {/* SuperAdmin routes - SuperAdmin layout - SuperAdmin-specific pages only */}
            <Route
              path="/superadmin"
              element={
                <RouteSuspense>
                  <ProtectedRoute allowedRoles={['SuperAdmin']}>
                    <SuperAdminDashboardLayout />
                  </ProtectedRoute>
                </RouteSuspense>
              }
            >
              <Route index element={<Navigate to="/superadmin/dashboard" replace />} />
              <Route path="dashboard" element={<SuperAdminDashboardPage />} />
              <Route path="ops" element={<SuperAdminOperationsDashboard />} />
              <Route path="ops/sessions" element={<SuperAdminSessionsPage />} />
              <Route path="ops/sessions/:id" element={<TransactionDetailPage />} />
              <Route path="ops/devices" element={<SuperAdminDevicesPage />} />
              <Route path="ops/devices/:id" element={<ChargePointDetailPage />} />
              <Route path="vendor" element={<VendorSettingsPage />} />
              <Route path="settings" element={<SuperAdminSettingsPage />} />
              <Route path="wallets" element={<WalletManagementPage />} />
              <Route path="vendors" element={<VendorManagementPage />} />
              <Route path="users" element={<UserManagementPage />} />
              <Route path="analytics" element={<SuperAdminAnalyticsPage />} />
              <Route path="connection-logs" element={<SuperAdminConnectionLogsPage />} />
              <Route path="tariffs" element={<SuperAdminTariffsPage />} />
              <Route path="reports" element={<SuperAdminReportsPage />} />
              <Route path="payments" element={<AdminPaymentsPage />} />
              <Route path="security" element={<SuperAdminSecurityLogsPage />} />
              <Route path="health" element={<SuperAdminHealthPage />} />
              <Route path="reservations" element={<SuperAdminReservationsPage />} />
              <Route path="firmware" element={<SuperAdminFirmwarePage />} />
              <Route path="diagnostics" element={<SuperAdminDiagnosticsPage />} />
              <Route path="billing" element={<SuperAdminBillingPage />} />
              <Route path="smart-charging" element={<SuperAdminSmartChargingPage />} />
              <Route path="local-auth" element={<SuperAdminLocalAuthPage />} />
            </Route>

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </VendorStatusGuard>
  );
}

export default App;


import { Navigate, useLocation } from 'react-router-dom';
import {
  getDashboardPathForAccountType,
  getStoredUser,
  hasValidSession,
} from '../utils/authSession';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const user = getStoredUser();
  const isAuthenticated = hasValidSession();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && user?.accountType) {
    if (!allowedRoles.includes(user.accountType)) {
      return <Navigate to={getDashboardPathForAccountType(user.accountType)} replace />;
    }
  }

  return <>{children}</>;
}

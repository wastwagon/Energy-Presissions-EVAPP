import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        setIsAuthenticated(true);

        // Check if user has required role
        if (allowedRoles && allowedRoles.length > 0) {
          if (!allowedRoles.includes(userData.accountType)) {
            // User doesn't have required role, redirect to appropriate dashboard
            setIsAuthenticated(false);
          }
        }
      } catch (e) {
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }
  }, [allowedRoles, location.pathname]);

  // Show nothing while checking authentication
  if (isAuthenticated === null) {
    return null; // Or a loading spinner
  }

  // If not authenticated, redirect to unified login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user doesn't have required role, redirect to their dashboard
  if (allowedRoles && allowedRoles.length > 0 && user) {
    if (!allowedRoles.includes(user.accountType)) {
      // Redirect to appropriate dashboard based on account type
      if (user.accountType === 'SuperAdmin') {
        return <Navigate to="/superadmin/dashboard" replace />;
      } else if (user.accountType === 'Admin') {
        return <Navigate to="/admin/dashboard" replace />;
      } else if (user.accountType === 'Customer' || user.accountType === 'WalkIn') {
        return <Navigate to="/user/dashboard" replace />;
      }
    }
  }

  return <>{children}</>;
}

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuthStore } from '../store/adminAuthStore';
import { useAuthStore } from '../store/authStore';

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

export const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({ children }) => {
  const { admin, isAdminAuthenticated } = useAdminAuthStore();
  const { user, isAuthenticated } = useAuthStore();

  const isAllowedAdmin =
    (isAdminAuthenticated && admin && ['ADMIN', 'SUPER_OWNER', 'CO_OWNER'].includes(admin.role)) ||
    (isAuthenticated && user && ['ADMIN', 'SUPER_OWNER', 'CO_OWNER'].includes(user.role));

  if (!isAllowedAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuthStore } from '../store/adminAuthStore';

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

export const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({ children }) => {
  const { admin, isAdminAuthenticated } = useAdminAuthStore();

  if (!isAdminAuthenticated || !admin || admin.role !== 'ADMIN') {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

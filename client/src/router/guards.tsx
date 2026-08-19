import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spinner } from '../components/ui/Spinner.js';
import { useAuthStore } from '../store/authStore.js';
import { useStealthStore } from '../store/stealthStore.js';
import { UserRole } from '../types/index.js';

interface GuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<GuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-obsidian-950">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Module X: On mobile with active stealth, redirect to calculator instead of welcome
    const stealthState = useStealthStore.getState();
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    if (isMobile && stealthState.stealthToken && stealthState.isTokenValid) {
      return <Navigate to={`/s/${stealthState.stealthToken}`} state={{ from: location }} replace />;
    }
    return <Navigate to="/welcome" state={{ from: location }} replace />;
  }

  // Onboarding Resumption Guard: If onboarding is incomplete and user is not on /onboarding page, redirect to /onboarding
  if (user && user.onboardingCompleted === false && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};


export const GuestGuard: React.FC<GuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-obsidian-950">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    if (user && user.onboardingCompleted === false) {
      return <Navigate to="/onboarding" replace />;
    }

    if (user && (user.role === 'ADMIN' || user.email === 'admin@gmail.com')) {
      return <Navigate to="/admin/dashboard" replace />;
    }

    const isInviteRegister = location.pathname === '/register' && location.search.includes('invite');
    if (!isInviteRegister) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-obsidian-950">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/welcome" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

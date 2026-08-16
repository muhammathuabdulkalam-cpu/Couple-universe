import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Lock } from 'lucide-react';

interface FeatureRouteGuardProps {
  featureKey: string;
  children: React.ReactNode;
}

export const FeatureRouteGuard: React.FC<FeatureRouteGuardProps> = ({ featureKey, children }) => {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Bypass feature restrictions for SUPER_OWNER and CO_OWNER
  if (['SUPER_OWNER', 'CO_OWNER'].includes(user.role)) {
    return <>{children}</>;
  }

  const enabled = user.enabledFeatures || [];
  if (!enabled.includes(featureKey)) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-xl">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold">Feature Access Locked</h2>
        <p className="text-slate-400 max-w-md text-sm">
          The <span className="text-rose-300 font-bold">{featureKey}</span> feature is currently disabled for your account. Please contact your relationship administrator to enable access.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

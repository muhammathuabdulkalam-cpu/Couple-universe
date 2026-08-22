import React from 'react';
import { Skeleton } from './Skeleton.js';
import { Spinner } from './Spinner.js';

export const PageSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn">
      {/* Top Banner Skeleton */}
      <div className="glass-panel rounded-3xl p-6 space-y-4 border border-slate-200/50 dark:border-white/10 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-48 rounded-lg" />
              <Skeleton className="h-3 w-32 rounded-lg" />
            </div>
          </div>
          <Spinner size="md" />
        </div>
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <Skeleton className="h-48 w-full rounded-3xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-36 w-full rounded-3xl" />
        </div>
        <div className="space-y-4 hidden md:block">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
};

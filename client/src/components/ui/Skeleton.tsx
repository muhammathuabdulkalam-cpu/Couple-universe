import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', ...props }) => {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-200/80 dark:bg-obsidian-800/80 border border-slate-300/50 dark:border-white/5 ${className}`}
      {...props}
    />
  );
};

import { clsx } from 'clsx';
import React from 'react';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'cyan' | 'violet' | 'rose' | 'green' | 'amber' | 'gray';
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'cyan',
  size = 'md',
  pulse = false,
  className,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center gap-1.5 font-medium rounded-full border transition-colors';

  const variants = {
    cyan: 'bg-cyan-100/80 dark:bg-afzal/10 text-cyan-800 dark:text-afzal-glow border-cyan-300 dark:border-afzal/30 font-semibold',
    violet: 'bg-violet-100/80 dark:bg-amrin/10 text-violet-800 dark:text-amrin-glow border-violet-300 dark:border-amrin/30 font-semibold',
    rose: 'bg-rose-100/80 dark:bg-heart/10 text-rose-800 dark:text-heart-glow border-rose-300 dark:border-heart/30 font-semibold',
    green: 'bg-emerald-100/80 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30 font-semibold',
    amber: 'bg-amber-100/80 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-500/30 font-semibold',
    gray: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
  };

  return (
    <span className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))} {...props}>
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
      )}
      {children}
    </span>
  );
};

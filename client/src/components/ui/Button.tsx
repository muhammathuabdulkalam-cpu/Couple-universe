import { clsx } from 'clsx';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import React from 'react';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children?: React.ReactNode;
  variant?: 'primary' | 'cyan' | 'violet' | 'rose' | 'glass' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants = {
    primary: 'bg-gradient-to-r from-afzal to-amrin text-white hover:shadow-lg hover:shadow-amrin/20 focus:ring-amrin',
    cyan: 'bg-afzal text-obsidian-950 font-semibold hover:bg-afzal-glow hover:shadow-lg hover:shadow-afzal/20 focus:ring-afzal',
    violet: 'bg-amrin text-white hover:bg-amrin-glow hover:shadow-lg hover:shadow-amrin/20 focus:ring-amrin',
    rose: 'bg-heart text-white hover:bg-heart-glow hover:shadow-lg hover:shadow-heart/20 focus:ring-heart',
    glass: 'glass-card text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-obsidian-800/80 border border-slate-200 dark:border-white/10 hover:border-amrin/40 focus:ring-slate-400',
    outline: 'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-obsidian-800 hover:text-slate-900 dark:hover:text-white focus:ring-slate-400',
    danger: 'bg-red-600 text-white hover:bg-red-500 focus:ring-red-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
  };

  return (
    <motion.button
      whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
      whileHover={{ scale: disabled || isLoading ? 1 : 1.01 }}
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
        </>
      )}
    </motion.button>
  );
};

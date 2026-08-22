import { clsx } from 'clsx';
import { motion, HTMLMotionProps } from 'framer-motion';
import React from 'react';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'glass' | 'solid' | 'panel';
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'glass',
  hoverEffect = false,
  className,
  ...props
}) => {
  const baseStyles = 'rounded-2xl p-6 transition-all duration-300';
  
  const variants = {
    glass: 'glass-card',
    solid: 'bg-white dark:bg-obsidian-850 border border-slate-200 dark:border-slate-800/80 shadow-xl text-slate-900 dark:text-slate-100',
    panel: 'glass-panel',
  };

  const hoverStyles = hoverEffect ? 'hover:-translate-y-1 hover:shadow-2xl hover:border-amrin/40' : '';

  return (
    <motion.div
      className={twMerge(clsx(baseStyles, variants[variant], hoverStyles, className))}
      {...props}
    >
      {children}
    </motion.div>
  );
};

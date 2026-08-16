import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'ocean' | 'pale' | 'alert';
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  interactive = false,
  ...props
}) => {
  const baseStyles = 'rounded-2xl p-4 sm:p-5 transition-all duration-200';

  const variantStyles = {
    default: 'bg-white border border-slate-150 shadow-soft text-slate-800',
    glass: 'glass-card shadow-card text-slate-800',
    ocean: 'bg-ocean-gradient text-white shadow-card shadow-blue-950/20',
    pale: 'bg-brand-pale/50 border border-brand-subtle/50 text-slate-800',
    alert: 'bg-red-50/80 border border-brand-alert/30 text-slate-900'
  };

  const interactiveStyles = interactive ? 'hover:shadow-card hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer' : '';

  return (
    <div className={twMerge(clsx(baseStyles, variantStyles[variant], interactiveStyles, className))} {...props}>
      {children}
    </div>
  );
};

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'cyan' | 'blue' | 'navy' | 'alert' | 'success' | 'warning' | 'neutral';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'cyan',
  size = 'md',
  icon,
  className
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full shrink-0 tracking-wide';

  const sizeStyles = {
    sm: 'text-[10px] font-semibold px-2 py-0.5 gap-1',
    md: 'text-xs font-semibold px-2.5 py-1 gap-1.5'
  };

  const variantStyles = {
    cyan: 'bg-brand-cyan/20 text-brand-navy border border-brand-cyan/40 font-bold',
    blue: 'bg-brand-pale text-brand-primary border border-brand-subtle',
    navy: 'bg-brand-navy text-white font-bold',
    alert: 'bg-red-100 text-brand-alert border border-red-200 font-bold',
    success: 'bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold',
    warning: 'bg-amber-100 text-amber-900 border border-amber-200 font-bold',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200'
  };

  return (
    <span className={twMerge(clsx(baseStyles, sizeStyles[size], variantStyles[variant], className))}>
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

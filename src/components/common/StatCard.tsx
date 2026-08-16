import React from 'react';
import { Card } from './Card';
import { clsx } from 'clsx';

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    positive?: boolean;
  };
  variant?: 'default' | 'ocean' | 'pale';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
  className
}) => {
  return (
    <Card variant={variant} className={clsx('relative overflow-hidden', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className={clsx('text-xs font-bold uppercase tracking-wider', variant === 'ocean' ? 'text-brand-subtle' : 'text-slate-500')}>
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className={clsx('text-2xl sm:text-3xl font-display font-black tracking-tight', variant === 'ocean' ? 'text-white' : 'text-brand-navy')}>
              {value}
            </h3>
          </div>
          {subtitle && (
            <p className={clsx('text-xs', variant === 'ocean' ? 'text-brand-pale/80' : 'text-slate-500')}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center gap-1 text-xs font-semibold mt-1">
              <span className={trend.positive ? 'text-emerald-500' : 'text-brand-alert'}>
                {trend.positive ? '↑' : '↓'} {trend.value}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className={clsx('p-3 rounded-2xl shrink-0', variant === 'ocean' ? 'bg-white/10 text-brand-cyan' : 'bg-brand-pale text-brand-primary')}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

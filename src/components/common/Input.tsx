import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  icon?: React.ReactNode;
  suffix?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  error,
  icon,
  suffix,
  className,
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-bold text-brand-navy tracking-wide uppercase">
          {label}
        </label>
      )}
      <div className="relative rounded-xl shadow-sm">
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={twMerge(
            clsx(
              'block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400',
              'focus:border-brand-vibrant focus:outline-none focus:ring-2 focus:ring-brand-vibrant/20 transition-colors duration-150',
              icon && 'pl-10',
              suffix && 'pr-16',
              error && 'border-brand-alert focus:border-brand-alert focus:ring-brand-alert/20',
              className
            )
          )}
          {...props}
        />
        {suffix && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-xs font-semibold text-slate-500">
            {suffix}
          </div>
        )}
      </div>
      {error ? (
        <p className="text-xs text-brand-alert font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
};

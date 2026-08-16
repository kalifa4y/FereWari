import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'vibrant' | 'alert' | 'outline' | 'ghost' | 'cyan';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  isLoading = false,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 min-h-[36px] gap-1.5',
    md: 'text-sm px-4 py-2.5 min-h-[44px] gap-2 font-semibold',
    lg: 'text-base px-6 py-3.5 min-h-[52px] gap-2.5 font-bold shadow-md'
  };

  const variantStyles = {
    primary: 'bg-brand-primary text-white hover:bg-brand-navy focus:ring-brand-vibrant shadow-sm',
    secondary: 'bg-brand-pale text-brand-navy hover:bg-brand-subtle focus:ring-brand-medium font-semibold',
    vibrant: 'bg-brand-vibrant text-white hover:bg-brand-primary focus:ring-brand-cyan shadow-sm',
    cyan: 'bg-brand-cyan text-brand-navy hover:bg-brand-cyanSoft focus:ring-brand-primary font-bold shadow-sm',
    alert: 'bg-brand-alert text-white hover:bg-brand-alertDark focus:ring-brand-alert font-bold shadow-md shadow-red-500/20',
    outline: 'border-2 border-brand-vibrant/30 text-brand-primary hover:bg-brand-pale/60 focus:ring-brand-vibrant',
    ghost: 'text-brand-navy hover:bg-brand-pale/50 focus:ring-brand-subtle'
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, sizeStyles[size], variantStyles[variant], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
      {!isLoading && icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
    </button>
  );
};

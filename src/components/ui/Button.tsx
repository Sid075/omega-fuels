import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  block?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  block = false,
  icon,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed select-none gap-2 min-h-touch';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs min-h-[38px]',
    md: 'px-4 py-2.5 text-sm min-h-touch',
    lg: 'px-6 py-3.5 text-base min-h-[48px]',
  };

  const variantStyles = {
    primary: 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm border border-transparent',
    secondary: 'bg-surface-light-subtle dark:bg-surface-dark-subtle hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover text-zinc-900 dark:text-slate-100 border border-border-light dark:border-border-dark',
    destructive: 'bg-red-600 hover:bg-red-700 text-white shadow-sm border border-transparent',
    ghost: 'bg-transparent hover:bg-surface-light-subtle dark:hover:bg-surface-dark-subtle text-zinc-600 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-slate-100',
    outline: 'bg-transparent border border-border-light dark:border-border-dark hover:bg-surface-light-subtle dark:hover:bg-surface-dark-subtle text-zinc-800 dark:text-slate-200',
  };

  return (
    <button
      className={clsx(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        block && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" size={16} /> : icon}
      <span>{children}</span>
    </button>
  );
}

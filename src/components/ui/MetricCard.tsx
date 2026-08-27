import React from 'react';
import clsx from 'clsx';

export interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  trend?: {
    value: string;
    isPositive: boolean;
  };
  onClick?: () => void;
  className?: string;
}

export function MetricCard({
  label,
  value,
  subtitle,
  icon,
  variant = 'primary',
  trend,
  onClick,
  className,
}: MetricCardProps) {
  const iconVariants = {
    primary: 'bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300',
    success: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300',
    warning: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300',
    danger: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300',
    info: 'bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-300',
  };

  return (
    <div
      className={clsx(
        'bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-md p-4 flex flex-col justify-between min-h-[112px] shadow-sm transition-shadow',
        onClick && 'cursor-pointer hover:shadow-md active:scale-[0.99]',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-slate-400">
          {label}
        </span>
        {icon && (
          <div className={clsx('w-8 h-8 rounded-sm flex items-center justify-center', iconVariants[variant])}>
            {icon}
          </div>
        )}
      </div>

      <div>
        <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-slate-100 font-mono">
          {value}
        </div>
        {subtitle && (
          <div className="text-xs text-zinc-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            {subtitle}
          </div>
        )}
        {trend && (
          <div
            className={clsx(
              'text-xs font-medium mt-1 flex items-center gap-1',
              trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            )}
          >
            {trend.value}
          </div>
        )}
      </div>
    </div>
  );
}

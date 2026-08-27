import React from 'react';
import clsx from 'clsx';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  noPadding?: boolean;
}

export function Card({
  children,
  title,
  subtitle,
  action,
  footer,
  noPadding = false,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={clsx(
        'bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-md shadow-sm overflow-hidden',
        className
      )}
      {...props}
    >
      {(title || subtitle || action) && (
        <div className="px-5 py-4 border-b border-border-light dark:border-border-dark flex items-center justify-between gap-4">
          <div>
            {title && (
              <h3 className="text-[15px] font-semibold text-zinc-900 dark:text-slate-100 flex items-center gap-2">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}

      <div className={clsx(!noPadding && 'p-5')}>{children}</div>

      {footer && (
        <div className="px-5 py-3 border-t border-border-light dark:border-border-dark bg-surface-light-subtle dark:bg-surface-dark-subtle flex items-center justify-between text-xs text-zinc-600 dark:text-slate-400">
          {footer}
        </div>
      )}
    </div>
  );
}

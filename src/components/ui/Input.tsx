import React from 'react';
import clsx from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  prefixText?: string;
  suffixText?: string;
}

export function Input({
  label,
  hint,
  error,
  prefixText,
  suffixText,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-zinc-700 dark:text-slate-300">
          {label}
        </label>
      )}

      <div className="relative flex items-center w-full">
        {prefixText && (
          <span className="absolute left-3.5 text-zinc-400 dark:text-slate-500 text-sm font-medium pointer-events-none">
            {prefixText}
          </span>
        )}

        <input
          id={inputId}
          className={clsx(
            'w-full min-h-touch px-3.5 py-2.5 rounded-sm border text-sm transition-colors outline-none bg-surface-light dark:bg-surface-dark text-zinc-900 dark:text-slate-100 placeholder-zinc-400 dark:placeholder-slate-500',
            error
              ? 'border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-950'
              : 'border-border-light dark:border-border-dark focus:border-brand-600 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-950',
            prefixText && 'pl-9',
            suffixText && 'pr-12',
            className
          )}
          {...props}
        />

        {suffixText && (
          <span className="absolute right-3.5 text-zinc-400 dark:text-slate-500 text-xs font-semibold uppercase pointer-events-none">
            {suffixText}
          </span>
        )}
      </div>

      {hint && !error && <p className="text-xs text-zinc-500 dark:text-slate-400">{hint}</p>}
      {error && <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

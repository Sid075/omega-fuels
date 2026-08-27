'use client';

import React from 'react';
import Link from 'next/link';
import {
  PlusCircle,
  Banknote,
  Fuel,
  Users,
  CreditCard,
  Receipt,
  X,
} from 'lucide-react';

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ActionSheet({ isOpen, onClose }: ActionSheetProps) {
  if (!isOpen) return null;

  const quickActions = [
    {
      title: 'New Shift Entry',
      description: 'Record employee shift & sales',
      href: '/shifts/new',
      icon: <PlusCircle size={22} className="text-brand-600 dark:text-brand-400" />,
      color: 'bg-brand-50 dark:bg-brand-950',
    },
    {
      title: 'Owner Cash Collection',
      description: 'Record mid-shift cash withdrawal',
      href: '/cash?action=collect',
      icon: <Banknote size={22} className="text-emerald-600 dark:text-emerald-400" />,
      color: 'bg-emerald-50 dark:bg-emerald-950',
    },
    {
      title: 'Credit Payment Received',
      description: 'Record customer repayment',
      href: '/credit?action=payment',
      icon: <CreditCard size={22} className="text-sky-600 dark:text-sky-400" />,
      color: 'bg-sky-50 dark:bg-sky-950',
    },
    {
      title: 'New Fuel Delivery',
      description: 'Receive petrol or diesel stock',
      href: '/fuel?action=delivery',
      icon: <Fuel size={22} className="text-amber-600 dark:text-amber-400" />,
      color: 'bg-amber-50 dark:bg-amber-950',
    },
    {
      title: 'Record Expense',
      description: 'Add station operating expense',
      href: '/expenses/new',
      icon: <Receipt size={22} className="text-purple-600 dark:text-purple-400" />,
      color: 'bg-purple-50 dark:bg-purple-950',
    },
    {
      title: 'Fuel Test / Generator',
      description: 'Record nozzle test or generator run',
      href: '/fuel?action=usage',
      icon: <Fuel size={22} className="text-rose-600 dark:text-rose-400" />,
      color: 'bg-rose-50 dark:bg-rose-950',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs lg:hidden">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-md bg-surface-light dark:bg-surface-dark rounded-t-xl p-5 shadow-2xl z-10 max-h-[85vh] overflow-y-auto border-t border-border-light dark:border-border-dark">
        <div className="flex items-center justify-between pb-3 border-b border-border-light dark:border-border-dark">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-slate-100">Quick Operations</h3>
            <p className="text-xs text-zinc-500 dark:text-slate-400">Select an action to record</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-sm text-zinc-400 hover:text-zinc-700 dark:hover:text-slate-200 min-h-touch min-w-touch flex items-center justify-center"
            aria-label="Close action sheet"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              onClick={onClose}
              className="flex flex-col items-center text-center p-4 rounded-md border border-border-light dark:border-border-dark bg-surface-light-subtle dark:bg-surface-dark-subtle hover:border-brand-500 transition-colors min-h-[110px] justify-center gap-2"
            >
              <div className={`w-11 h-11 rounded-full flex items-center justify-center ${action.color}`}>
                {action.icon}
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-900 dark:text-slate-100 leading-tight">
                  {action.title}
                </div>
                <div className="text-[10px] text-zinc-500 dark:text-slate-400 mt-0.5 leading-tight">
                  {action.description}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Plus,
  FileSpreadsheet,
  MoreHorizontal,
  Banknote,
} from 'lucide-react';
import { ActionSheet } from './ActionSheet';
import { UserRole } from '@/types';

interface MobileNavProps {
  userRole?: UserRole;
}

export function MobileNav({ userRole = 'MANAGER' }: MobileNavProps) {
  const pathname = usePathname();
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

  const dashboardHref = userRole === 'ADMIN' ? '/admin/dashboard' : '/dashboard';

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-surface-light dark:bg-surface-dark border-t border-border-light dark:border-border-dark flex items-center justify-around z-40 px-2 lg:hidden">
        <Link
          href={dashboardHref}
          className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium min-w-[56px] min-h-[48px] ${
            pathname === dashboardHref
              ? 'text-brand-600 dark:text-brand-400 font-semibold'
              : 'text-zinc-500 dark:text-slate-400'
          }`}
        >
          <LayoutDashboard size={20} />
          <span>Home</span>
        </Link>

        <Link
          href="/cash"
          className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium min-w-[56px] min-h-[48px] ${
            pathname.startsWith('/cash')
              ? 'text-brand-600 dark:text-brand-400 font-semibold'
              : 'text-zinc-500 dark:text-slate-400'
          }`}
        >
          <Banknote size={20} />
          <span>Cash</span>
        </Link>

        {/* Center Floating Quick Action Button */}
        <button
          onClick={() => setIsActionSheetOpen(true)}
          className="flex flex-col items-center justify-center w-12 h-12 -mt-5 rounded-full bg-brand-600 text-white shadow-lg border-2 border-surface-light dark:border-surface-dark active:scale-95 transition-transform"
          aria-label="Quick Entry Operations"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>

        <Link
          href="/reports"
          className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium min-w-[56px] min-h-[48px] ${
            pathname.startsWith('/reports')
              ? 'text-brand-600 dark:text-brand-400 font-semibold'
              : 'text-zinc-500 dark:text-slate-400'
          }`}
        >
          <FileSpreadsheet size={20} />
          <span>Reports</span>
        </Link>

        <Link
          href="/fuel"
          className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium min-w-[56px] min-h-[48px] ${
            pathname.startsWith('/fuel') || pathname.startsWith('/credit') || pathname.startsWith('/employees')
              ? 'text-brand-600 dark:text-brand-400 font-semibold'
              : 'text-zinc-500 dark:text-slate-400'
          }`}
        >
          <MoreHorizontal size={20} />
          <span>More</span>
        </Link>
      </nav>

      {/* Quick Action Sheet Modal */}
      <ActionSheet
        isOpen={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
      />
    </>
  );
}

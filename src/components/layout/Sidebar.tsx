'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Fuel,
  BookOpen,
  FileSpreadsheet,
  History,
  LogOut,
  PlusCircle,
  Banknote,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { UserRole } from '@/types';
import { Badge } from '../ui/Badge';

interface SidebarProps {
  userRole?: UserRole;
  userName?: string;
  userEmail?: string;
}

export function Sidebar({
  userRole = 'MANAGER',
  userName = 'Station Manager',
  userEmail = 'manager@omegafuels.com',
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      window.location.href = '/login';
    }
  };

  const navItems = [
    {
      label: 'Dashboard',
      href: userRole === 'ADMIN' ? '/admin/dashboard' : '/dashboard',
      icon: <LayoutDashboard size={18} />,
    },
    {
      label: 'New Shift Entry',
      href: '/shifts/new',
      icon: <PlusCircle size={18} />,
    },
    {
      label: 'Shift History & Logs',
      href: '/shifts',
      icon: <Clock size={18} />,
    },
    {
      label: 'Cash Ledger & Owner',
      href: '/cash',
      icon: <Banknote size={18} />,
    },
    {
      label: 'Fuel Stock & Pricing',
      href: '/fuel',
      icon: <Fuel size={18} />,
    },
    {
      label: 'Credit Book',
      href: '/credit',
      icon: <BookOpen size={18} />,
    },
    {
      label: 'Employees & Staff',
      href: '/employees',
      icon: <Users size={18} />,
    },
    {
      label: 'Reports & Analytics',
      href: '/reports',
      icon: <FileSpreadsheet size={18} />,
    },
  ];

  const adminItems = [
    {
      label: 'Audit & Activity Logs',
      href: '/admin/audit-logs',
      icon: <History size={18} />,
    },
  ];

  return (
    <aside className="hidden lg:flex w-64 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark flex-col fixed top-0 bottom-0 left-0 z-40">
      {/* Brand Header */}
      <div className="p-5 border-b border-border-light dark:border-border-dark flex items-center gap-3">
        <div className="w-9 h-9 rounded-sm bg-brand-600 text-white flex items-center justify-center font-bold shadow-xs">
          <Fuel size={20} />
        </div>
        <div>
          <div className="text-base font-bold tracking-tight text-zinc-900 dark:text-slate-100">
            OMEGA FUELS
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-slate-500">
            Operations & Ledger
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-3 px-2">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-slate-500">
          Operations
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === '/shifts'
                ? pathname === '/shifts'
                : pathname === item.href ||
                  (item.href !== '/dashboard' &&
                    item.href !== '/admin/dashboard' &&
                    pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 font-semibold'
                    : 'text-zinc-600 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-slate-100 hover:bg-surface-light-subtle dark:hover:bg-surface-dark-subtle'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {userRole === 'ADMIN' && (
          <div className="mt-4 pt-4 border-t border-border-light dark:border-border-dark">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-slate-500">
              Executive
            </div>
            <nav className="space-y-1">
              {adminItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 font-semibold'
                        : 'text-zinc-600 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-slate-100 hover:bg-surface-light-subtle dark:hover:bg-surface-dark-subtle'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* User Footer Profile & Sign Out */}
      <div className="p-4 border-t border-border-light dark:border-border-dark bg-surface-light-subtle dark:bg-surface-dark-subtle">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="min-w-0">
            <div className="text-xs font-bold text-zinc-900 dark:text-slate-100 truncate">
              {userName}
            </div>
            <div className="text-[11px] text-zinc-400 dark:text-slate-500 truncate">
              {userEmail}
            </div>
          </div>
          <Badge
            variant={userRole === 'ADMIN' ? 'info' : 'success'}
            icon={<ShieldCheck size={12} />}
          >
            {userRole}
          </Badge>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-xs font-semibold text-zinc-700 dark:text-slate-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors min-h-[38px]"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

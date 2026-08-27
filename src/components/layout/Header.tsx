'use client';

import React from 'react';
import { Fuel, ShieldCheck, User as UserIcon } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Badge } from '../ui/Badge';
import { UserRole } from '@/types';

interface HeaderProps {
  userRole?: UserRole;
  userName?: string;
  stationName?: string;
}

export function Header({
  userRole = 'MANAGER',
  userName = 'Station Manager',
  stationName = 'Main Highway Station (OF-01)',
}: HeaderProps) {
  return (
    <header className="h-16 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 shadow-2xs">
      {/* Station Name & Mobile Brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-sm bg-brand-600 text-white flex items-center justify-center lg:hidden font-bold">
          <Fuel size={18} />
        </div>
        <div>
          <h1 className="text-sm md:text-base font-bold text-zinc-900 dark:text-slate-100 flex items-center gap-2">
            <span>OMEGA FUELS</span>
            <span className="hidden sm:inline-block text-xs font-normal text-zinc-400 dark:text-slate-500">
              | {stationName}
            </span>
          </h1>
          <p className="text-[10px] text-zinc-400 dark:text-slate-500 sm:hidden">
            {stationName}
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        <Badge
          variant={userRole === 'ADMIN' ? 'info' : 'success'}
          icon={<ShieldCheck size={12} />}
        >
          {userRole}
        </Badge>

        <ThemeToggle />

        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-border-light dark:border-border-dark">
          <div className="w-7 h-7 rounded-full bg-surface-light-subtle dark:bg-surface-dark-subtle flex items-center justify-center text-zinc-500 dark:text-slate-400">
            <UserIcon size={14} />
          </div>
          <span className="text-xs font-semibold text-zinc-800 dark:text-slate-200">
            {userName}
          </span>
        </div>
      </div>
    </header>
  );
}

'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { UserRole } from '@/types';

interface AppLayoutProps {
  children: React.ReactNode;
  userRole?: UserRole;
  userName?: string;
  userEmail?: string;
}

export function AppLayout({
  children,
  userRole = 'MANAGER',
  userName = 'Station Manager',
  userEmail = 'manager@omegafuels.com',
}: AppLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-canvas-light dark:bg-canvas-dark text-zinc-900 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <Sidebar
        userRole={userRole}
        userName={userName}
        userEmail={userEmail}
      />

      {/* Main Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 w-full lg:ml-64">
        <Header
          userRole={userRole}
          userName={userName}
        />

        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto pb-24 lg:pb-8">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <MobileNav userRole={userRole} />
      </div>
    </div>
  );
}

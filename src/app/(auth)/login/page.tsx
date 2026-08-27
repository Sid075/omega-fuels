'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Fuel, ShieldAlert, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || 'Authentication failed');
        setLoading(false);
        return;
      }

      // Route to destination
      const target = redirectPath || data.redirectTo || '/dashboard';
      router.push(target);
      router.refresh();
    } catch {
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  const fillCredentials = (role: 'admin' | 'manager') => {
    setError(null);
    if (role === 'admin') {
      setEmail('admin@omegafuels.com');
      setPassword('Admin@12345');
    } else {
      setEmail('manager@omegafuels.com');
      setPassword('Manager@12345');
    }
  };

  return (
    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-6 sm:p-8 shadow-sm">
      <div className="mb-6 text-center">
        <div className="w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 mx-auto flex items-center justify-center mb-3">
          <Fuel size={24} />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-slate-100">
          Sign In to Station Portal
        </h2>
        <p className="text-xs text-zinc-500 dark:text-slate-400 mt-1">
          Select your role or enter authorized credentials
        </p>
      </div>

      {/* Quick Demo Role Switcher */}
      <div className="mb-6 p-3 rounded-md bg-surface-light-subtle dark:bg-surface-dark-subtle border border-border-light dark:border-border-dark">
        <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-slate-400 mb-2">
          Quick Role Sign-In (Demo)
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fillCredentials('manager')}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-xs font-semibold text-zinc-800 dark:text-slate-200 hover:border-brand-500 transition-colors min-h-[38px]"
          >
            <UserCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>Manager</span>
          </button>
          <button
            type="button"
            onClick={() => fillCredentials('admin')}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-xs font-semibold text-zinc-800 dark:text-slate-200 hover:border-brand-500 transition-colors min-h-[38px]"
          >
            <ShieldCheck size={14} className="text-brand-600 dark:text-brand-400" />
            <span>Admin / Owner</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-sm bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
          <ShieldAlert size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="manager@omegafuels.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          prefixText="@"
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        <Button
          type="submit"
          block
          loading={loading}
          icon={<ArrowRight size={16} />}
          className="mt-2"
        >
          Sign In
        </Button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-canvas-light dark:bg-canvas-dark px-4 py-6">
      {/* Top Header */}
      <div className="flex items-center justify-between max-w-md w-full mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-sm bg-brand-600 text-white flex items-center justify-center font-bold">
            <Fuel size={18} />
          </div>
          <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-slate-100">
            OMEGA FUELS
          </span>
        </div>
        <ThemeToggle />
      </div>

      {/* Main Form Container */}
      <div className="max-w-md w-full mx-auto my-auto py-6">
        <Suspense fallback={<div className="text-center py-8 text-xs text-zinc-400">Loading portal...</div>}>
          <LoginForm />
        </Suspense>
      </div>

      {/* Footer Info */}
      <div className="text-center text-xs text-zinc-400 dark:text-slate-500 max-w-md mx-auto w-full">
        <div>OMEGA FUELS Operational System v1.0</div>
        <div className="text-[11px] mt-0.5">Secure Transaction &amp; Stock Ledger Engine</div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import {
  Banknote,
  Fuel,
  Users,
  CreditCard,
  PlusCircle,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { MetricCard } from '@/components/ui/MetricCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatLitres } from '@/lib/utils/formatters';

export default function ManagerDashboard() {
  // Operational Summary State (Pre-populated demo ledger calculation)
  const todayMetrics = {
    totalBusinessSales: 82760.00,
    expectedCashInflow: 42500.00,
    ownerCollectedCash: 25000.00,
    remainingExpectedCash: 17500.00,
    petrolStockLitres: 14500.00,
    dieselStockLitres: 22000.00,
    outstandingCredit: 46500.00,
    activeEmployees: 3,
  };

  const recentShifts = [
    {
      id: 'shift_01',
      employee: 'Ramesh Kumar',
      shiftType: 'MORNING',
      time: '06:00 AM - 02:00 PM',
      cash: 42500,
      upi: 18200,
      card: 9300,
      credit: 12000,
      otherSales: 760,
      total: 82760,
      status: 'COMPLETED',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 dark:text-slate-100">
            Operations Dashboard
          </h2>
          <p className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5">
            Real-time shift records, cash reconciliation & fuel inventory
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/shifts/new">
            <Button icon={<PlusCircle size={16} />}>
              New Shift Entry
            </Button>
          </Link>
          <Link href="/cash">
            <Button variant="secondary" icon={<Banknote size={16} />}>
              Record Cash Collection
            </Button>
          </Link>
        </div>
      </div>

      {/* Critical Financial & Cash Reconciliation Metrics */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-slate-500 mb-3">
          Cash & Sales Overview
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Today's Total Sales"
            value={formatCurrency(todayMetrics.totalBusinessSales)}
            subtitle="Cash + UPI + Card + Credit + Other"
            variant="primary"
            icon={<TrendingUp size={18} />}
          />

          <MetricCard
            label="Physical Cash Inflow"
            value={formatCurrency(todayMetrics.expectedCashInflow)}
            subtitle="Total shift cash received"
            variant="info"
            icon={<Banknote size={18} />}
          />

          <MetricCard
            label="Owner Cash Collected"
            value={formatCurrency(todayMetrics.ownerCollectedCash)}
            subtitle="Collected mid-shift by owner"
            variant="warning"
            icon={<ArrowUpRight size={18} />}
          />

          <MetricCard
            label="Remaining Available Cash"
            value={formatCurrency(todayMetrics.remainingExpectedCash)}
            subtitle="Expected physical cash in drawer"
            variant="success"
            icon={<CheckCircle2 size={18} />}
          />
        </div>
      </div>

      {/* Fuel Stock & Credit Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MetricCard
          label="Petrol Stock (MS)"
          value={formatLitres(todayMetrics.petrolStockLitres)}
          subtitle="Rate: ₹102.50 / L"
          variant="primary"
          icon={<Fuel size={18} />}
        />

        <MetricCard
          label="Diesel Stock (HSD)"
          value={formatLitres(todayMetrics.dieselStockLitres)}
          subtitle="Rate: ₹89.20 / L"
          variant="info"
          icon={<Fuel size={18} />}
        />

        <MetricCard
          label="Outstanding Credit"
          value={formatCurrency(todayMetrics.outstandingCredit)}
          subtitle="Total customer dues"
          variant="danger"
          icon={<CreditCard size={18} />}
        />
      </div>

      {/* Recent Operational Shifts Table / Mobile Cards */}
      <Card
        title="Today's Shift Entries"
        subtitle="Completed nozzle operator shift submissions"
        action={
          <Link href="/shifts/new">
            <Button size="sm" variant="secondary" icon={<PlusCircle size={14} />}>
              Add Shift
            </Button>
          </Link>
        }
      >
        {/* Desktop Data Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border-light dark:border-border-dark bg-surface-light-subtle dark:bg-surface-dark-subtle text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-slate-400">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Shift</th>
                <th className="px-4 py-3 text-right">Cash</th>
                <th className="px-4 py-3 text-right">UPI</th>
                <th className="px-4 py-3 text-right">Card</th>
                <th className="px-4 py-3 text-right">Credit</th>
                <th className="px-4 py-3 text-right font-bold">Total Sales</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark">
              {recentShifts.map((shift) => (
                <tr key={shift.id} className="hover:bg-surface-light-subtle dark:hover:bg-surface-dark-subtle transition-colors">
                  <td className="px-4 py-3.5 font-medium text-zinc-900 dark:text-slate-100">
                    {shift.employee}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-zinc-500 dark:text-slate-400">
                    <Badge variant="neutral">{shift.shiftType}</Badge>
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-zinc-900 dark:text-slate-100">
                    {formatCurrency(shift.cash)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-zinc-600 dark:text-slate-400">
                    {formatCurrency(shift.upi)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-zinc-600 dark:text-slate-400">
                    {formatCurrency(shift.card)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-zinc-600 dark:text-slate-400">
                    {formatCurrency(shift.credit)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-bold text-brand-600 dark:text-brand-400">
                    {formatCurrency(shift.total)}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <Badge variant="success" icon={<CheckCircle2 size={12} />}>
                      {shift.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View: High readability Card list */}
        <div className="md:hidden space-y-3">
          {recentShifts.map((shift) => (
            <div
              key={shift.id}
              className="p-4 rounded-md border border-border-light dark:border-border-dark bg-surface-light-subtle dark:bg-surface-dark-subtle space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-zinc-900 dark:text-slate-100">
                    {shift.employee}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-slate-400">
                    {shift.shiftType} Shift • {shift.time}
                  </div>
                </div>
                <Badge variant="success" icon={<CheckCircle2 size={12} />}>
                  {shift.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border-light dark:border-border-dark">
                <div>
                  <span className="text-zinc-500 dark:text-slate-400">Cash:</span>{' '}
                  <span className="font-mono font-semibold">{formatCurrency(shift.cash)}</span>
                </div>
                <div>
                  <span className="text-zinc-500 dark:text-slate-400">UPI:</span>{' '}
                  <span className="font-mono font-semibold">{formatCurrency(shift.upi)}</span>
                </div>
                <div>
                  <span className="text-zinc-500 dark:text-slate-400">Card:</span>{' '}
                  <span className="font-mono font-semibold">{formatCurrency(shift.card)}</span>
                </div>
                <div>
                  <span className="text-zinc-500 dark:text-slate-400">Credit:</span>{' '}
                  <span className="font-mono font-semibold">{formatCurrency(shift.credit)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-border-light dark:border-border-dark flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-700 dark:text-slate-300">
                  Total Shift Revenue:
                </span>
                <span className="text-sm font-bold font-mono text-brand-600 dark:text-brand-400">
                  {formatCurrency(shift.total)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

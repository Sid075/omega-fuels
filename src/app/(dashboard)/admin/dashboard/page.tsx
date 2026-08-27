'use client';

import React from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Banknote,
  Fuel,
  CreditCard,
  Receipt,
  FileSpreadsheet,
  History,
  ShieldCheck,
  ArrowUpRight,
  Download,
} from 'lucide-react';
import { MetricCard } from '@/components/ui/MetricCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatLitres } from '@/lib/utils/formatters';

export default function AdminDashboard() {
  const adminMetrics = {
    monthlyRevenue: 2485900.00,
    monthlyGrowth: '+8.4% vs last month',
    expectedCash: 42500.00,
    ownerCollected: 25000.00,
    remainingCash: 17500.00,
    totalExpenses: 48200.00,
    outstandingCredit: 46500.00,
    petrolStock: 14500.00,
    dieselStock: 22000.00,
  };

  const paymentBreakdown = [
    { method: 'Cash (Physical)', amount: 42500, percentage: '51.4%', color: 'bg-emerald-500' },
    { method: 'UPI (QR / Digital)', amount: 18200, percentage: '22.0%', color: 'bg-blue-500' },
    { method: 'Credit Issued', amount: 12000, percentage: '14.5%', color: 'bg-amber-500' },
    { method: 'Card / POS Swiping', amount: 9300, percentage: '11.2%', color: 'bg-purple-500' },
    { method: 'Other Sales (Lubricants)', amount: 760, percentage: '0.9%', color: 'bg-zinc-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 dark:text-slate-100">
              Executive Administration Dashboard
            </h2>
            <Badge variant="info" icon={<ShieldCheck size={12} />}>
              ADMIN
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5">
            Station financial analytics, revenue reconciliation & operational oversight
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/reports">
            <Button icon={<FileSpreadsheet size={16} />}>
              Reports & Exports
            </Button>
          </Link>
          <Link href="/admin/audit-logs">
            <Button variant="secondary" icon={<History size={16} />}>
              Audit Trail
            </Button>
          </Link>
        </div>
      </div>

      {/* Top Executive KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Monthly Revenue"
          value={formatCurrency(adminMetrics.monthlyRevenue)}
          subtitle={adminMetrics.monthlyGrowth}
          variant="primary"
          icon={<TrendingUp size={18} />}
        />

        <MetricCard
          label="Physical Cash In Hand"
          value={formatCurrency(adminMetrics.remainingCash)}
          subtitle={`Collected: ${formatCurrency(adminMetrics.ownerCollected)}`}
          variant="success"
          icon={<Banknote size={18} />}
        />

        <MetricCard
          label="Customer Credit Dues"
          value={formatCurrency(adminMetrics.outstandingCredit)}
          subtitle="Active Credit Accounts: 2"
          variant="danger"
          icon={<CreditCard size={18} />}
        />

        <MetricCard
          label="Monthly Expenses"
          value={formatCurrency(adminMetrics.totalExpenses)}
          subtitle="Utility, wages & maintenance"
          variant="warning"
          icon={<Receipt size={18} />}
        />
      </div>

      {/* Fuel Inventory Stock Asset Value */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          title="Petrol (MS) Inventory"
          subtitle="Standard Motor Spirit"
          action={<Badge variant="success">Healthy Stock</Badge>}
        >
          <div className="space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold font-mono text-zinc-900 dark:text-slate-100">
                {formatLitres(adminMetrics.petrolStock)}
              </span>
              <span className="text-xs text-zinc-500 dark:text-slate-400">
                Tank Capacity: 20,000 L (72.5%)
              </span>
            </div>

            {/* Visual Level Bar */}
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
              <div className="bg-brand-600 h-full rounded-full" style={{ width: '72.5%' }} />
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-slate-400 pt-2 border-t border-border-light dark:border-border-dark">
              <span>Current Retail Price: ₹102.50 / L</span>
              <span className="font-semibold text-zinc-900 dark:text-slate-100">
                Stock Valuation: {formatCurrency(adminMetrics.petrolStock * 102.50)}
              </span>
            </div>
          </div>
        </Card>

        <Card
          title="Diesel (HSD) Inventory"
          subtitle="High Speed Diesel"
          action={<Badge variant="success">Healthy Stock</Badge>}
        >
          <div className="space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold font-mono text-zinc-900 dark:text-slate-100">
                {formatLitres(adminMetrics.dieselStock)}
              </span>
              <span className="text-xs text-zinc-500 dark:text-slate-400">
                Tank Capacity: 30,000 L (73.3%)
              </span>
            </div>

            {/* Visual Level Bar */}
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full" style={{ width: '73.3%' }} />
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-slate-400 pt-2 border-t border-border-light dark:border-border-dark">
              <span>Current Retail Price: ₹89.20 / L</span>
              <span className="font-semibold text-zinc-900 dark:text-slate-100">
                Stock Valuation: {formatCurrency(adminMetrics.dieselStock * 89.20)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Payment Method Breakdown Card */}
      <Card
        title="Revenue Breakdown by Payment Channel"
        subtitle="Distribution of shift receipts across payment modes"
      >
        <div className="space-y-4">
          {paymentBreakdown.map((item) => (
            <div key={item.method} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-800 dark:text-slate-200">
                  {item.method}
                </span>
                <div className="space-x-3">
                  <span className="font-mono text-zinc-500 dark:text-slate-400">
                    {item.percentage}
                  </span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-slate-100">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`${item.color} h-full rounded-full`}
                  style={{ width: item.percentage }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

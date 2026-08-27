'use client';

import React from 'react';
import { BookOpen, PlusCircle, CreditCard, ArrowDownLeft, Phone } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils/formatters';

export default function CreditBookPage() {
  const creditSummary = {
    totalOutstanding: 46500.00,
    totalCreditGiven: 78500.00,
    totalRepaid: 32000.00,
  };

  const customers = [
    {
      id: 'cust_01',
      name: 'Apex Logistics Fleet Ltd',
      phone: '+91 98111 22334',
      status: 'ACTIVE',
      outstanding: 34500.00,
      limit: 100000.00,
      lastTx: 'Diesel fueling for 4 trucks (KA-01-AB-1234)',
    },
    {
      id: 'cust_02',
      name: 'Green Earth Transport',
      phone: '+91 98222 33445',
      status: 'ACTIVE',
      outstanding: 12000.00,
      limit: 50000.00,
      lastTx: 'Shift #shift_01 credit fueling chit',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 dark:text-slate-100 flex items-center gap-2">
            <BookOpen size={22} className="text-brand-600 dark:text-brand-400" />
            <span>Credit Customer Book</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5">
            Credit accounts, credit limits, outstanding balances & cash vs digital repayments
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button icon={<PlusCircle size={16} />}>
            New Credit Customer
          </Button>
          <Button variant="secondary" icon={<ArrowDownLeft size={16} />}>
            Record Repayment
          </Button>
        </div>
      </div>

      {/* Credit KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Total Outstanding Credit"
          value={formatCurrency(creditSummary.totalOutstanding)}
          subtitle="Active balance owed by customers"
          variant="danger"
          icon={<CreditCard size={18} />}
        />

        <MetricCard
          label="Total Credit Extended"
          value={formatCurrency(creditSummary.totalCreditGiven)}
          subtitle="Cumulative credit fuel issued"
          variant="primary"
          icon={<BookOpen size={18} />}
        />

        <MetricCard
          label="Total Repayments Received"
          value={formatCurrency(creditSummary.totalRepaid)}
          subtitle="Cash & Digital repayments"
          variant="success"
          icon={<ArrowDownLeft size={18} />}
        />
      </div>

      {/* Customer Accounts */}
      <Card title="Credit Customer Directory" subtitle="Manage accounts and view statements">
        <div className="space-y-3">
          {customers.map((cust) => (
            <div
              key={cust.id}
              className="p-4 rounded-md border border-border-light dark:border-border-dark bg-surface-light-subtle dark:bg-surface-dark-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-zinc-900 dark:text-slate-100">
                    {cust.name}
                  </span>
                  <Badge variant="success">{cust.status}</Badge>
                </div>
                <div className="text-xs text-zinc-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                  <Phone size={12} />
                  <span>{cust.phone}</span>
                  <span>• Limit: {formatCurrency(cust.limit)}</span>
                </div>
                <div className="text-xs text-zinc-600 dark:text-slate-400 mt-1.5">
                  Last activity: {cust.lastTx}
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-border-light dark:border-border-dark">
                <div className="text-xs text-zinc-500 dark:text-slate-400">
                  Outstanding Balance:
                </div>
                <div className="text-base font-bold font-mono text-red-600 dark:text-red-400">
                  {formatCurrency(cust.outstanding)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

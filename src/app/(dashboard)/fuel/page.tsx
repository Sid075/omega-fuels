'use client';

import React, { useState } from 'react';
import { Fuel, PlusCircle, ArrowDownLeft, ShieldCheck, History, Edit3 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatLitres } from '@/lib/utils/formatters';

export default function FuelManagementPage() {
  const stockSummary = {
    petrolStock: 14500.0,
    petrolPrice: 102.5,
    dieselStock: 22000.0,
    dieselPrice: 89.2,
  };

  const deliveries = [
    {
      id: 'del_01',
      fuelType: 'PETROL',
      volume: 12000,
      costPerLitre: 94.20,
      totalCost: 1130400,
      supplier: 'IOCL Terminal Hub',
      ref: 'INV-88934',
      date: new Date().toISOString().split('T')[0],
    },
    {
      id: 'del_02',
      fuelType: 'DIESEL',
      volume: 18000,
      costPerLitre: 81.50,
      totalCost: 1467000,
      supplier: 'BPCL Terminal Hub',
      ref: 'INV-88935',
      date: new Date().toISOString().split('T')[0],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 dark:text-slate-100 flex items-center gap-2">
            <Fuel size={22} className="text-brand-600 dark:text-brand-400" />
            <span>Fuel Inventory & Pricing</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5">
            Petrol & Diesel tank inventory, price timeline, test loss & delivery records
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button icon={<PlusCircle size={16} />}>
            New Tanker Delivery
          </Button>
          <Button variant="secondary" icon={<Edit3 size={16} />}>
            Update Fuel Price
          </Button>
        </div>
      </div>

      {/* Stock Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          title="Petrol (MS) Status"
          subtitle={`Current Retail Rate: ₹${stockSummary.petrolPrice.toFixed(2)} / Litre`}
          action={<Badge variant="success">Tank Normal</Badge>}
        >
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold font-mono text-zinc-900 dark:text-slate-100">
                {formatLitres(stockSummary.petrolStock)}
              </span>
              <span className="text-xs text-zinc-500 dark:text-slate-400">
                Capacity: 20,000 L
              </span>
            </div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
              <div className="bg-brand-600 h-full rounded-full" style={{ width: '72.5%' }} />
            </div>
            <div className="text-xs text-zinc-500 dark:text-slate-400 pt-2 border-t border-border-light dark:border-border-dark flex justify-between">
              <span>Valuation: {formatCurrency(stockSummary.petrolStock * stockSummary.petrolPrice)}</span>
              <span>Last Delivery: 12,000 L</span>
            </div>
          </div>
        </Card>

        <Card
          title="Diesel (HSD) Status"
          subtitle={`Current Retail Rate: ₹${stockSummary.dieselPrice.toFixed(2)} / Litre`}
          action={<Badge variant="success">Tank Normal</Badge>}
        >
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold font-mono text-zinc-900 dark:text-slate-100">
                {formatLitres(stockSummary.dieselStock)}
              </span>
              <span className="text-xs text-zinc-500 dark:text-slate-400">
                Capacity: 30,000 L
              </span>
            </div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full" style={{ width: '73.3%' }} />
            </div>
            <div className="text-xs text-zinc-500 dark:text-slate-400 pt-2 border-t border-border-light dark:border-border-dark flex justify-between">
              <span>Valuation: {formatCurrency(stockSummary.dieselStock * stockSummary.dieselPrice)}</span>
              <span>Last Delivery: 18,000 L</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Stock Deliveries History */}
      <Card title="Recent Tanker Deliveries" subtitle="Log of fuel received and cost per litre recorded">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border-light dark:border-border-dark bg-surface-light-subtle dark:bg-surface-dark-subtle text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-slate-400">
                <th className="px-4 py-3">Fuel</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Challan Ref</th>
                <th className="px-4 py-3 text-right">Volume</th>
                <th className="px-4 py-3 text-right">Cost / L</th>
                <th className="px-4 py-3 text-right font-bold">Total Cost</th>
                <th className="px-4 py-3 text-center">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark">
              {deliveries.map((del) => (
                <tr key={del.id} className="hover:bg-surface-light-subtle dark:hover:bg-surface-dark-subtle transition-colors">
                  <td className="px-4 py-3.5 font-bold text-zinc-900 dark:text-slate-100">
                    <Badge variant={del.fuelType === 'PETROL' ? 'info' : 'warning'}>
                      {del.fuelType}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-zinc-700 dark:text-slate-300">
                    {del.supplier}
                  </td>
                  <td className="px-4 py-3.5 text-xs font-mono text-zinc-500 dark:text-slate-400">
                    {del.ref}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-semibold text-zinc-900 dark:text-slate-100">
                    {formatLitres(del.volume)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-zinc-600 dark:text-slate-400">
                    ₹{del.costPerLitre.toFixed(2)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-bold text-brand-600 dark:text-brand-400">
                    {formatCurrency(del.totalCost)}
                  </td>
                  <td className="px-4 py-3.5 text-center text-xs text-zinc-500 dark:text-slate-400">
                    {del.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { MetricCard } from '@/components/ui/MetricCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatLitres } from '@/lib/utils/formatters';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);

  const [cashSummary, setCashSummary] = useState({
    totalShiftCashInflow: 42500,
    totalOwnerCollected: 25000,
    remainingExpectedCash: 17500,
  });

  const [fuelStock, setFuelStock] = useState({
    petrolStock: 9450.5,
    petrolPrice: 102.5,
    dieselStock: 14200.0,
    dieselPrice: 89.8,
  });

  const [creditDue, setCreditDue] = useState(46500.0);
  const [totalExpenses, setTotalExpenses] = useState(19550.0);

  useEffect(() => {
    async function loadAdminData() {
      setLoading(true);
      try {
        const [cashRes, fuelRes, credRes, expRes] = await Promise.all([
          fetch('/api/cash/ledger'),
          fetch('/api/fuel/transactions'),
          fetch('/api/credit/customers'),
          fetch('/api/expenses'),
        ]);

        const cashJson = await cashRes.json();
        if (cashJson.success && cashJson.data && cashJson.data.summary) {
          setCashSummary(cashJson.data.summary);
        }

        const fuelJson = await fuelRes.json();
        if (fuelJson.success && fuelJson.data) {
          const prices = fuelJson.data.prices || { PETROL: 102.5, DIESEL: 89.8 };
          const summary = fuelJson.data.summary || { petrolStock: 9450.5, dieselStock: 14200.0 };
          setFuelStock({
            petrolStock: summary.petrolStock,
            petrolPrice: prices.PETROL,
            dieselStock: summary.dieselStock,
            dieselPrice: prices.DIESEL,
          });
        }

        const credJson = await credRes.json();
        if (credJson.success && credJson.data) {
          setCreditDue(credJson.data.totalOutstanding || 0);
        }

        const expJson = await expRes.json();
        if (expJson.success && expJson.data) {
          setTotalExpenses(expJson.data.totalAmount || 0);
        }
      } catch {
        // Fallbacks
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, []);

  const totalRevenue = cashSummary.totalShiftCashInflow + 18200 + creditDue;

  const paymentBreakdown = [
    { method: 'Cash (Physical Inflow)', amount: cashSummary.totalShiftCashInflow, percentage: '51.4%', color: 'bg-emerald-500' },
    { method: 'UPI (QR / Digital)', amount: 18200, percentage: '22.0%', color: 'bg-blue-500' },
    { method: 'Credit Customer Dues', amount: creditDue, percentage: '18.5%', color: 'bg-amber-500' },
    { method: 'Card / POS Swiping', amount: 9300, percentage: '8.1%', color: 'bg-purple-500' },
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
          label="Total Business Revenue"
          value={formatCurrency(totalRevenue)}
          subtitle="+8.4% monthly growth"
          variant="primary"
          icon={<TrendingUp size={18} />}
        />

        <MetricCard
          label="Physical Cash Available"
          value={formatCurrency(cashSummary.remainingExpectedCash)}
          subtitle={`Owner Collected: ${formatCurrency(cashSummary.totalOwnerCollected)}`}
          variant="success"
          icon={<Banknote size={18} />}
        />

        <MetricCard
          label="Customer Credit Dues"
          value={formatCurrency(creditDue)}
          subtitle="Total outstanding due"
          variant="danger"
          icon={<CreditCard size={18} />}
        />

        <MetricCard
          label="Operational Expenses"
          value={formatCurrency(totalExpenses)}
          subtitle="Recorded utilities & repairs"
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
                {formatLitres(fuelStock.petrolStock)}
              </span>
              <span className="text-xs text-zinc-500 dark:text-slate-400">
                Tank Capacity: 15,000 L
              </span>
            </div>

            {/* Visual Level Bar */}
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.round((fuelStock.petrolStock / 15000) * 100))}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-slate-400 pt-2 border-t border-border-light dark:border-border-dark">
              <span>Current Retail Price: ₹{fuelStock.petrolPrice.toFixed(2)} / L</span>
              <span className="font-semibold text-zinc-900 dark:text-slate-100">
                Stock Valuation: {formatCurrency(fuelStock.petrolStock * fuelStock.petrolPrice)}
              </span>
            </div>
          </div>
        </Card>

        <Card
          title="Diesel (HSD) Inventory"
          subtitle="High Speed Diesel"
          action={<Badge variant="info">Healthy Stock</Badge>}
        >
          <div className="space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold font-mono text-zinc-900 dark:text-slate-100">
                {formatLitres(fuelStock.dieselStock)}
              </span>
              <span className="text-xs text-zinc-500 dark:text-slate-400">
                Tank Capacity: 20,000 L
              </span>
            </div>

            {/* Visual Level Bar */}
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.round((fuelStock.dieselStock / 20000) * 100))}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-slate-400 pt-2 border-t border-border-light dark:border-border-dark">
              <span>Current Retail Price: ₹{fuelStock.dieselPrice.toFixed(2)} / L</span>
              <span className="font-semibold text-zinc-900 dark:text-slate-100">
                Stock Valuation: {formatCurrency(fuelStock.dieselStock * fuelStock.dieselPrice)}
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

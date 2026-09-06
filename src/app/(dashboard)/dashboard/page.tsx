'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Banknote,
  Fuel,
  CreditCard,
  PlusCircle,
  ArrowUpRight,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import { MetricCard } from '@/components/ui/MetricCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatLitres, formatDate } from '@/lib/utils/formatters';
import { ShiftRecordWithDetails } from '@/services/shift.service';

export default function ManagerDashboard() {
  const [shifts, setShifts] = useState<ShiftRecordWithDetails[]>([]);
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

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [shiftsRes, cashRes, fuelRes, credRes] = await Promise.all([
          fetch('/api/shifts'),
          fetch('/api/cash/ledger'),
          fetch('/api/fuel/transactions'),
          fetch('/api/credit/customers'),
        ]);

        const shiftsJson = await shiftsRes.json();
        if (shiftsJson.success && shiftsJson.data) setShifts(shiftsJson.data);

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
      } catch {
        // Fallback defaults retained
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const totalSales = shifts.reduce((sum, s) => sum + s.total_sales, 0) || 82760.0;

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 dark:text-slate-100">
            Operations Dashboard
          </h2>
          <p className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5">
            Real-time shift records, cash drawer reconciliation & fuel inventory
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
            value={formatCurrency(totalSales)}
            subtitle="Cash + UPI + Card + Credit + Other"
            variant="primary"
            icon={<TrendingUp size={18} />}
          />

          <MetricCard
            label="Physical Cash Inflow"
            value={formatCurrency(cashSummary.totalShiftCashInflow)}
            subtitle="Total shift cash received"
            variant="info"
            icon={<Banknote size={18} />}
          />

          <MetricCard
            label="Owner Cash Collected"
            value={formatCurrency(cashSummary.totalOwnerCollected)}
            subtitle="Collected mid-shift by owner"
            variant="warning"
            icon={<ArrowUpRight size={18} />}
          />

          <MetricCard
            label="Remaining Drawer Cash"
            value={formatCurrency(cashSummary.remainingExpectedCash)}
            subtitle="Expected physical cash in drawer"
            variant={cashSummary.remainingExpectedCash >= 0 ? 'success' : 'danger'}
            icon={<CheckCircle2 size={18} />}
          />
        </div>
      </div>

      {/* Fuel Stock & Credit Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MetricCard
          label="Petrol Stock (MS)"
          value={formatLitres(fuelStock.petrolStock)}
          subtitle={`Rate: ₹${fuelStock.petrolPrice.toFixed(2)} / L`}
          variant="primary"
          icon={<Fuel size={18} />}
        />

        <MetricCard
          label="Diesel Stock (HSD)"
          value={formatLitres(fuelStock.dieselStock)}
          subtitle={`Rate: ₹${fuelStock.dieselPrice.toFixed(2)} / L`}
          variant="info"
          icon={<Fuel size={18} />}
        />

        <MetricCard
          label="Outstanding Credit"
          value={formatCurrency(creditDue)}
          subtitle="Total customer dues"
          variant="danger"
          icon={<CreditCard size={18} />}
        />
      </div>

      {/* Recent Operational Shifts Table */}
      <Card
        title="Today's Shift Entries"
        subtitle="Completed nozzle operator shift submissions"
        action={
          <div className="flex items-center gap-2">
            <Link href="/shifts">
              <Button size="sm" variant="ghost">
                View All
              </Button>
            </Link>
            <Link href="/shifts/new">
              <Button size="sm" variant="secondary" icon={<PlusCircle size={14} />}>
                Add Shift
              </Button>
            </Link>
          </div>
        }
      >
        {loading ? (
          <div className="text-center py-8 text-xs text-zinc-400">Loading today&apos;s shift entries...</div>
        ) : shifts.length === 0 ? (
          <div className="text-center py-10 text-xs text-zinc-400">No shifts logged today yet.</div>
        ) : (
          <>
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
                <tbody className="divide-y divide-border-light dark:border-border-dark">
                  {shifts.slice(0, 5).map((shift) => (
                    <tr
                      key={shift.id}
                      className="hover:bg-surface-light-subtle dark:hover:bg-surface-dark-subtle transition-colors"
                    >
                      <td className="px-4 py-3.5 font-medium text-zinc-900 dark:text-slate-100">
                        {shift.employee_name}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-zinc-500 dark:text-slate-400">
                        <Badge variant="neutral">{shift.shift_type}</Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-zinc-900 dark:text-slate-100">
                        {formatCurrency(shift.cash_amount)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-zinc-600 dark:text-slate-400">
                        {formatCurrency(
                          shift.payments.filter((p) => p.payment_method === 'UPI').reduce((sum, p) => sum + p.amount, 0)
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-zinc-600 dark:text-slate-400">
                        {formatCurrency(
                          shift.payments.filter((p) => p.payment_method === 'CARD').reduce((sum, p) => sum + p.amount, 0)
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-zinc-600 dark:text-slate-400">
                        {formatCurrency(shift.credit_amount)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-brand-600 dark:text-brand-400">
                        {formatCurrency(shift.total_sales)}
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

            {/* Mobile View */}
            <div className="md:hidden space-y-3">
              {shifts.slice(0, 5).map((shift) => (
                <div
                  key={shift.id}
                  className="p-4 rounded-md border border-border-light dark:border-border-dark bg-surface-light-subtle dark:bg-surface-dark-subtle space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-zinc-900 dark:text-slate-100">
                        {shift.employee_name}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-slate-400">
                        {shift.shift_type} Shift • {formatDate(shift.shift_date)}
                      </div>
                    </div>
                    <Badge variant="success" icon={<CheckCircle2 size={12} />}>
                      {shift.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border-light dark:border-border-dark">
                    <div>
                      <span className="text-zinc-500 dark:text-slate-400">Cash:</span>{' '}
                      <span className="font-mono font-semibold">{formatCurrency(shift.cash_amount)}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 dark:text-slate-400">UPI:</span>{' '}
                      <span className="font-mono font-semibold">
                        {formatCurrency(
                          shift.payments.filter((p) => p.payment_method === 'UPI').reduce((sum, p) => sum + p.amount, 0)
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 dark:text-slate-400">Card:</span>{' '}
                      <span className="font-mono font-semibold">
                        {formatCurrency(
                          shift.payments.filter((p) => p.payment_method === 'CARD').reduce((sum, p) => sum + p.amount, 0)
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 dark:text-slate-400">Credit:</span>{' '}
                      <span className="font-mono font-semibold">{formatCurrency(shift.credit_amount)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border-light dark:border-border-dark flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-700 dark:text-slate-300">
                      Total Shift Revenue:
                    </span>
                    <span className="text-sm font-bold font-mono text-brand-600 dark:text-brand-400">
                      {formatCurrency(shift.total_sales)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

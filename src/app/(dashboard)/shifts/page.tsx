'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PlusCircle,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  Banknote,
  Search,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { ShiftRecordWithDetails } from '@/services/shift.service';

export default function ShiftsHistoryPage() {
  const [shifts, setShifts] = useState<ShiftRecordWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const url = dateFilter ? `/api/shifts?date=${dateFilter}` : '/api/shifts';
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        setShifts(json.data);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, [dateFilter]);

  const filteredShifts = shifts.filter((s) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (s.employee_name && s.employee_name.toLowerCase().includes(term)) ||
      s.shift_type.toLowerCase().includes(term) ||
      (s.notes && s.notes.toLowerCase().includes(term))
    );
  });

  const totalCollected = filteredShifts.reduce((sum, s) => sum + s.total_sales, 0);
  const totalPhysicalCash = filteredShifts.reduce(
    (sum, s) => sum + (s.total_physical_cash ?? s.cash_amount),
    0
  );
  const totalDigital = filteredShifts.reduce((sum, s) => sum + s.digital_amount, 0);
  const totalCreditRepayments = filteredShifts.reduce(
    (sum, s) => sum + (s.credit_repayments_total ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 dark:text-slate-100 flex items-center gap-2">
            <Clock size={22} className="text-brand-600 dark:text-brand-400" />
            <span>Shift Entry Log & Records</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5">
            Historical shift records, employee sales breakdown & payment reconciliations
          </p>
        </div>

        <Link href="/shifts/new">
          <Button icon={<PlusCircle size={16} />}>
            New Shift Entry
          </Button>
        </Link>
      </div>

      {/* Summary Aggregate Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
          <div className="text-xs font-semibold text-zinc-500 dark:text-slate-400 uppercase">
            Total Revenue Logged
          </div>
          <div className="text-xl font-bold font-mono text-brand-600 dark:text-brand-400 mt-1">
            {formatCurrency(totalCollected)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">
            From {filteredShifts.length} shift records
          </div>
        </div>

        <div className="p-4 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
          <div className="text-xs font-semibold text-zinc-500 dark:text-slate-400 uppercase">
            Physical Cash Logged
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(totalPhysicalCash)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">
            Added to station cash ledger
          </div>
        </div>

        <div className="p-4 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
          <div className="text-xs font-semibold text-zinc-500 dark:text-slate-400 uppercase">
            Digital Collections (UPI + Card)
          </div>
          <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">
            {formatCurrency(totalDigital)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">
            Settled to station bank accounts
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by operator or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 min-h-touch rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm outline-none focus:border-brand-600 text-zinc-900 dark:text-slate-100 placeholder-zinc-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-zinc-400 shrink-0 hidden sm:block" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="min-h-touch px-3 py-2 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-xs font-medium text-zinc-700 dark:text-slate-300 outline-none"
          />
          {dateFilter && (
            <Button size="sm" variant="ghost" onClick={() => setDateFilter('')}>
              Clear Date
            </Button>
          )}
        </div>
      </div>

      {/* Shift Records */}
      <Card
        title={`Recorded Shift Log (${filteredShifts.length})`}
        subtitle="Chronological shift submissions"
      >
        {loading ? (
          <div className="text-center py-10 text-xs text-zinc-400">Loading shift records...</div>
        ) : filteredShifts.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="w-12 h-12 rounded-full bg-surface-light-subtle dark:bg-surface-dark-subtle text-zinc-400 mx-auto flex items-center justify-center">
              <Clock size={24} />
            </div>
            <div className="text-sm font-semibold text-zinc-700 dark:text-slate-300">
              No shift records found
            </div>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {dateFilter
                ? 'No shifts recorded for this specific date.'
                : 'Click "New Shift Entry" to log operator shifts and collections.'}
            </p>
            <Link href="/shifts/new">
              <Button size="sm" icon={<PlusCircle size={14} />}>
                Record Shift
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredShifts.map((shift) => (
              <div
                key={shift.id}
                className="p-4 rounded-md border border-border-light dark:border-border-dark bg-surface-light-subtle dark:bg-surface-dark-subtle space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-zinc-900 dark:text-slate-100">
                        {shift.employee_name}
                      </span>
                      <Badge variant="neutral">{shift.shift_type}</Badge>
                      <Badge variant="success" icon={<CheckCircle2 size={12} />}>
                        {shift.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5">
                      Shift Date: <span className="font-semibold">{formatDate(shift.shift_date)}</span> • Logged by: {shift.entered_by_name || 'Manager'}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-zinc-500 dark:text-slate-400">Total Shift Revenue</div>
                    <div className="text-lg font-bold font-mono text-brand-600 dark:text-brand-400">
                      {formatCurrency(shift.total_sales)}
                    </div>
                  </div>
                </div>

                {/* Nozzle Summary (if available) */}
                {shift.nozzle_readings && shift.nozzle_readings.length > 0 && (
                  <div className="p-2.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                        <span>Nozzle Readings ({shift.nozzle_readings.length}):</span>
                        <span className="font-mono text-brand-600 dark:text-brand-400 font-bold">
                          {shift.total_fuel_litres?.toFixed(2)} Litres
                        </span>
                      </div>
                      {typeof shift.reconciliation_variance === 'number' && (
                        shift.reconciliation_variance === 0 ? (
                          <Badge variant="success">Balanced</Badge>
                        ) : shift.reconciliation_variance > 0 ? (
                          <Badge variant="info">Excess +{formatCurrency(shift.reconciliation_variance)}</Badge>
                        ) : (
                          <Badge variant="danger">Shortage {formatCurrency(shift.reconciliation_variance)}</Badge>
                        )
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      {shift.nozzle_readings.map((nr, idx) => (
                        <span
                          key={nr.id || idx}
                          className="px-2 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-zinc-700 dark:text-zinc-300"
                        >
                          <strong>{nr.nozzle_name}</strong> ({nr.fuel_type}): {nr.litres_sold.toFixed(2)}L @ ₹{nr.price_per_litre}/L = {formatCurrency(nr.sales_amount)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Credit Book Payments Received (if any) */}
                {((shift.credit_repayments_total ?? 0) > 0 ||
                  (shift.credit_payments && shift.credit_payments.length > 0)) && (
                  <div className="p-2.5 rounded bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1.5 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                        <span>Credit Received (Repayments):</span>
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                          {formatCurrency(shift.credit_repayments_total ?? 0)}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Cash: <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(shift.credit_repayments_cash ?? 0)}</span> • Digital: <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(shift.credit_repayments_digital ?? 0)}</span>
                      </div>
                    </div>
                    {shift.credit_payments && shift.credit_payments.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 text-[11px]">
                        {shift.credit_payments.map((cp, idx) => (
                          <span
                            key={cp.id || idx}
                            className="px-2 py-0.5 rounded bg-white dark:bg-zinc-800 border border-emerald-200 dark:border-emerald-900 font-mono text-zinc-700 dark:text-zinc-300"
                          >
                            <strong>{cp.customer_name || 'Customer'}</strong>: {formatCurrency(cp.amount)} ({cp.payment_method})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Breakdown Tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border-light dark:border-border-dark text-xs">
                  <div className="p-2 rounded-sm bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark">
                    <span className="text-zinc-500 dark:text-slate-400 block text-[10px] uppercase">
                      {(shift.credit_repayments_cash ?? 0) > 0 ? 'Total Physical Cash' : 'Cash'}
                    </span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(shift.total_physical_cash ?? shift.cash_amount)}
                    </span>
                    {(shift.credit_repayments_cash ?? 0) > 0 && (
                      <span className="text-[9px] text-zinc-400 block">
                        (Sales: {formatCurrency(shift.cash_amount)} + Repay: {formatCurrency(shift.credit_repayments_cash ?? 0)})
                      </span>
                    )}
                  </div>

                  <div className="p-2 rounded-sm bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark">
                    <span className="text-zinc-500 dark:text-slate-400 block text-[10px] uppercase">UPI / QR</span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(
                        shift.payments.filter((p) => p.payment_method === 'UPI').reduce((sum, p) => sum + p.amount, 0)
                      )}
                    </span>
                  </div>

                  <div className="p-2 rounded-sm bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark">
                    <span className="text-zinc-500 dark:text-slate-400 block text-[10px] uppercase">Card POS</span>
                    <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                      {formatCurrency(
                        shift.payments.filter((p) => p.payment_method === 'CARD').reduce((sum, p) => sum + p.amount, 0)
                      )}
                    </span>
                  </div>

                  <div className="p-2 rounded-sm bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark">
                    <span className="text-zinc-500 dark:text-slate-400 block text-[10px] uppercase">Credit Given</span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      {formatCurrency(shift.credit_amount)}
                    </span>
                  </div>
                </div>

                {shift.notes && (
                  <div className="text-xs text-zinc-500 dark:text-slate-400 italic">
                    Note: &quot;{shift.notes}&quot;
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

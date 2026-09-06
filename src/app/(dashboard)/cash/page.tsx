'use client';

import React, { useState, useEffect } from 'react';
import {
  Banknote,
  ArrowDownLeft,
  ArrowUpRight,
  PlusCircle,
  CheckCircle2,
  SlidersHorizontal,
  Filter,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils/formatters';
import { OwnerCollectionModal } from '@/components/cash/OwnerCollectionModal';
import { CashAdjustmentModal } from '@/components/cash/CashAdjustmentModal';

export default function CashLedgerPage() {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalShiftCashInflow: 0,
    totalCreditCashInflow: 0,
    totalOwnerCollected: 0,
    totalAdjustments: 0,
    remainingExpectedCash: 0,
  });

  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (dateFilter) query.set('date', dateFilter);
      if (typeFilter) query.set('type', typeFilter);

      const res = await fetch(`/api/cash/ledger?${query.toString()}`);
      const json = await res.json();

      if (json.data) {
        setEntries(json.data.entries || []);
        if (json.data.summary) {
          setSummary(json.data.summary);
        }
      }
    } catch {
      // Fallback handled by API
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [dateFilter, typeFilter]);

  const handleTransactionSuccess = () => {
    fetchLedger();
  };

  return (
    <div className="space-y-6">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 dark:text-slate-100 flex items-center gap-2">
            <Banknote size={22} className="text-brand-600 dark:text-brand-400" />
            <span>Cash Ledger & Reconciliation</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5">
            Zero double-counting physical drawer tracking for collections, owner withdrawals & adjustments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsAdjustmentModalOpen(true)}
            icon={<SlidersHorizontal size={15} />}
          >
            Cash Drawer Adjustment
          </Button>
          <Button
            size="sm"
            onClick={() => setIsCollectModalOpen(true)}
            icon={<PlusCircle size={15} />}
          >
            Record Owner Collection
          </Button>
        </div>
      </div>

      {/* Cash Reconciliation Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Shift Cash Received"
          value={formatCurrency(summary.totalShiftCashInflow)}
          subtitle="Physical shift cash collected"
          variant="info"
          icon={<ArrowDownLeft size={18} />}
        />

        <MetricCard
          label="Credit Cash Repayments"
          value={formatCurrency(summary.totalCreditCashInflow)}
          subtitle="Cash paid towards credit"
          variant="primary"
          icon={<ArrowDownLeft size={18} />}
        />

        <MetricCard
          label="Owner Cash Withdrawals"
          value={formatCurrency(summary.totalOwnerCollected)}
          subtitle="Total cash handed to owner"
          variant="warning"
          icon={<ArrowUpRight size={18} />}
        />

        <MetricCard
          label="Drawer Available Cash"
          value={formatCurrency(summary.remainingExpectedCash)}
          subtitle="Expected balance in physical drawer"
          variant={summary.remainingExpectedCash >= 0 ? 'success' : 'danger'}
          icon={<CheckCircle2 size={18} />}
        />
      </div>

      {/* Live Ledger Activity & Filter Toolbar */}
      <Card
        title="Live Cash Ledger Activity"
        subtitle="Chronological transaction record of all shift cash, credit payments, withdrawals & adjustments"
        action={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={fetchLedger} icon={<RefreshCw size={14} />}>
              Refresh
            </Button>
          </div>
        }
      >
        {/* Filters */}
        <div className="mb-4 pb-4 border-b border-border-light dark:border-border-dark flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-slate-400">
            <Filter size={14} />
            <span>Filter Ledger:</span>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-1.5 border border-border-light dark:border-border-dark rounded-md px-2.5 py-1 bg-surface-light dark:bg-surface-dark text-xs">
            <Calendar size={13} className="text-zinc-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent text-zinc-800 dark:text-slate-200 outline-none"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                className="text-zinc-400 hover:text-zinc-600 text-xs ml-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Type Selector */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-border-light dark:border-border-dark rounded-md px-2.5 py-1.5 bg-surface-light dark:bg-surface-dark text-xs text-zinc-800 dark:text-slate-200 outline-none"
          >
            <option value="">All Transaction Types</option>
            <option value="SHIFT_CASH">Shift Cash Inflow</option>
            <option value="OWNER_COLLECTION">Owner Collection</option>
            <option value="CREDIT_CASH_PAYMENT">Credit Cash Repayment</option>
            <option value="ADJUSTMENT">Drawer Adjustment</option>
          </select>
        </div>

        {/* Stream List */}
        {loading ? (
          <div className="py-12 text-center text-xs text-zinc-400">Loading cash ledger...</div>
        ) : entries.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400">No cash transactions found for the selected filter.</div>
        ) : (
          <div className="divide-y divide-border-light dark:divide-border-dark">
            {entries.map((entry) => {
              const isInflow = entry.is_inflow || entry.amount > 0;
              return (
                <div key={entry.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        entry.entry_type === 'OWNER_COLLECTION'
                          ? 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                          : entry.entry_type === 'ADJUSTMENT'
                          ? entry.amount >= 0
                            ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                            : 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400'
                          : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {isInflow ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-zinc-900 dark:text-slate-100">
                          {entry.title || entry.entry_type}
                        </span>
                        <Badge
                          variant={
                            entry.entry_type === 'SHIFT_CASH'
                              ? 'info'
                              : entry.entry_type === 'OWNER_COLLECTION'
                              ? 'warning'
                              : entry.entry_type === 'CREDIT_CASH_PAYMENT'
                              ? 'success'
                              : 'neutral'
                          }
                        >
                          {entry.entry_type}
                        </Badge>
                      </div>

                      <div className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-1.5">
                        <span>{entry.notes || 'No description'}</span>
                        <span>•</span>
                        <span>Recorded by {entry.creator_name || 'Staff'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-base font-bold font-mono ${
                        entry.amount > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : entry.amount < 0
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-zinc-600 dark:text-slate-400'
                      }`}
                    >
                      {entry.amount > 0 ? '+' : ''}
                      {formatCurrency(entry.amount)}
                    </div>
                    <div className="text-[11px] text-zinc-400 dark:text-slate-500">
                      {formatDate(entry.occurred_at)} {formatTime(entry.occurred_at)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modals */}
      <OwnerCollectionModal
        isOpen={isCollectModalOpen}
        onClose={() => setIsCollectModalOpen(false)}
        onSuccess={handleTransactionSuccess}
        availableCash={summary.remainingExpectedCash}
      />

      <CashAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        onSuccess={handleTransactionSuccess}
        currentBalance={summary.remainingExpectedCash}
      />
    </div>
  );
}

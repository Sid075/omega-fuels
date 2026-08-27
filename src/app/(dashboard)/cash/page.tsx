'use client';

import React, { useState } from 'react';
import { Banknote, ArrowDownLeft, ArrowUpRight, PlusCircle, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils/formatters';

export default function CashLedgerPage() {
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [collectionAmount, setCollectionAmount] = useState<number>(0);
  const [collectionNotes, setCollectionNotes] = useState('');

  const cashSummary = {
    expectedInflow: 42500.00,
    ownerCollected: 25000.00,
    remainingExpectedCash: 17500.00,
  };

  const cashEntries = [
    {
      id: 'cl_01',
      type: 'SHIFT_CASH',
      title: 'Morning Shift Physical Cash',
      details: 'Shift #shift_01 (Ramesh Kumar)',
      amount: 42500.00,
      timestamp: new Date().toISOString(),
      isInflow: true,
    },
    {
      id: 'cl_02',
      type: 'OWNER_COLLECTION',
      title: 'Owner Mid-Shift Cash Collection',
      details: 'Collected by Owner (Deposit Ref #DEP-449)',
      amount: -25000.00,
      timestamp: new Date().toISOString(),
      isInflow: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 dark:text-slate-100 flex items-center gap-2">
            <Banknote size={22} className="text-brand-600 dark:text-brand-400" />
            <span>Cash Ledger & Owner Reconciliation</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5">
            Zero-double-counting cash tracking for shift collections, repayments & owner withdrawals
          </p>
        </div>

        <Button
          onClick={() => setIsCollectModalOpen(true)}
          icon={<PlusCircle size={16} />}
        >
          Record Owner Collection
        </Button>
      </div>

      {/* Cash Reconciliation KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Total Shift Cash Received"
          value={formatCurrency(cashSummary.expectedInflow)}
          subtitle="Cumulative shift cash inflows"
          variant="info"
          icon={<ArrowDownLeft size={18} />}
        />

        <MetricCard
          label="Owner Cash Collected"
          value={formatCurrency(cashSummary.ownerCollected)}
          subtitle="Total withdrawals collected"
          variant="warning"
          icon={<ArrowUpRight size={18} />}
        />

        <MetricCard
          label="Remaining Expected Cash"
          value={formatCurrency(cashSummary.remainingExpectedCash)}
          subtitle="Running balance in physical drawer"
          variant="success"
          icon={<CheckCircle2 size={18} />}
        />
      </div>

      {/* Cash Event Stream Ledger */}
      <Card
        title="Live Cash Ledger Activity"
        subtitle="Chronological transaction record of all cash receipts and owner withdrawals"
      >
        <div className="divide-y divide-border-light dark:divide-border-dark">
          {cashEntries.map((entry) => (
            <div key={entry.id} className="py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    entry.isInflow
                      ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {entry.isInflow ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                </div>

                <div>
                  <div className="text-sm font-bold text-zinc-900 dark:text-slate-100">
                    {entry.title}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5">
                    {entry.details} • {formatTime(entry.timestamp)}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div
                  className={`text-base font-bold font-mono ${
                    entry.isInflow
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {entry.isInflow ? '+' : ''}
                  {formatCurrency(entry.amount)}
                </div>
                <div className="text-[11px] text-zinc-400 dark:text-slate-500">
                  {formatDate(entry.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Owner Collection Modal */}
      <Modal
        isOpen={isCollectModalOpen}
        onClose={() => setIsCollectModalOpen(false)}
        title="Record Owner Cash Collection"
        subtitle="Record cash collected by the station owner at any point during operations"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCollectModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                alert(`Owner collection of ${formatCurrency(collectionAmount)} recorded!`);
                setIsCollectModalOpen(false);
              }}
            >
              Confirm Collection
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 rounded-md bg-zinc-100 dark:bg-zinc-800/60 text-xs text-zinc-700 dark:text-slate-300">
            Available Drawer Cash Before Collection:{' '}
            <strong className="font-mono">{formatCurrency(cashSummary.remainingExpectedCash)}</strong>
          </div>

          <Input
            label="Amount Collected (₹)"
            type="number"
            placeholder="0.00"
            prefixText="₹"
            value={collectionAmount || ''}
            onChange={(e) => setCollectionAmount(parseFloat(e.target.value) || 0)}
            required
          />

          <Input
            label="Notes / Challan Reference"
            placeholder="e.g. Mid-day bank deposit or cash handover notes"
            value={collectionNotes}
            onChange={(e) => setCollectionNotes(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}

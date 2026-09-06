'use client';

import React, { useState, useEffect } from 'react';
import { Banknote, AlertTriangle, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils/formatters';

interface OwnerCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (collection: any) => void;
  availableCash: number;
}

export function OwnerCollectionModal({
  isOpen,
  onClose,
  onSuccess,
  availableCash,
}: OwnerCollectionModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [collectionTime, setCollectionTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setNotes('');
      // Default to current local datetime string for input type="datetime-local"
      const now = new Date();
      const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setCollectionTime(localIso);
      setError(null);
    }
  }, [isOpen]);

  const numAmount = parseFloat(amount) || 0;
  const isOverWithdrawal = numAmount > availableCash && availableCash > 0;

  const handleQuickAmount = (val: number) => {
    setAmount(val.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) {
      setError('Please enter a valid collection amount greater than 0.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/cash/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numAmount,
          notes: notes.trim() || 'Owner cash withdrawal',
          collected_at: collectionTime ? new Date(collectionTime).toISOString() : new Date().toISOString(),
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error || 'Failed to record owner collection.');
        setLoading(false);
        return;
      }

      onSuccess(json.data);
      onClose();
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Owner Cash Collection"
      subtitle="Withdraw physical cash from the station drawer at any point during operations"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading} icon={<ArrowUpRight size={16} />}>
            Confirm Collection
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Available Drawer Preview */}
        <div className="p-3.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              Current Available Cash in Drawer
            </div>
            <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300 mt-0.5">
              {formatCurrency(availableCash)}
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
            <Banknote size={20} />
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-sm bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {isOverWithdrawal && (
          <div className="p-3 rounded-sm bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            <span>
              Note: Entered collection amount ({formatCurrency(numAmount)}) is higher than current drawer balance ({formatCurrency(availableCash)}).
            </span>
          </div>
        )}

        <div>
          <Input
            label="Collection Amount (₹) *"
            type="number"
            step="any"
            placeholder="0.00"
            prefixText="₹"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            autoFocus
          />

          {/* Quick Amount Buttons */}
          <div className="flex flex-wrap gap-2 mt-2">
            {[10000, 20000, 25000, 50000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleQuickAmount(val)}
                className="px-2.5 py-1 rounded-sm border border-border-light dark:border-border-dark bg-surface-light-subtle dark:bg-surface-dark-subtle text-xs font-semibold text-zinc-700 dark:text-slate-300 hover:border-brand-500 transition-colors"
              >
                ₹{val.toLocaleString('en-IN')}
              </button>
            ))}
            {availableCash > 0 && (
              <button
                type="button"
                onClick={() => handleQuickAmount(availableCash)}
                className="px-2.5 py-1 rounded-sm border border-brand-300 dark:border-brand-800 bg-brand-50 dark:bg-brand-950 text-xs font-bold text-brand-600 dark:text-brand-300 hover:bg-brand-100 transition-colors"
              >
                All Available (₹{availableCash.toLocaleString('en-IN')})
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-700 dark:text-slate-300">
            Collection Timestamp *
          </label>
          <input
            type="datetime-local"
            value={collectionTime}
            onChange={(e) => setCollectionTime(e.target.value)}
            className="w-full min-h-touch px-3.5 py-2.5 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm font-mono text-zinc-900 dark:text-slate-100 outline-none"
            required
          />
        </div>

        <Input
          label="Deposit Reference / Purpose Notes"
          placeholder="e.g. Mid-day SBI bank deposit / Handover to Owner"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {numAmount > 0 && (
          <div className="p-3 rounded-md border border-border-light dark:border-border-dark bg-surface-light-subtle dark:bg-surface-dark-subtle text-xs flex justify-between">
            <span className="text-zinc-500 dark:text-slate-400">Remaining Drawer Cash After Collection:</span>
            <span className="font-mono font-bold text-zinc-900 dark:text-slate-100">
              {formatCurrency(Math.max(0, availableCash - numAmount))}
            </span>
          </div>
        )}
      </form>
    </Modal>
  );
}

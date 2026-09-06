'use client';

import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils/formatters';

interface CashAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (adjustment: any) => void;
  currentBalance: number;
}

export function CashAdjustmentModal({
  isOpen,
  onClose,
  onSuccess,
  currentBalance,
}: CashAdjustmentModalProps) {
  const [adjustmentType, setAdjustmentType] = useState<'ADD' | 'SUBTRACT'>('ADD');
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setReason('');
      setAdjustmentType('ADD');
      setError(null);
    }
  }, [isOpen]);

  const numAmount = parseFloat(amount) || 0;
  const finalAdjustmentAmount = adjustmentType === 'ADD' ? numAmount : -numAmount;
  const projectedBalance = currentBalance + finalAdjustmentAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) {
      setError('Please enter a valid adjustment amount greater than 0.');
      return;
    }
    if (!reason.trim()) {
      setError('Reason is mandatory for all cash drawer adjustments.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/cash/adjustment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAdjustmentAmount,
          reason: reason.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error || 'Failed to record cash adjustment.');
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
      title="Record Cash Drawer Adjustment"
      subtitle="Adjust drawer balance for verified physical cash count shortages or excess"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading} icon={<SlidersHorizontal size={16} />}>
            Save Adjustment
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-sm bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3.5 rounded-md bg-surface-light-subtle dark:bg-surface-dark-subtle border border-border-light dark:border-border-dark flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-600 dark:text-slate-400">Current Ledger Cash:</span>
          <span className="text-base font-bold font-mono text-zinc-900 dark:text-slate-100">
            {formatCurrency(currentBalance)}
          </span>
        </div>

        {/* Adjustment Type Switcher */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setAdjustmentType('ADD')}
            className={`px-3 py-2.5 rounded-md border text-xs font-bold transition-all ${
              adjustmentType === 'ADD'
                ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                : 'border-border-light dark:border-border-dark text-zinc-600 dark:text-slate-400 hover:border-zinc-400'
            }`}
          >
            + Excess Cash Inflow
          </button>
          <button
            type="button"
            onClick={() => setAdjustmentType('SUBTRACT')}
            className={`px-3 py-2.5 rounded-md border text-xs font-bold transition-all ${
              adjustmentType === 'SUBTRACT'
                ? 'bg-red-50 dark:bg-red-950/80 border-red-500 text-red-700 dark:text-red-300'
                : 'border-border-light dark:border-border-dark text-zinc-600 dark:text-slate-400 hover:border-zinc-400'
            }`}
          >
            - Shortage Cash Outflow
          </button>
        </div>

        <Input
          label="Adjustment Amount (₹) *"
          type="number"
          step="any"
          placeholder="0.00"
          prefixText="₹"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        <Input
          label="Mandatory Reason / Audit Note *"
          placeholder="e.g. Physical denomination recount discrepancy verified by manager"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />

        {numAmount > 0 && (
          <div className="p-3 rounded-md border border-border-light dark:border-border-dark bg-surface-light-subtle dark:bg-surface-dark-subtle text-xs flex justify-between">
            <span className="text-zinc-500 dark:text-slate-400">New Projected Drawer Balance:</span>
            <span
              className={`font-mono font-bold ${
                projectedBalance >= 0
                  ? 'text-zinc-900 dark:text-slate-100'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {formatCurrency(projectedBalance)}
            </span>
          </div>
        )}
      </form>
    </Modal>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Receipt, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils/formatters';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EXPENSE_CATEGORIES = [
  'Electricity / Utilities',
  'Maintenance & Repairs',
  'Station Supplies',
  'Staff Food & Refreshments',
  'Generator Fuel & Oil',
  'Government Fees & Taxes',
  'Miscellaneous Operational',
];

export function ExpenseModal({ isOpen, onClose, onSuccess }: ExpenseModalProps) {
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [expenseDate, setExpenseDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCategory(EXPENSE_CATEGORIES[0]);
      setCustomCategory('');
      setDescription('');
      setAmount('');
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setError(null);
    }
  }, [isOpen]);

  const numAmount = parseFloat(amount) || 0;
  const finalCategory = category === 'Other' ? customCategory.trim() || 'Miscellaneous' : category;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide an expense description.');
      return;
    }
    if (numAmount <= 0) {
      setError('Please enter a valid expense amount greater than 0.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: finalCategory,
          description: description.trim(),
          amount: numAmount,
          expense_date: expenseDate || new Date().toISOString().split('T')[0],
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error || 'Failed to record expense.');
        setLoading(false);
        return;
      }

      onSuccess();
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
      title="Record Station Expense"
      subtitle="Log operational overheads, station utilities, maintenance, or supply purchases"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading} icon={<Receipt size={16} />}>
            Record Expense
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

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-700 dark:text-slate-300">
            Expense Category *
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full min-h-touch px-3.5 py-2.5 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm text-zinc-900 dark:text-slate-100 outline-none"
          >
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
            <option value="Other">Other Custom Category...</option>
          </select>
        </div>

        {category === 'Other' && (
          <Input
            label="Custom Category Name *"
            placeholder="e.g. Security Guard Wages / Festival Bonus"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            required
          />
        )}

        <Input
          label="Expense Description *"
          placeholder="e.g. Dispenser Hose replacement or BESCOM electricity bill"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          autoFocus
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Amount Paid (₹) *"
            type="number"
            step="any"
            placeholder="0.00"
            prefixText="₹"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-slate-300">
              Expense Date *
            </label>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full min-h-touch px-3.5 py-2.5 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm font-mono text-zinc-900 dark:text-slate-100 outline-none"
              required
            />
          </div>
        </div>

        {numAmount > 0 && (
          <div className="p-3 rounded-md border border-border-light dark:border-border-dark bg-surface-light-subtle dark:bg-surface-dark-subtle text-xs flex justify-between">
            <span className="text-zinc-500 dark:text-slate-400">Total Expense Amount:</span>
            <span className="font-mono font-bold text-red-600 dark:text-red-400">
              {formatCurrency(numAmount)}
            </span>
          </div>
        )}
      </form>
    </Modal>
  );
}

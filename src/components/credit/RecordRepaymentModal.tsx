'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, Banknote, QrCode, AlertCircle, ArrowDownLeft } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils/formatters';
import { CreditPaymentMethod } from '@/types';

interface RecordRepaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customers: any[];
  defaultCustomerId?: string;
}

export function RecordRepaymentModal({
  isOpen,
  onClose,
  onSuccess,
  customers,
  defaultCustomerId,
}: RecordRepaymentModalProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<CreditPaymentMethod>('CASH');
  const [description, setDescription] = useState('');
  const [repaymentTime, setRepaymentTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedCustomerId(defaultCustomerId || (customers[0]?.id || ''));
      setAmount('');
      setPaymentMethod('CASH');
      setDescription('');
      const now = new Date();
      const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setRepaymentTime(localIso);
      setError(null);
    }
  }, [isOpen, defaultCustomerId, customers]);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const outstandingBalance = selectedCustomer?.outstanding_balance || 0;
  const numAmount = parseFloat(amount) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setError('Please select a valid customer.');
      return;
    }
    if (numAmount <= 0) {
      setError('Please enter a valid repayment amount greater than 0.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/credit/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: selectedCustomerId,
          transaction_type: 'PAYMENT_RECEIVED',
          amount: numAmount,
          payment_method: paymentMethod,
          description: description.trim() || `Credit repayment received (${paymentMethod})`,
          transaction_at: repaymentTime ? new Date(repaymentTime).toISOString() : new Date().toISOString(),
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error || 'Failed to record repayment.');
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
      title="Record Credit Repayment"
      subtitle="Receive payment against customer credit balance via Cash, UPI, or Bank Transfer"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading} icon={<ArrowDownLeft size={16} />}>
            Confirm Repayment
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

        {/* Customer Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-700 dark:text-slate-300">
            Select Customer Account *
          </label>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full min-h-touch px-3.5 py-2.5 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm text-zinc-900 dark:text-slate-100 outline-none"
            required
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — Outstanding: {formatCurrency(c.outstanding_balance)}
              </option>
            ))}
          </select>
        </div>

        {/* Customer Balance Banner */}
        {selectedCustomer && (
          <div className="p-3.5 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                Current Due Balance
              </div>
              <div className="text-xl font-bold font-mono text-amber-700 dark:text-amber-300 mt-0.5">
                {formatCurrency(outstandingBalance)}
              </div>
            </div>
            {outstandingBalance > 0 && (
              <button
                type="button"
                onClick={() => setAmount(outstandingBalance.toString())}
                className="px-2.5 py-1 rounded border border-amber-300 dark:border-amber-800 bg-white dark:bg-zinc-900 text-xs font-bold text-amber-800 dark:text-amber-200 hover:bg-amber-100 transition-colors"
              >
                Full Repayment
              </button>
            )}
          </div>
        )}

        {/* Payment Method Switcher */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-700 dark:text-slate-300">
            Payment Mode *
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('CASH')}
              className={`p-2.5 rounded-md border text-left flex flex-col justify-between transition-all ${
                paymentMethod === 'CASH'
                  ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                  : 'border-border-light dark:border-border-dark text-zinc-600 dark:text-slate-400'
              }`}
            >
              <div className="flex items-center gap-1 font-bold text-xs">
                <Banknote size={14} />
                <span>Cash</span>
              </div>
              <span className="text-[10px] text-zinc-500 dark:text-slate-400 mt-1">Updates drawer cash</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('UPI')}
              className={`p-2.5 rounded-md border text-left flex flex-col justify-between transition-all ${
                paymentMethod === 'UPI'
                  ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-500 text-blue-900 dark:text-blue-200'
                  : 'border-border-light dark:border-border-dark text-zinc-600 dark:text-slate-400'
              }`}
            >
              <div className="flex items-center gap-1 font-bold text-xs">
                <QrCode size={14} />
                <span>UPI / QR</span>
              </div>
              <span className="text-[10px] text-zinc-500 dark:text-slate-400 mt-1">Bank direct credit</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('BANK_TRANSFER')}
              className={`p-2.5 rounded-md border text-left flex flex-col justify-between transition-all ${
                paymentMethod === 'BANK_TRANSFER'
                  ? 'bg-purple-50 dark:bg-purple-950/80 border-purple-500 text-purple-900 dark:text-purple-200'
                  : 'border-border-light dark:border-border-dark text-zinc-600 dark:text-slate-400'
              }`}
            >
              <div className="flex items-center gap-1 font-bold text-xs">
                <CreditCard size={14} />
                <span>Bank Tx</span>
              </div>
              <span className="text-[10px] text-zinc-500 dark:text-slate-400 mt-1">NEFT / RTGS</span>
            </button>
          </div>
        </div>

        <Input
          label="Repayment Amount (₹) *"
          type="number"
          step="any"
          placeholder="0.00"
          prefixText="₹"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          autoFocus
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-700 dark:text-slate-300">
            Payment Date & Time *
          </label>
          <input
            type="datetime-local"
            value={repaymentTime}
            onChange={(e) => setRepaymentTime(e.target.value)}
            className="w-full min-h-touch px-3.5 py-2.5 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm font-mono text-zinc-900 dark:text-slate-100 outline-none"
            required
          />
        </div>

        <Input
          label="Receipt Reference / Remarks"
          placeholder="e.g. Counter Cash Receipt #REC-981 / UTR #38941299"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {numAmount > 0 && selectedCustomer && (
          <div className="p-3 rounded-md border border-border-light dark:border-border-dark bg-surface-light-subtle dark:bg-surface-dark-subtle text-xs flex justify-between">
            <span className="text-zinc-500 dark:text-slate-400">New Due Balance After Payment:</span>
            <span className="font-mono font-bold text-zinc-900 dark:text-slate-100">
              {formatCurrency(Math.max(0, outstandingBalance - numAmount))}
            </span>
          </div>
        )}
      </form>
    </Modal>
  );
}

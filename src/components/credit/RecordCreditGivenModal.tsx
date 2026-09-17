'use client';

import React, { useState, useEffect } from 'react';
import { PlusCircle, AlertCircle, Fuel, ArrowUpRight } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils/formatters';

interface RecordCreditGivenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customers: any[];
  defaultCustomerId?: string;
}

export function RecordCreditGivenModal({
  isOpen,
  onClose,
  onSuccess,
  customers,
  defaultCustomerId,
}: RecordCreditGivenModalProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [slipNo, setSlipNo] = useState('');
  const [transactionTime, setTransactionTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedCustomerId(defaultCustomerId || (customers[0]?.id || ''));
      setAmount('');
      setDescription('');
      setVehicleNo('');
      setSlipNo('');
      const now = new Date();
      const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setTransactionTime(localIso);
      setError(null);
    }
  }, [isOpen, defaultCustomerId, customers]);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const currentBalance = selectedCustomer?.outstanding_balance || 0;
  const numAmount = parseFloat(amount) || 0;
  const projectedBalance = currentBalance + numAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setError('Please select a customer account.');
      return;
    }
    if (numAmount <= 0) {
      setError('Please enter a valid credit amount greater than 0.');
      return;
    }

    setLoading(true);
    setError(null);

    // Assemble descriptive metadata
    const details = [
      description.trim(),
      vehicleNo.trim() ? `Vehicle: ${vehicleNo.trim().toUpperCase()}` : '',
      slipNo.trim() ? `Slip/Chit #${slipNo.trim()}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    try {
      const res = await fetch('/api/credit/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: selectedCustomerId,
          transaction_type: 'CREDIT_GIVEN',
          amount: numAmount,
          description: details || 'Fuel/Product issued on credit',
          transaction_at: transactionTime
            ? new Date(transactionTime).toISOString()
            : new Date().toISOString(),
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error || 'Failed to record credit given.');
        setLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError('Network connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Credit Given (Issue Credit)"
      subtitle="Issue fuel or lubricants on credit to a registered customer account (increases outstanding balance)"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={loading}
            icon={<ArrowUpRight size={16} />}
          >
            Confirm Credit Given
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
            className="w-full min-h-touch px-3.5 py-2.5 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm text-zinc-900 dark:text-slate-100 outline-none focus:border-brand-600"
            required
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — Current Due: {formatCurrency(c.outstanding_balance)}
              </option>
            ))}
          </select>
        </div>

        {/* Balance Impact Preview */}
        {selectedCustomer && (
          <div className="p-3.5 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300 block">
                Current Due Balance
              </span>
              <span className="font-mono text-base font-bold text-zinc-900 dark:text-slate-100">
                {formatCurrency(currentBalance)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300 block">
                New Projected Balance (+Credit)
              </span>
              <span className="font-mono text-base font-bold text-red-600 dark:text-red-400">
                {formatCurrency(projectedBalance)}
              </span>
            </div>
          </div>
        )}

        {/* Amount Input */}
        <Input
          label="Credit Amount Given *"
          type="number"
          step="any"
          placeholder="0.00"
          prefixText="₹"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          autoFocus
        />

        {/* Optional Vehicle & Chit / Slip Numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Vehicle / Fleet Number (Optional)"
            placeholder="e.g. MH-12-AB-1234 / Tractor"
            value={vehicleNo}
            onChange={(e) => setVehicleNo(e.target.value)}
          />

          <Input
            label="Chit / Slip Number (Optional)"
            placeholder="e.g. SLIP-8842"
            value={slipNo}
            onChange={(e) => setSlipNo(e.target.value)}
          />
        </div>

        {/* Description / Item Details */}
        <Input
          label="Product / Fuel Description (Optional)"
          placeholder="e.g. 50L Diesel / 20W40 1L Engine Oil"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Transaction Date & Time */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-700 dark:text-slate-300">
            Transaction Date & Time *
          </label>
          <input
            type="datetime-local"
            value={transactionTime}
            onChange={(e) => setTransactionTime(e.target.value)}
            className="w-full min-h-touch px-3.5 py-2.5 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm text-zinc-900 dark:text-slate-100 outline-none font-mono focus:border-brand-600"
            required
          />
        </div>
      </form>
    </Modal>
  );
}

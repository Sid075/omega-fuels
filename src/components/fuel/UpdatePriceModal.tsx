'use client';

import React, { useState, useEffect } from 'react';
import { Tag, CheckCircle2, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FuelType } from '@/types';
import { formatCurrency } from '@/lib/utils/formatters';

interface UpdatePriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentPrices: { PETROL: number; DIESEL: number };
}

export function UpdatePriceModal({
  isOpen,
  onClose,
  onSuccess,
  currentPrices,
}: UpdatePriceModalProps) {
  const [fuelType, setFuelType] = useState<FuelType>('PETROL');
  const [price, setPrice] = useState<string>('');
  const [effectiveTime, setEffectiveTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFuelType('PETROL');
      setPrice(currentPrices.PETROL.toString());
      const now = new Date();
      const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setEffectiveTime(localIso);
      setError(null);
    }
  }, [isOpen, currentPrices]);

  const handleFuelTypeChange = (type: FuelType) => {
    setFuelType(type);
    setPrice((type === 'PETROL' ? currentPrices.PETROL : currentPrices.DIESEL).toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setError('Please enter a valid price per litre greater than 0.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/fuel/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fuel_type: fuelType,
          price_per_litre: numPrice,
          effective_at: effectiveTime ? new Date(effectiveTime).toISOString() : new Date().toISOString(),
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error || 'Failed to update fuel price.');
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
      title="Update Fuel Selling Price"
      subtitle="Configure current rate per litre for Petrol (MS) or Diesel (HSD)"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading} icon={<Tag size={16} />}>
            Update Rate
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

        {/* Fuel Type Switcher */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleFuelTypeChange('PETROL')}
            className={`p-3 rounded-md border text-left flex flex-col justify-between transition-all ${
              fuelType === 'PETROL'
                ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                : 'border-border-light dark:border-border-dark text-zinc-600 dark:text-slate-400 hover:border-zinc-400'
            }`}
          >
            <span className="text-xs font-bold uppercase tracking-wide">Petrol (MS)</span>
            <span className="text-sm font-mono font-semibold mt-1">
              Current: {formatCurrency(currentPrices.PETROL)}/L
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleFuelTypeChange('DIESEL')}
            className={`p-3 rounded-md border text-left flex flex-col justify-between transition-all ${
              fuelType === 'DIESEL'
                ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-500 text-blue-900 dark:text-blue-200'
                : 'border-border-light dark:border-border-dark text-zinc-600 dark:text-slate-400 hover:border-zinc-400'
            }`}
          >
            <span className="text-xs font-bold uppercase tracking-wide">Diesel (HSD)</span>
            <span className="text-sm font-mono font-semibold mt-1">
              Current: {formatCurrency(currentPrices.DIESEL)}/L
            </span>
          </button>
        </div>

        <Input
          label={`New Selling Rate for ${fuelType === 'PETROL' ? 'Petrol (MS)' : 'Diesel (HSD)'} (₹/Litre) *`}
          type="number"
          step="0.01"
          placeholder="0.00"
          prefixText="₹"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          autoFocus
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-700 dark:text-slate-300">
            Effective Timestamp *
          </label>
          <input
            type="datetime-local"
            value={effectiveTime}
            onChange={(e) => setEffectiveTime(e.target.value)}
            className="w-full min-h-touch px-3.5 py-2.5 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm font-mono text-zinc-900 dark:text-slate-100 outline-none"
            required
          />
        </div>
      </form>
    </Modal>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FuelType } from '@/types';

interface AdjustStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdjustStockModal({
  isOpen,
  onClose,
  onSuccess,
}: AdjustStockModalProps) {
  const [fuelType, setFuelType] = useState<FuelType>('PETROL');
  const [adjustmentType, setAdjustmentType] = useState<'ADD' | 'SUBTRACT'>('ADD');
  const [quantity, setQuantity] = useState<string>('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFuelType('PETROL');
      setAdjustmentType('ADD');
      setQuantity('');
      setReason('');
      setError(null);
    }
  }, [isOpen]);

  const numQty = parseFloat(quantity) || 0;
  const finalQuantity = adjustmentType === 'ADD' ? numQty : -numQty;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numQty <= 0) {
      setError('Please enter a valid adjustment volume in litres.');
      return;
    }
    if (!reason.trim()) {
      setError('Mandatory audit reason is required for tank stock adjustments.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/fuel/adjustment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fuel_type: fuelType,
          quantity_litres: finalQuantity,
          reason: reason.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error || 'Failed to record stock adjustment.');
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
      title="Record Fuel Tank Stock Adjustment"
      subtitle="Manual stock alignment for dip reading variance, thermal expansion or calibration"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading} icon={<SlidersHorizontal size={16} />}>
            Save Stock Adjustment
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

        {/* Product Switcher */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setFuelType('PETROL')}
            className={`px-3 py-2.5 rounded-md border text-xs font-bold transition-all ${
              fuelType === 'PETROL'
                ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                : 'border-border-light dark:border-border-dark text-zinc-600 dark:text-slate-400'
            }`}
          >
            Petrol (MS) Tank
          </button>
          <button
            type="button"
            onClick={() => setFuelType('DIESEL')}
            className={`px-3 py-2.5 rounded-md border text-xs font-bold transition-all ${
              fuelType === 'DIESEL'
                ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-500 text-blue-700 dark:text-blue-300'
                : 'border-border-light dark:border-border-dark text-zinc-600 dark:text-slate-400'
            }`}
          >
            Diesel (HSD) Tank
          </button>
        </div>

        {/* Adjustment Direction */}
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
            + Excess Volume Gain
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
            - Shortage Volume Loss
          </button>
        </div>

        <Input
          label="Adjustment Volume (Litres) *"
          type="number"
          step="any"
          placeholder="0.0"
          prefixText="L"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
          autoFocus
        />

        <Input
          label="Mandatory Reason / Audit Note *"
          placeholder="e.g. Verified by Dip Chart calibration measurement discrepancy"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />
      </form>
    </Modal>
  );
}

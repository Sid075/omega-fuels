'use client';

import React, { useState, useEffect } from 'react';
import { Fuel, Zap, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FuelType } from '@/types';

interface RecordUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RecordUsageModal({
  isOpen,
  onClose,
  onSuccess,
}: RecordUsageModalProps) {
  const [usageType, setUsageType] = useState<'TEST_USAGE' | 'GENERATOR_USAGE'>('TEST_USAGE');
  const [fuelType, setFuelType] = useState<FuelType>('PETROL');
  const [quantity, setQuantity] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUsageType('TEST_USAGE');
      setFuelType('PETROL');
      setQuantity('');
      setNotes('');
      setError(null);
    }
  }, [isOpen]);

  const numQty = parseFloat(quantity) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numQty <= 0) {
      setError('Please enter a valid fuel volume in litres.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/fuel/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usage_type: usageType,
          fuel_type: usageType === 'TEST_USAGE' ? fuelType : 'DIESEL',
          quantity_litres: numQty,
          notes: notes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error || 'Failed to record fuel usage.');
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
      title="Record Internal Fuel Consumption"
      subtitle="Log non-sale fuel usage for nozzle calibration testing or backup generator power"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading} icon={<Fuel size={16} />}>
            Log Fuel Consumption
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

        {/* Usage Mode Switcher */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setUsageType('TEST_USAGE')}
            className={`p-3 rounded-md border text-left flex flex-col justify-between transition-all ${
              usageType === 'TEST_USAGE'
                ? 'bg-amber-50 dark:bg-amber-950/80 border-amber-500 text-amber-900 dark:text-amber-200'
                : 'border-border-light dark:border-border-dark text-zinc-600 dark:text-slate-400'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <Fuel size={15} />
              <span>Nozzle Test Fuel</span>
            </div>
            <span className="text-[11px] text-zinc-500 dark:text-slate-400 mt-1">
              Calibration litres drawn for accuracy verification
            </span>
          </button>

          <button
            type="button"
            onClick={() => setUsageType('GENERATOR_USAGE')}
            className={`p-3 rounded-md border text-left flex flex-col justify-between transition-all ${
              usageType === 'GENERATOR_USAGE'
                ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-500 text-blue-900 dark:text-blue-200'
                : 'border-border-light dark:border-border-dark text-zinc-600 dark:text-slate-400'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <Zap size={15} />
              <span>Backup Generator</span>
            </div>
            <span className="text-[11px] text-zinc-500 dark:text-slate-400 mt-1">
              Station power outage diesel consumption
            </span>
          </button>
        </div>

        {usageType === 'TEST_USAGE' && (
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
              Petrol (MS) Nozzle
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
              Diesel (HSD) Nozzle
            </button>
          </div>
        )}

        <Input
          label="Volume Consumed (Litres) *"
          type="number"
          step="any"
          placeholder="e.g. 5.0 for test or 25 for generator"
          prefixText="L"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
          autoFocus
        />

        <Input
          label="Purpose / Audit Note"
          placeholder={
            usageType === 'TEST_USAGE'
              ? 'e.g. Morning 5-litre measure test on Dispenser 2'
              : 'e.g. 2.5 hour grid power failure backup run'
          }
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </form>
    </Modal>
  );
}

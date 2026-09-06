'use client';

import React, { useState, useEffect } from 'react';
import { Truck, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FuelType } from '@/types';
import { formatCurrency } from '@/lib/utils/formatters';

interface RecordDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RecordDeliveryModal({
  isOpen,
  onClose,
  onSuccess,
}: RecordDeliveryModalProps) {
  const [fuelType, setFuelType] = useState<FuelType>('PETROL');
  const [quantity, setQuantity] = useState<string>('');
  const [buyingPrice, setBuyingPrice] = useState<string>('');
  const [supplier, setSupplier] = useState('IOCL (Indian Oil)');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [truckNo, setTruckNo] = useState('');
  const [density, setDensity] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFuelType('PETROL');
      setQuantity('');
      setBuyingPrice('');
      setSupplier('IOCL (Indian Oil)');
      setInvoiceNo('');
      setTruckNo('');
      setDensity('');
      setNotes('');
      const now = new Date();
      const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setDeliveryTime(localIso);
      setError(null);
    }
  }, [isOpen]);

  const numQty = parseFloat(quantity) || 0;
  const numBuyingPrice = parseFloat(buyingPrice) || 0;
  const totalCost = numQty * numBuyingPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numQty <= 0) {
      setError('Please enter a valid delivered fuel volume in litres.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/fuel/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fuel_type: fuelType,
          quantity_litres: numQty,
          buying_price_per_litre: numBuyingPrice > 0 ? numBuyingPrice : undefined,
          supplier_name: supplier.trim(),
          invoice_number: invoiceNo.trim() || undefined,
          tanker_truck_number: truckNo.trim() || undefined,
          density_at_15c: density ? parseFloat(density) : undefined,
          delivery_date: deliveryTime ? new Date(deliveryTime).toISOString() : new Date().toISOString(),
          notes: notes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error || 'Failed to record fuel delivery.');
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
      title="Record Fuel Tanker Delivery"
      subtitle="Log incoming tanker decanting volume, invoice reference, and fuel density"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading} icon={<Truck size={16} />}>
            Record Tanker Decanting
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
            Petrol (MS) Tanker
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
            Diesel (HSD) Tanker
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Quantity Delivered (Litres) *"
            type="number"
            step="any"
            placeholder="e.g. 4000"
            prefixText="L"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Buying Price (₹/Litre)"
            type="number"
            step="any"
            placeholder="e.g. 91.50"
            prefixText="₹"
            value={buyingPrice}
            onChange={(e) => setBuyingPrice(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Oil Company Supplier"
            placeholder="e.g. IOCL / HPCL / BPCL"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
          />

          <Input
            label="Challan / Invoice Number"
            placeholder="e.g. CH-994182"
            value={invoiceNo}
            onChange={(e) => setInvoiceNo(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Tanker Truck Number"
            placeholder="e.g. KA-02-F-8841"
            value={truckNo}
            onChange={(e) => setTruckNo(e.target.value)}
          />

          <Input
            label="Density @ 15°C (kg/m³)"
            type="number"
            step="0.1"
            placeholder="e.g. 745.2 for MS / 832.0 for HSD"
            value={density}
            onChange={(e) => setDensity(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-700 dark:text-slate-300">
            Delivery Date & Time *
          </label>
          <input
            type="datetime-local"
            value={deliveryTime}
            onChange={(e) => setDeliveryTime(e.target.value)}
            className="w-full min-h-touch px-3.5 py-2.5 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm font-mono text-zinc-900 dark:text-slate-100 outline-none"
            required
          />
        </div>

        <Input
          label="Decanting Notes"
          placeholder="e.g. Tank 1 decanting verified without water dip discrepancy"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {totalCost > 0 && (
          <div className="p-3 rounded-md border border-border-light dark:border-border-dark bg-surface-light-subtle dark:bg-surface-dark-subtle text-xs flex justify-between">
            <span className="text-zinc-500 dark:text-slate-400">Total Delivery Invoice Cost:</span>
            <span className="font-mono font-bold text-zinc-900 dark:text-slate-100">
              {formatCurrency(totalCost)}
            </span>
          </div>
        )}
      </form>
    </Modal>
  );
}

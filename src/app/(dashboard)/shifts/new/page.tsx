'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Plus, Trash2, Fuel } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency } from '@/lib/utils/formatters';

export default function NewShiftEntryPage() {
  const [employee, setEmployee] = useState('emp_01');
  const [shiftType, setShiftType] = useState<'MORNING' | 'EVENING' | 'NIGHT' | 'CUSTOM'>('MORNING');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Payment Breakdown
  const [cash, setCash] = useState<number>(0);
  const [upi, setUpi] = useState<number>(0);
  const [card, setCard] = useState<number>(0);
  const [credit, setCredit] = useState<number>(0);

  // Other Sales Items
  const [otherSales, setOtherSales] = useState<{ id: string; desc: string; amount: number }[]>([]);

  const totalFuelSales = (cash || 0) + (upi || 0) + (card || 0) + (credit || 0);
  const totalOtherSales = otherSales.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const grandTotal = totalFuelSales + totalOtherSales;

  const addOtherSale = () => {
    setOtherSales([...otherSales, { id: Math.random().toString(), desc: '', amount: 0 }]);
  };

  const removeOtherSale = (id: string) => {
    setOtherSales(otherSales.filter((item) => item.id !== id));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="p-2 rounded-sm hover:bg-surface-light-subtle dark:hover:bg-surface-dark-subtle text-zinc-500">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-slate-100">
            Record Employee Shift
          </h2>
          <p className="text-xs text-zinc-500 dark:text-slate-400">
            Step-by-step entry for nozzle sales, payments, and other products
          </p>
        </div>
      </div>

      {/* Step 1: Shift Context */}
      <Card title="1. Shift & Operator Selection">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-slate-300">
              Shift Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full min-h-touch px-3.5 py-2.5 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-slate-300">
              Select Operator
            </label>
            <select
              value={employee}
              onChange={(e) => setEmployee(e.target.value)}
              className="w-full min-h-touch px-3.5 py-2.5 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm"
            >
              <option value="emp_01">Ramesh Kumar (Dispenser 1 & 2)</option>
              <option value="emp_02">Suresh Verma (Dispenser 3 & 4)</option>
              <option value="emp_03">Vikram Singh (Night Shift)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-slate-300">
              Shift Timing
            </label>
            <select
              value={shiftType}
              onChange={(e: any) => setShiftType(e.target.value)}
              className="w-full min-h-touch px-3.5 py-2.5 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm"
            >
              <option value="MORNING">Morning Shift</option>
              <option value="EVENING">Evening Shift</option>
              <option value="NIGHT">Night Shift</option>
              <option value="CUSTOM">Custom Shift</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Step 2: Payment Breakdown */}
      <Card
        title="2. Payment Collection Breakdown"
        subtitle="Distribute operator cash, QR code digital collections & credit receipts"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Physical Cash Collected"
            type="number"
            placeholder="0.00"
            prefixText="₹"
            value={cash || ''}
            onChange={(e) => setCash(parseFloat(e.target.value) || 0)}
            hint="Contributes directly to physical cash drawer"
          />

          <Input
            label="UPI / QR Payments"
            type="number"
            placeholder="0.00"
            prefixText="₹"
            value={upi || ''}
            onChange={(e) => setUpi(parseFloat(e.target.value) || 0)}
            hint="Bank settled digital receipts"
          />

          <Input
            label="Card / POS Swiping"
            type="number"
            placeholder="0.00"
            prefixText="₹"
            value={card || ''}
            onChange={(e) => setCard(parseFloat(e.target.value) || 0)}
            hint="POS terminal settled payments"
          />

          <Input
            label="Credit Issued to Fleet / Customers"
            type="number"
            placeholder="0.00"
            prefixText="₹"
            value={credit || ''}
            onChange={(e) => setCredit(parseFloat(e.target.value) || 0)}
            hint="Credit bill chits recorded"
          />
        </div>
      </Card>

      {/* Step 3: Other Sales */}
      <Card
        title="3. Other Station Sales (Optional)"
        subtitle="Lubricants, distilled water, 2T oil pouches"
        action={
          <Button size="sm" variant="secondary" onClick={addOtherSale} icon={<Plus size={14} />}>
            Add Item
          </Button>
        }
      >
        {otherSales.length === 0 ? (
          <div className="text-center py-4 text-xs text-zinc-400 dark:text-slate-500">
            No other items added. Click &quot;Add Item&quot; to record oil/lubricant sales.
          </div>
        ) : (
          <div className="space-y-3">
            {otherSales.map((item, index) => (
              <div key={item.id} className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Item description (e.g. 20W40 1L Oil)"
                  value={item.desc}
                  onChange={(e) => {
                    const next = [...otherSales];
                    next[index].desc = e.target.value;
                    setOtherSales(next);
                  }}
                  className="flex-1 min-h-touch px-3.5 py-2 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm"
                />
                <input
                  type="number"
                  placeholder="Amount ₹"
                  value={item.amount || ''}
                  onChange={(e) => {
                    const next = [...otherSales];
                    next[index].amount = parseFloat(e.target.value) || 0;
                    setOtherSales(next);
                  }}
                  className="w-32 min-h-touch px-3.5 py-2 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm font-mono"
                />
                <button
                  onClick={() => removeOtherSale(item.id)}
                  className="p-2 text-zinc-400 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Live Financial Review Summary */}
      <div className="p-5 rounded-lg border-2 border-brand-500/40 bg-brand-50/20 dark:bg-brand-950/30 space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
          Shift Total Review
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold text-zinc-700 dark:text-slate-300">
            Total Business Revenue:
          </span>
          <span className="text-2xl font-bold font-mono text-brand-600 dark:text-brand-400">
            {formatCurrency(grandTotal)}
          </span>
        </div>
        <div className="text-xs text-zinc-500 dark:text-slate-400 flex justify-between border-t border-brand-200 dark:border-brand-900 pt-2">
          <span>Physical Cash to Drawer: {formatCurrency(cash)}</span>
          <span>Digital & Credit: {formatCurrency((upi || 0) + (card || 0) + (credit || 0))}</span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pb-8">
        <Link href="/dashboard">
          <Button variant="secondary">Cancel</Button>
        </Link>
        <Button icon={<CheckCircle2 size={16} />} onClick={() => alert('Shift record submitted and posted to cash ledger!')}>
          Submit Shift Entry
        </Button>
      </div>
    </div>
  );
}

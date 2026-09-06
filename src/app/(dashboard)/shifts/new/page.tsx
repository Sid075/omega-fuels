'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Plus,
  Trash2,
  Banknote,
  Smartphone,
  CreditCard,
  BookOpen,
  Receipt,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils/formatters';
import { Employee, ShiftType } from '@/types';

export default function NewShiftEntryPage() {
  const router = useRouter();

  // Active employees for picker
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  // Form State
  const [employeeId, setEmployeeId] = useState('');
  const [shiftDate, setShiftDate] = useState(new Date().toISOString().split('T')[0]);
  const [shiftType, setShiftType] = useState<ShiftType>('MORNING');
  const [customShiftName, setCustomShiftName] = useState('');
  const [notes, setNotes] = useState('');

  // Payment Breakdown
  const [cash, setCash] = useState<string>('');
  const [upi, setUpi] = useState<string>('');
  const [card, setCard] = useState<string>('');
  const [credit, setCredit] = useState<string>('');
  const [creditCustomerId, setCreditCustomerId] = useState<string>('cust_01');

  // Other Sales Items
  const [otherSales, setOtherSales] = useState<{ id: string; desc: string; amount: string }[]>([]);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [creditCustomers, setCreditCustomers] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [empRes, credRes] = await Promise.all([
          fetch('/api/employees?status=ACTIVE'),
          fetch('/api/credit/customers'),
        ]);

        const empJson = await empRes.json();
        if (empJson.success && empJson.data && empJson.data.length > 0) {
          setEmployees(empJson.data);
          setEmployeeId(empJson.data[0].id);
        }

        const credJson = await credRes.json();
        if (credJson.success && credJson.data && credJson.data.customers) {
          setCreditCustomers(credJson.data.customers);
          if (credJson.data.customers.length > 0) {
            setCreditCustomerId(credJson.data.customers[0].id);
          }
        }
      } catch {
        // Fallback default
        setEmployeeId('emp_01');
      } finally {
        setLoadingEmployees(false);
      }
    }
    loadData();
  }, []);

  // Numerical Calculations
  const numCash = parseFloat(cash) || 0;
  const numUpi = parseFloat(upi) || 0;
  const numCard = parseFloat(card) || 0;
  const numCredit = parseFloat(credit) || 0;

  const totalFuelPayments = numCash + numUpi + numCard + numCredit;
  const totalOtherSales = otherSales.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const grandTotal = totalFuelPayments + totalOtherSales;

  const addOtherSale = () => {
    setOtherSales([
      ...otherSales,
      { id: Math.random().toString(), desc: '', amount: '' },
    ]);
  };

  const removeOtherSale = (id: string) => {
    setOtherSales(otherSales.filter((item) => item.id !== id));
  };

  const handleOtherSaleChange = (index: number, field: 'desc' | 'amount', value: string) => {
    const updated = [...otherSales];
    updated[index][field] = value;
    setOtherSales(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeId) {
      setError('Please select an employee / nozzle operator.');
      return;
    }

    if (grandTotal <= 0) {
      setError('Please enter at least one payment amount or other sales item.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        employee_id: employeeId,
        shift_date: shiftDate,
        shift_type: shiftType,
        custom_shift_name: shiftType === 'CUSTOM' ? customShiftName : null,
        notes: notes.trim() || null,
        payments: [
          { payment_method: 'CASH', amount: numCash },
          { payment_method: 'UPI', amount: numUpi },
          { payment_method: 'CARD', amount: numCard },
          {
            payment_method: 'CREDIT',
            amount: numCredit,
            customer_id: numCredit > 0 ? creditCustomerId : null,
          },
        ],
        other_sales: otherSales
          .filter((item) => (parseFloat(item.amount) || 0) > 0 && item.desc.trim())
          .map((item) => ({
            description: item.desc.trim(),
            amount: parseFloat(item.amount) || 0,
          })),
      };

      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        setError(json.error || 'Failed to submit shift record.');
        setSubmitting(false);
        return;
      }

      // Success -> Redirect to Shifts directory
      router.push('/shifts');
      router.refresh();
    } catch {
      setError('Connection error while saving shift record. Please retry.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="p-2 rounded-sm hover:bg-surface-light-subtle dark:hover:bg-surface-dark-subtle text-zinc-500 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-slate-100">
            Record Employee Shift
          </h2>
          <p className="text-xs text-zinc-500 dark:text-slate-400">
            Atomic reconciliation of nozzle sales, digital receipts & physical cash drawer
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-sm bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Shift & Operator Context */}
        <Card title="1. Shift & Operator Selection">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-slate-300">
                Shift Date *
              </label>
              <input
                type="date"
                value={shiftDate}
                onChange={(e) => setShiftDate(e.target.value)}
                className="w-full min-h-touch px-3.5 py-2.5 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-950 text-zinc-900 dark:text-slate-100 font-mono"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-slate-300">
                Nozzle Operator *
              </label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full min-h-touch px-3.5 py-2.5 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm font-medium text-zinc-900 dark:text-slate-100 outline-none"
                required
              >
                {loadingEmployees ? (
                  <option value="">Loading staff...</option>
                ) : employees.length === 0 ? (
                  <option value="">No active operators found</option>
                ) : (
                  employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} {emp.phone ? `(${emp.phone})` : ''}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-slate-300">
                Shift Schedule *
              </label>
              <select
                value={shiftType}
                onChange={(e: any) => setShiftType(e.target.value)}
                className="w-full min-h-touch px-3.5 py-2.5 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm font-medium text-zinc-900 dark:text-slate-100 outline-none"
                required
              >
                <option value="MORNING">Morning (06:00 - 14:00)</option>
                <option value="EVENING">Evening (14:00 - 22:00)</option>
                <option value="NIGHT">Night (22:00 - 06:00)</option>
                <option value="CUSTOM">Custom Shift</option>
              </select>
            </div>
          </div>

          {shiftType === 'CUSTOM' && (
            <div className="mt-3">
              <Input
                label="Custom Shift Name"
                placeholder="e.g. Festival Special / Overtime Shift"
                value={customShiftName}
                onChange={(e) => setCustomShiftName(e.target.value)}
              />
            </div>
          )}

          <div className="mt-3">
            <Input
              label="Dispenser / Nozzle Notes (Optional)"
              placeholder="e.g. Dispenser 1 Petrol nozzle counter opening 1204.5, closing 1820.0"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </Card>

        {/* Step 2: Payment Collection Breakdown */}
        <Card
          title="2. Payment Collection Breakdown"
          subtitle="Record physical cash, UPI QR codes, Card POS slips and credit chits"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Physical Cash Collected"
                type="number"
                step="any"
                placeholder="0.00"
                prefixText="₹"
                value={cash}
                onChange={(e) => setCash(e.target.value)}
                hint="Enters physical station cash drawer"
              />
            </div>

            <div>
              <Input
                label="UPI / QR Digital Payments"
                type="number"
                step="any"
                placeholder="0.00"
                prefixText="₹"
                value={upi}
                onChange={(e) => setUpi(e.target.value)}
                hint="Settled directly in station bank account"
              />
            </div>

            <div>
              <Input
                label="Card / POS Swiping"
                type="number"
                step="any"
                placeholder="0.00"
                prefixText="₹"
                value={card}
                onChange={(e) => setCard(e.target.value)}
                hint="POS machine merchant batch settled"
              />
            </div>

            <div>
              <Input
                label="Credit Bill / Chit Issued"
                type="number"
                step="any"
                placeholder="0.00"
                prefixText="₹"
                value={credit}
                onChange={(e) => setCredit(e.target.value)}
                hint="Fuel issued on credit account"
              />
            </div>
          </div>

          {numCredit > 0 && (
            <div className="mt-4 p-3.5 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 space-y-2">
              <label className="text-xs font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <BookOpen size={14} />
                <span>Assign Credit To Customer Account:</span>
              </label>
              <select
                value={creditCustomerId}
                onChange={(e) => setCreditCustomerId(e.target.value)}
                className="w-full min-h-touch px-3.5 py-2 rounded-sm border border-amber-300 dark:border-amber-800 bg-surface-light dark:bg-surface-dark text-xs font-semibold text-zinc-900 dark:text-slate-100 outline-none"
              >
                {creditCustomers.length === 0 ? (
                  <option value="walk_in_credit">Walk-in Fleet / Signed Chit</option>
                ) : (
                  creditCustomers.map((cust) => (
                    <option key={cust.id} value={cust.id}>
                      {cust.name} (Due: ₹{(cust.outstanding_balance || 0).toLocaleString('en-IN')})
                    </option>
                  ))
                )}
              </select>
            </div>
          )}
        </Card>

        {/* Step 3: Other Sales Line Items */}
        <Card
          title="3. Other Product Sales (Lubricants, 2T Oil, Water)"
          subtitle="Non-dispenser counter items sold during this shift"
          action={
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={addOtherSale}
              icon={<Plus size={14} />}
            >
              Add Item
            </Button>
          }
        >
          {otherSales.length === 0 ? (
            <div className="text-center py-5 text-xs text-zinc-400 dark:text-slate-500">
              No additional lubricant items recorded for this shift.
            </div>
          ) : (
            <div className="space-y-3">
              {otherSales.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Product name (e.g. Engine Oil 20W40 1L)"
                    value={item.desc}
                    onChange={(e) => handleOtherSaleChange(index, 'desc', e.target.value)}
                    className="flex-1 min-h-touch px-3.5 py-2 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm outline-none focus:border-brand-600 text-zinc-900 dark:text-slate-100"
                    required
                  />
                  <div className="w-32 relative flex items-center">
                    <span className="absolute left-3 text-zinc-400 text-xs font-semibold">₹</span>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={item.amount}
                      onChange={(e) => handleOtherSaleChange(index, 'amount', e.target.value)}
                      className="w-full pl-6 pr-3 min-h-touch py-2 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm font-mono text-zinc-900 dark:text-slate-100 outline-none"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeOtherSale(item.id)}
                    className="p-2 text-zinc-400 hover:text-red-500 min-h-touch min-w-[36px] flex items-center justify-center"
                    aria-label="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Step 4: Live Reconciliation Summary */}
        <div className="p-5 rounded-lg border-2 border-brand-500/40 bg-brand-50/20 dark:bg-brand-950/30 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Shift Reconciliation Summary
            </span>
            <Badge variant="info">Live Calculation</Badge>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <span className="text-sm font-semibold text-zinc-700 dark:text-slate-300">
              Total Business Revenue:
            </span>
            <span className="text-2xl font-bold font-mono text-brand-600 dark:text-brand-400">
              {formatCurrency(grandTotal)}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-brand-200 dark:border-brand-900 text-xs">
            <div>
              <div className="text-zinc-500 dark:text-slate-400">Physical Cash:</div>
              <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(numCash)}
              </div>
            </div>
            <div>
              <div className="text-zinc-500 dark:text-slate-400">UPI / QR:</div>
              <div className="font-mono font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(numUpi)}
              </div>
            </div>
            <div>
              <div className="text-zinc-500 dark:text-slate-400">Card Swiping:</div>
              <div className="font-mono font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(numCard)}
              </div>
            </div>
            <div>
              <div className="text-zinc-500 dark:text-slate-400">Credit Issued:</div>
              <div className="font-mono font-bold text-amber-600 dark:text-amber-400">
                {formatCurrency(numCredit)}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/dashboard">
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            loading={submitting}
            icon={<CheckCircle2 size={16} />}
          >
            Submit Shift Record
          </Button>
        </div>
      </form>
    </div>
  );
}

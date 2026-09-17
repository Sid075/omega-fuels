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
  HelpCircle,
  TrendingDown,
  TrendingUp,
  Check,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils/formatters';
import { Employee, ShiftType, CreditPaymentMethod } from '@/types';
import { NozzleMeterSection } from '@/components/shifts/NozzleMeterSection';
import {
  NozzleInputItem,
  calculateShiftNozzlesSummary,
} from '@/lib/calculations/nozzle';
import { safeRound } from '@/lib/calculations/cash';

interface ShiftCreditRepaymentRow {
  id: string;
  customer_id: string;
  amount: string;
  payment_method: CreditPaymentMethod;
  notes: string;
}

interface ShiftCreditChitRow {
  id: string;
  customer_id: string;
  amount: string;
  notes: string;
}

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

  // Machine & Nozzle Meter Readings State (Two dispensing machines, each with Petrol and Diesel)
  const [nozzles, setNozzles] = useState<NozzleInputItem[]>([
    {
      id: 'm1_petrol',
      machine_id: 'machine_1',
      machine_name: 'Machine 1',
      nozzle_name: 'Machine 1 - Petrol',
      fuel_type: 'PETROL',
      opening_reading: '',
      closing_reading: '',
    },
    {
      id: 'm1_diesel',
      machine_id: 'machine_1',
      machine_name: 'Machine 1',
      nozzle_name: 'Machine 1 - Diesel',
      fuel_type: 'DIESEL',
      opening_reading: '',
      closing_reading: '',
    },
    {
      id: 'm2_petrol',
      machine_id: 'machine_2',
      machine_name: 'Machine 2',
      nozzle_name: 'Machine 2 - Petrol',
      fuel_type: 'PETROL',
      opening_reading: '',
      closing_reading: '',
    },
    {
      id: 'm2_diesel',
      machine_id: 'machine_2',
      machine_name: 'Machine 2',
      nozzle_name: 'Machine 2 - Diesel',
      fuel_type: 'DIESEL',
      opening_reading: '',
      closing_reading: '',
    },
  ]);
  const [selectedMachineFilter, setSelectedMachineFilter] = useState<string>('ALL');

  // Fuel rates for selected date
  const [fuelPrices, setFuelPrices] = useState<{ PETROL: number; DIESEL: number }>({
    PETROL: 103.50,
    DIESEL: 90.24,
  });
  const [loadingPrices, setLoadingPrices] = useState(false);

  // Payment Breakdown
  const [cash, setCash] = useState<string>('');
  const [upi, setUpi] = useState<string>('');
  const [card, setCard] = useState<string>('');
  const [creditChits, setCreditChits] = useState<ShiftCreditChitRow[]>([]);

  // Other Sales Items
  const [otherSales, setOtherSales] = useState<{ id: string; desc: string; amount: string }[]>([]);

  // Credit Book Payments Received State (Optional repayments collected from existing customers)
  const [creditRepayments, setCreditRepayments] = useState<ShiftCreditRepaymentRow[]>([]);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    shiftId: string;
    creditIssued: { customer_name: string; amount: number }[];
    repayments: { customer_name: string; amount: number; payment_method: string }[];
  } | null>(null);

  const [creditCustomers, setCreditCustomers] = useState<any[]>([]);

  // 1. Fetch Employees & Credit Customers on mount
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
        }
      } catch {
        setEmployeeId('emp_01');
      } finally {
        setLoadingEmployees(false);
      }
    }
    loadData();
  }, []);

  // 2. Fetch Fuel Prices applicable for selected shift date
  useEffect(() => {
    async function fetchPricesForDate() {
      try {
        setLoadingPrices(true);
        const res = await fetch(`/api/fuel/prices?date=${shiftDate}`);
        const json = await res.json();
        if (json.success && json.data && json.data.forDate) {
          setFuelPrices(json.data.forDate);
        }
      } catch {
        // Retain fallback prices
      } finally {
        setLoadingPrices(false);
      }
    }
    fetchPricesForDate();
  }, [shiftDate]);

  // Calculations
  const nozzleSummary = calculateShiftNozzlesSummary(nozzles, fuelPrices);

  const numCash = safeRound(parseFloat(cash) || 0);
  const numUpi = safeRound(parseFloat(upi) || 0);
  const numCard = safeRound(parseFloat(card) || 0);
  const numCredit = safeRound(
    creditChits.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0)
  );

  const actualCollections = safeRound(numCash + numUpi + numCard + numCredit);
  const totalOtherSales = safeRound(
    otherSales.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0)
  );

  const calculatedFuelSales = nozzleSummary.totalFuelSales;
  const expectedTotalSales = safeRound(calculatedFuelSales + totalOtherSales);
  const reconciliationVariance = safeRound(actualCollections - expectedTotalSales);

  // Credit Book Repayments Calculations
  const validCreditRepayments = creditRepayments.filter(
    (cr) => (parseFloat(cr.amount) || 0) > 0 && Boolean(cr.customer_id)
  );
  const creditRepaymentsCash = safeRound(
    validCreditRepayments
      .filter((cr) => cr.payment_method === 'CASH')
      .reduce((sum, cr) => sum + (parseFloat(cr.amount) || 0), 0)
  );
  const creditRepaymentsDigital = safeRound(
    validCreditRepayments
      .filter((cr) => cr.payment_method !== 'CASH')
      .reduce((sum, cr) => sum + (parseFloat(cr.amount) || 0), 0)
  );
  const creditRepaymentsTotal = safeRound(creditRepaymentsCash + creditRepaymentsDigital);
  const totalPhysicalCashInflow = safeRound(numCash + creditRepaymentsCash);

  const addCreditChit = () => {
    const defaultCustId = creditCustomers.length > 0 ? creditCustomers[0].id : '';
    setCreditChits((prev) => [
      ...prev,
      {
        id: `cchit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        customer_id: defaultCustId,
        amount: '',
        notes: '',
      },
    ]);
  };

  const removeCreditChit = (id: string) => {
    setCreditChits((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCreditChitChange = (
    index: number,
    field: keyof ShiftCreditChitRow,
    value: string
  ) => {
    setCreditChits((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

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

  const addCreditRepayment = () => {
    const defaultCustId = creditCustomers.length > 0 ? creditCustomers[0].id : '';
    setCreditRepayments([
      ...creditRepayments,
      {
        id: `cpay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        customer_id: defaultCustId,
        amount: '',
        payment_method: 'CASH',
        notes: '',
      },
    ]);
  };

  const removeCreditRepayment = (id: string) => {
    setCreditRepayments(creditRepayments.filter((item) => item.id !== id));
  };

  const handleCreditRepaymentChange = (
    index: number,
    field: keyof ShiftCreditRepaymentRow,
    value: any
  ) => {
    const updated = [...creditRepayments];
    updated[index] = { ...updated[index], [field]: value };
    setCreditRepayments(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeId) {
      setError('Please select an employee / nozzle operator.');
      return;
    }

    // Validate nozzle meter readings if any have been filled
    const filledNozzles = nozzles.filter(
      (n) => n.opening_reading !== '' || n.closing_reading !== ''
    );

    if (filledNozzles.length > 0) {
      if (!nozzleSummary.isValid) {
        setError(nozzleSummary.firstError || 'Please correct invalid nozzle meter readings.');
        return;
      }
    }

    // Validate any partially filled credit repayment rows
    const invalidRepay = creditRepayments.find(
      (r) => r.amount !== '' && (parseFloat(r.amount) <= 0 || isNaN(parseFloat(r.amount)) || !r.customer_id)
    );
    if (invalidRepay) {
      setError('Please specify a customer and a valid positive amount for all credit repayment entries.');
      return;
    }

    // Validate credit chits if any exist
    for (let i = 0; i < creditChits.length; i++) {
      const chit = creditChits[i];
      const amt = parseFloat(chit.amount);
      if (isNaN(amt) || amt <= 0) {
        setError(`Credit chit #${i + 1} must have a valid positive amount.`);
        return;
      }
      if (!chit.customer_id || chit.customer_id.trim() === '') {
        setError(`Credit chit #${i + 1} must have an active customer account selected.`);
        return;
      }
    }

    // Must have either nozzle readings or collections or other sales or repayments
    if (expectedTotalSales <= 0 && actualCollections <= 0 && creditRepaymentsTotal <= 0) {
      setError('Please enter nozzle meter readings, payment collections, or credit repayments.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Map valid nozzle readings for payload (only nozzles with actual entered numbers)
      const validNozzlePayload = nozzleSummary.readings
        .filter((r) => {
          const raw = nozzles.find((n) => n.id === r.id);
          return (
            raw &&
            raw.opening_reading !== '' &&
            raw.closing_reading !== '' &&
            r.isValid &&
            r.closing_reading >= r.opening_reading
          );
        })
        .map((r) => ({
          nozzle_name: r.nozzle_name,
          fuel_type: r.fuel_type,
          opening_reading: r.opening_reading,
          closing_reading: r.closing_reading,
          litres_sold: r.litres_sold,
          price_per_litre: r.price_per_litre,
          sales_amount: r.sales_amount,
        }));

      const validCreditPayments = creditChits.map((c) => ({
        payment_method: 'CREDIT' as const,
        amount: safeRound(parseFloat(c.amount) || 0),
        customer_id: c.customer_id,
        notes: c.notes?.trim() || undefined,
      }));

      const payload = {
        employee_id: employeeId,
        shift_date: shiftDate,
        shift_type: shiftType,
        custom_shift_name: shiftType === 'CUSTOM' ? customShiftName : null,
        notes: notes.trim() || null,
        nozzle_readings: validNozzlePayload,
        payments: [
          { payment_method: 'CASH', amount: numCash },
          { payment_method: 'UPI', amount: numUpi },
          { payment_method: 'CARD', amount: numCard },
          ...validCreditPayments,
        ],
        other_sales: otherSales
          .filter((item) => (parseFloat(item.amount) || 0) > 0 && item.desc.trim())
          .map((item) => ({
            description: item.desc.trim(),
            amount: parseFloat(item.amount) || 0,
          })),
        credit_payments: validCreditRepayments.map((item) => ({
          customer_id: item.customer_id,
          amount: safeRound(parseFloat(item.amount) || 0),
          payment_method: item.payment_method,
          notes: item.notes.trim() || undefined,
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

      // Success -> If credit was issued or repayments collected, show confirmation; otherwise redirect
      const creditIssued = json.data?.credit_issued || [];
      const repayments = json.data?.credit_payments || [];

      if (creditIssued.length > 0 || repayments.length > 0) {
        setSubmissionSuccess({
          shiftId: json.data?.id || '',
          creditIssued,
          repayments,
        });
        setSubmitting(false);
      } else {
        router.push('/shifts');
        router.refresh();
      }
    } catch {
      setError('Connection error while saving shift record. Please retry.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/shifts"
          className="p-2 rounded-sm hover:bg-surface-light-subtle dark:hover:bg-surface-dark-subtle text-zinc-500 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-slate-100">
            Record Employee Shift
          </h2>
          <p className="text-xs text-zinc-500 dark:text-slate-400">
            Structured nozzle counter readings, automated sales calculation & collection reconciliation
          </p>
        </div>
      </div>

      {/* Submission Success Confirmation Modal */}
      {submissionSuccess && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-md p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <Check size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-slate-100">
                  Shift saved successfully.
                </h3>
                <p className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5">
                  Shift ID: #{submissionSuccess.shiftId.substring(0, 8)}
                </p>
              </div>
            </div>

            {submissionSuccess.creditIssued.length > 0 && (
              <div className="p-3.5 rounded-sm bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-2">
                <div className="text-xs font-bold text-amber-900 dark:text-amber-300">
                  Credit Book updated:
                </div>
                <div className="space-y-1.5 text-xs text-amber-900 dark:text-amber-200">
                  {submissionSuccess.creditIssued.map((c, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="font-semibold text-zinc-900 dark:text-slate-100">
                        {c.customer_name}
                      </span>
                      <span className="font-mono">
                        — ₹{Number(c.amount).toLocaleString('en-IN')} credit added
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {submissionSuccess.repayments.length > 0 && (
              <div className="p-3.5 rounded-sm bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
                <div className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                  Credit repayments recorded:
                </div>
                <div className="space-y-1.5 text-xs text-emerald-900 dark:text-emerald-200">
                  {submissionSuccess.repayments.map((r, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="font-semibold text-zinc-900 dark:text-slate-100">
                        {r.customer_name}
                      </span>
                      <span className="font-mono">
                        — ₹{Number(r.amount).toLocaleString('en-IN')} received ({r.payment_method})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => {
                  router.push('/credit');
                  router.refresh();
                }}
              >
                Go to Credit Book
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  router.push('/shifts');
                  router.refresh();
                }}
              >
                View All Shifts
              </Button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-sm bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Shift Context & Operator */}
        <Card title="Shift Details & Assigned Operator">
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
                Nozzle Operator / Staff *
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
              label="Shift Operational Notes (Optional)"
              placeholder="e.g. Weather notes, equipment maintenance, handover comments"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </Card>

        {/* Section 2: Structured Nozzle Meter Readings Component */}
        <NozzleMeterSection
          shiftDate={shiftDate}
          prices={fuelPrices}
          loadingPrices={loadingPrices}
          nozzles={nozzles}
          onChangeNozzles={setNozzles}
          summary={nozzleSummary}
          selectedMachineFilter={selectedMachineFilter}
          onSelectMachineFilter={setSelectedMachineFilter}
        />

        {/* Section 3: Payment Collection Breakdown */}
        <Card
          title="2. Payment Collection Breakdown"
          subtitle="Record physical cash, UPI QR codes, Card POS slips and fuel issued on credit chits"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          </div>

          {/* Credit Given Chits */}
          <div className="mt-5 pt-4 border-t border-border-light dark:border-border-dark space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-zinc-800 dark:text-slate-200 flex items-center gap-1.5">
                  <BookOpen size={14} className="text-amber-600 dark:text-amber-400" />
                  <span>Credit Given (Fuel on Credit Chits)</span>
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-slate-400">
                  Fuel issued on credit chit. Automatically updates Credit Book & increases customer debt. Does not affect physical cash drawer.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={addCreditChit}
                icon={<Plus size={14} />}
              >
                Add Credit Chit
              </Button>
            </div>

            {creditChits.length === 0 ? (
              <div className="p-3.5 text-center rounded-sm border border-dashed border-border-light dark:border-border-dark text-xs text-zinc-400 dark:text-slate-500">
                No credit chits issued for this shift. Click &quot;Add Credit Chit&quot; if fuel was supplied on credit to registered accounts.
              </div>
            ) : (
              <div className="space-y-3">
                {creditChits.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-md border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      {/* Customer Selector */}
                      <div className="sm:col-span-5 flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-zinc-700 dark:text-slate-300">
                          Credit Customer *
                        </label>
                        <select
                          value={item.customer_id}
                          onChange={(e) =>
                            handleCreditChitChange(index, 'customer_id', e.target.value)
                          }
                          className="w-full min-h-touch px-3 py-2 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-xs font-semibold text-zinc-900 dark:text-slate-100 outline-none focus:border-amber-600"
                          required
                        >
                          {creditCustomers.length === 0 ? (
                            <option value="">No registered credit customers</option>
                          ) : (
                            creditCustomers.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name} (Current Due: ₹{(c.outstanding_balance || 0).toLocaleString('en-IN')})
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      {/* Chit Amount */}
                      <div className="sm:col-span-3 flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-zinc-700 dark:text-slate-300">
                          Credit Amount *
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-3 text-zinc-400 text-xs font-semibold">₹</span>
                          <input
                            type="number"
                            step="any"
                            placeholder="0.00"
                            value={item.amount}
                            onChange={(e) =>
                              handleCreditChitChange(index, 'amount', e.target.value)
                            }
                            className="w-full pl-7 pr-3 min-h-touch py-2 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm font-mono font-bold text-zinc-900 dark:text-slate-100 outline-none focus:border-amber-600"
                            required
                          />
                        </div>
                      </div>

                      {/* Notes / Chit # / Vehicle */}
                      <div className="sm:col-span-3 flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-zinc-700 dark:text-slate-300">
                          Chit # / Vehicle Notes
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Chit #104 / KA-01-1234"
                          value={item.notes}
                          onChange={(e) =>
                            handleCreditChitChange(index, 'notes', e.target.value)
                          }
                          className="w-full min-h-touch px-3 py-2 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-xs text-zinc-900 dark:text-slate-100 outline-none focus:border-amber-600"
                        />
                      </div>

                      {/* Remove Button */}
                      <div className="sm:col-span-1 flex items-end justify-center pt-2 sm:pt-4">
                        <button
                          type="button"
                          onClick={() => removeCreditChit(item.id)}
                          className="p-2 text-zinc-400 hover:text-red-500 min-h-touch min-w-[36px] flex items-center justify-center rounded-sm hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          aria-label="Remove credit chit"
                          title="Remove credit chit"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex justify-between items-center px-3.5 py-2.5 rounded-sm bg-amber-100/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs font-semibold text-amber-900 dark:text-amber-200">
                  <span>Total Credit Given:</span>
                  <span className="font-mono text-sm font-bold">
                    ₹{numCredit.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Section 4: Other Product Sales Line Items */}
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

        {/* Section 4: Credit Received / Repayments (Optional) */}
        <Card
          title="4. Credit Received / Repayments (Optional)"
          subtitle="Payments collected from existing credit customers during this shift (decreases customer debt)."
          action={
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={addCreditRepayment}
              icon={<Plus size={14} />}
            >
              Record Payment
            </Button>
          }
        >
          {creditRepayments.length === 0 ? (
            <div className="text-center py-5 text-xs text-zinc-400 dark:text-slate-500">
              No credit book payments recorded for this shift. Click &quot;Record Payment&quot; if an existing customer repaid outstanding credit.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3">
                {creditRepayments.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-md border border-border-light dark:border-border-dark bg-surface-light-subtle dark:bg-surface-dark-subtle/50 space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      {/* Customer Selector */}
                      <div className="sm:col-span-5 flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-zinc-600 dark:text-slate-400">
                          Existing Credit Customer *
                        </label>
                        <select
                          value={item.customer_id}
                          onChange={(e) =>
                            handleCreditRepaymentChange(index, 'customer_id', e.target.value)
                          }
                          className="w-full min-h-touch px-3 py-2 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-xs font-semibold text-zinc-900 dark:text-slate-100 outline-none focus:border-brand-600"
                          required
                        >
                          {creditCustomers.length === 0 ? (
                            <option value="">No registered credit customers</option>
                          ) : (
                            creditCustomers.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name} (Due: ₹{(c.outstanding_balance || 0).toLocaleString('en-IN')})
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      {/* Repayment Amount */}
                      <div className="sm:col-span-3 flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-zinc-600 dark:text-slate-400">
                          Amount Received *
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-3 text-zinc-400 text-xs font-semibold">₹</span>
                          <input
                            type="number"
                            step="any"
                            placeholder="0.00"
                            value={item.amount}
                            onChange={(e) =>
                              handleCreditRepaymentChange(index, 'amount', e.target.value)
                            }
                            className="w-full pl-7 pr-3 min-h-touch py-2 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm font-mono font-bold text-zinc-900 dark:text-slate-100 outline-none focus:border-brand-600"
                            required
                          />
                        </div>
                      </div>

                      {/* Payment Method */}
                      <div className="sm:col-span-3 flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-zinc-600 dark:text-slate-400">
                          Payment Method *
                        </label>
                        <select
                          value={item.payment_method}
                          onChange={(e) =>
                            handleCreditRepaymentChange(
                              index,
                              'payment_method',
                              e.target.value as CreditPaymentMethod
                            )
                          }
                          className="w-full min-h-touch px-3 py-2 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-xs font-semibold text-zinc-900 dark:text-slate-100 outline-none focus:border-brand-600"
                        >
                          <option value="CASH">CASH (Physical Drawer)</option>
                          <option value="UPI">UPI (Direct Bank)</option>
                          <option value="CARD">CARD (POS Merchant)</option>
                          <option value="OTHER">OTHER (Cheque/Bank Transfer)</option>
                        </select>
                      </div>

                      {/* Delete Action */}
                      <div className="sm:col-span-1 flex justify-end sm:justify-center pt-2 sm:pt-4">
                        <button
                          type="button"
                          onClick={() => removeCreditRepayment(item.id)}
                          className="p-2 text-zinc-400 hover:text-red-500 rounded transition-colors"
                          aria-label="Remove credit repayment"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Optional Note / Reference */}
                    <div className="pt-1">
                      <input
                        type="text"
                        placeholder="Optional notes / reference (e.g. UTR ref, Cheque #, receipt details)"
                        value={item.notes}
                        onChange={(e) =>
                          handleCreditRepaymentChange(index, 'notes', e.target.value)
                        }
                        className="w-full px-3 py-1.5 text-xs rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-zinc-700 dark:text-slate-300 outline-none focus:border-brand-600"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Repayments Live Subtotals Bar */}
              <div className="p-3 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                    Total Repayments Collected
                  </span>
                  <span className="font-mono text-sm font-extrabold text-zinc-900 dark:text-slate-100">
                    {formatCurrency(creditRepaymentsTotal)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                    Cash Received (Into Drawer)
                  </span>
                  <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(creditRepaymentsCash)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                    UPI / Digital Received (Bank)
                  </span>
                  <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(creditRepaymentsDigital)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Section 5: Authoritative Shift Reconciliation */}
        <div className="p-5 rounded-lg border-2 border-brand-500/40 bg-brand-50/20 dark:bg-brand-950/30 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 block">
                Shift Reconciliation & Cash Balancing
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Authoritative Sales vs Inflows & Physical Cash Drawer Accounting
              </span>
            </div>
            {reconciliationVariance === 0 ? (
              <Badge variant="success">Balanced (₹0.00)</Badge>
            ) : reconciliationVariance > 0 ? (
              <Badge variant="info">Excess (+{formatCurrency(reconciliationVariance)})</Badge>
            ) : (
              <Badge variant="danger">Shortage ({formatCurrency(reconciliationVariance)})</Badge>
            )}
          </div>

          {/* 1. Authoritative Sales Generated (Fuel + Other Products) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">
                Calculated Fuel Sales
              </span>
              <span className="font-mono text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {formatCurrency(calculatedFuelSales)}
              </span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">
                {nozzleSummary.totalLitres.toFixed(2)} L dispensed
              </span>
            </div>

            <div className="p-3 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">
                Other Product Sales
              </span>
              <span className="font-mono text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {formatCurrency(totalOtherSales)}
              </span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">
                {otherSales.length} item(s) recorded
              </span>
            </div>

            <div className="p-3 rounded bg-brand-500/10 border border-brand-500/30">
              <span className="text-[11px] font-semibold text-brand-700 dark:text-brand-300 block">
                Expected Total Sales Revenue
              </span>
              <span className="font-mono text-lg font-extrabold text-brand-600 dark:text-brand-400">
                {formatCurrency(expectedTotalSales)}
              </span>
              <span className="text-[10px] text-brand-600/80 dark:text-brand-400/80 block mt-0.5">
                Fuel + Other items (Repayments excluded)
              </span>
            </div>
          </div>

          {/* 2. Current Shift Sales Collections Breakdown */}
          <div className="p-3 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                Sales Collections Inflow (Cash + Digital + Credit Issued):
              </span>
              <span className="font-mono text-base font-bold text-zinc-900 dark:text-zinc-100">
                {formatCurrency(actualCollections)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
              <div>
                <div className="text-[10px] uppercase font-bold text-zinc-400">Cash from Sales</div>
                <div className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(numCash)}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-zinc-400">UPI / QR Sales</div>
                <div className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                  {formatCurrency(numUpi)}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-zinc-400">Card POS Sales</div>
                <div className="font-mono font-semibold text-purple-600 dark:text-purple-400">
                  {formatCurrency(numCard)}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-zinc-400">Credit Given (Chit)</div>
                <div className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                  {formatCurrency(numCredit)}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Physical Cash Inflow Integration */}
          <div className="p-3.5 rounded bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 block">
                  Total Physical Cash Inflow Available for Shift
                </span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  Sales Cash ({formatCurrency(numCash)}) + Credit Repayments Cash ({formatCurrency(creditRepaymentsCash)})
                </span>
              </div>
              <div className="font-mono text-xl font-extrabold text-emerald-700 dark:text-emerald-300">
                {formatCurrency(totalPhysicalCashInflow)}
              </div>
            </div>
          </div>

          {/* Accounting Guidance Notice */}
          <div className="p-3 rounded bg-zinc-100 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-400 flex items-start gap-2">
            <Receipt size={15} className="text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
            <span>
              <strong>Reconciliation Integrity:</strong> Credit book repayments are receivables collected and do <em>not</em> count as new shift sales revenue. However, <strong>CASH repayments</strong> ({formatCurrency(creditRepaymentsCash)}) enter the physical cash drawer and are automatically credited to the central cash ledger without double-counting. UPI and digital repayments remain in the station bank account.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/shifts">
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

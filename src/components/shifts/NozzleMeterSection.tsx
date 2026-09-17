'use client';

import React, { useState } from 'react';
import {
  Fuel,
  Gauge,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FuelType } from '@/types';
import {
  NozzleInputItem,
  calculateNozzleReading,
  calculateShiftNozzlesSummary,
  ShiftNozzleCalculationSummary,
} from '@/lib/calculations/nozzle';
import { formatCurrency } from '@/lib/utils/formatters';

interface NozzleMeterSectionProps {
  shiftDate: string;
  prices: { PETROL: number; DIESEL: number };
  loadingPrices?: boolean;
  nozzles: NozzleInputItem[];
  onChangeNozzles: (nozzles: NozzleInputItem[]) => void;
  summary: ShiftNozzleCalculationSummary;
  selectedMachineFilter?: string;
  onSelectMachineFilter?: (filter: string) => void;
}

export function NozzleMeterSection({
  shiftDate,
  prices,
  loadingPrices = false,
  nozzles,
  onChangeNozzles,
  summary,
  selectedMachineFilter = 'ALL',
  onSelectMachineFilter,
}: NozzleMeterSectionProps) {
  // Local active machine tab if not controlled externally
  const [internalMachineFilter, setInternalMachineFilter] = useState<string>('ALL');
  const activeFilter = onSelectMachineFilter ? selectedMachineFilter : internalMachineFilter;
  const setFilter = onSelectMachineFilter || setInternalMachineFilter;

  // Extract distinct machines from nozzles
  const machineMap = new Map<string, { id: string; name: string; items: NozzleInputItem[] }>();

  nozzles.forEach((n) => {
    const mId = n.machine_id || 'machine_1';
    const mName = n.machine_name || (mId === 'machine_1' ? 'Machine 1' : mId === 'machine_2' ? 'Machine 2' : 'Machine');
    if (!machineMap.has(mId)) {
      machineMap.set(mId, { id: mId, name: mName, items: [] });
    }
    machineMap.get(mId)!.items.push(n);
  });

  const machines = Array.from(machineMap.values());

  const updateNozzleByUniqueId = (
    uniqueId: string,
    field: keyof NozzleInputItem,
    value: any
  ) => {
    const updated = nozzles.map((n) => {
      if (n.id === uniqueId) {
        return { ...n, [field]: value };
      }
      return n;
    });
    onChangeNozzles(updated);
  };

  const clearMachineReadings = (mId: string) => {
    const updated = nozzles.map((n) => {
      if (n.machine_id === mId) {
        return { ...n, opening_reading: '', closing_reading: '' };
      }
      return n;
    });
    onChangeNozzles(updated);
  };

  // Filter machines to display
  const displayedMachines = activeFilter === 'ALL'
    ? machines
    : machines.filter((m) => m.id === activeFilter);

  return (
    <Card
      title="1. Dispenser Machine Meter Readings"
      subtitle="Select Machine 1 or 2 — Automatic Petrol & Diesel litres sold calculation"
    >
      {/* Date & Rate Banner */}
      <div className="mb-4 p-3 rounded-md bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Fuel size={16} className="text-brand-600 dark:text-brand-400 shrink-0" />
          <span className="text-zinc-600 dark:text-zinc-400">
            Applicable Rates for <strong className="font-mono text-zinc-900 dark:text-zinc-100">{shiftDate}</strong>:
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono font-medium">
          <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-bold">
            PETROL: {formatCurrency(prices.PETROL)}/L
          </span>
          <span className="px-2.5 py-1 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 font-bold">
            DIESEL: {formatCurrency(prices.DIESEL)}/L
          </span>
          {loadingPrices && (
            <span className="text-zinc-400 animate-pulse text-[11px]">Syncing rates...</span>
          )}
        </div>
      </div>

      {/* Machine Selector Tabs */}
      <div className="mb-5 flex flex-wrap items-center gap-2 p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800">
        <span className="text-xs font-semibold px-2 text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
          <Layers size={14} />
          <span>Select Machine:</span>
        </span>

        <button
          type="button"
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeFilter === 'ALL'
              ? 'bg-white dark:bg-zinc-800 text-brand-600 dark:text-brand-400 shadow-xs border border-zinc-200 dark:border-zinc-700'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          Both Machines (1 & 2)
        </button>

        {machines.map((m) => {
          // Check if machine has any filled readings
          const hasInput = m.items.some(
            (n) => n.opening_reading !== '' || n.closing_reading !== ''
          );

          // Calculate subtotal for this machine
          const mReadings = m.items.map((n) => calculateNozzleReading(n, prices));
          const mLitres = mReadings.reduce((sum, r) => sum + r.litres_sold, 0);

          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setFilter(m.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeFilter === m.id
                  ? 'bg-white dark:bg-zinc-800 text-brand-600 dark:text-brand-400 shadow-xs border border-zinc-200 dark:border-zinc-700'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <span>{m.name}</span>
              {hasInput && mLitres > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" title="Has readings" />
              )}
            </button>
          );
        })}
      </div>

      {/* Machine Cards List */}
      <div className="space-y-6">
        {displayedMachines.map((machine) => {
          const petrolNozzle = machine.items.find((n) => n.fuel_type === 'PETROL') || machine.items[0];
          const dieselNozzle = machine.items.find((n) => n.fuel_type === 'DIESEL') || machine.items[1];

          const petrolCalc = petrolNozzle ? calculateNozzleReading(petrolNozzle, prices) : null;
          const dieselCalc = dieselNozzle ? calculateNozzleReading(dieselNozzle, prices) : null;

          const machineLitres = (petrolCalc?.litres_sold || 0) + (dieselCalc?.litres_sold || 0);
          const machineSales = (petrolCalc?.sales_amount || 0) + (dieselCalc?.sales_amount || 0);

          return (
            <div
              key={machine.id}
              className="p-4 sm:p-5 rounded-xl border-2 border-zinc-200 dark:border-zinc-800 bg-surface-light dark:bg-surface-dark shadow-xs space-y-4"
            >
              {/* Machine Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold">
                    <Fuel size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <span>{machine.name}</span>
                      <span className="text-xs font-normal text-zinc-400">
                        (Dual Nozzle: Petrol + Diesel)
                      </span>
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="hidden sm:inline-block text-xs font-mono text-zinc-500 dark:text-zinc-400">
                    Dispensed: <strong className="text-zinc-900 dark:text-zinc-100">{machineLitres.toFixed(2)} L</strong> (
                    <strong className="text-brand-600 dark:text-brand-400">{formatCurrency(machineSales)}</strong>)
                  </span>

                  <button
                    type="button"
                    onClick={() => clearMachineReadings(machine.id)}
                    className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 underline"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Nozzles Row: Petrol and Diesel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Petrol Reading */}
                {petrolNozzle && petrolCalc && (
                  <div
                    className={`p-4 rounded-lg border transition-all ${
                      !petrolCalc.isValid
                        ? 'border-red-300 dark:border-red-900/60 bg-red-50/20 dark:bg-red-950/20'
                        : 'border-amber-200 dark:border-amber-900/40 bg-amber-500/5 dark:bg-amber-950/10'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-amber-200/40 dark:border-amber-900/30">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span className="font-bold text-xs uppercase tracking-wide text-amber-800 dark:text-amber-300">
                          Petrol Reading
                        </span>
                      </div>
                      <span className="font-mono text-xs font-semibold text-amber-700 dark:text-amber-400">
                        ₹{prices.PETROL.toFixed(2)}/L
                      </span>
                    </div>

                    {/* Inputs */}
                    <div className="grid grid-cols-2 gap-2.5 pt-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                          <Gauge size={12} /> Opening
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g. 1204.5"
                          value={petrolNozzle.opening_reading}
                          onChange={(e) =>
                            updateNozzleByUniqueId(petrolNozzle.id!, 'opening_reading', e.target.value)
                          }
                          className="w-full min-h-touch px-3 py-2 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm font-mono text-zinc-900 dark:text-slate-100 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                          <Gauge size={12} /> Closing
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g. 1820.0"
                          value={petrolNozzle.closing_reading}
                          onChange={(e) =>
                            updateNozzleByUniqueId(petrolNozzle.id!, 'closing_reading', e.target.value)
                          }
                          className="w-full min-h-touch px-3 py-2 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm font-mono text-zinc-900 dark:text-slate-100 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    {/* Error */}
                    {!petrolCalc.isValid && (
                      <div className="mt-2 p-2 rounded bg-red-100 dark:bg-red-950/60 text-[11px] text-red-700 dark:text-red-300 flex items-center gap-1">
                        <AlertCircle size={13} className="shrink-0" />
                        <span>{petrolCalc.errorMessage}</span>
                      </div>
                    )}

                    {/* Live Calculations */}
                    <div className="mt-3 pt-2.5 border-t border-amber-200/40 dark:border-amber-900/30 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-zinc-400 block uppercase font-bold">Litres Sold</span>
                        <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                          {petrolCalc.litres_sold.toFixed(2)} L
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-zinc-400 block uppercase font-bold">Petrol Sales</span>
                        <span className="font-mono font-extrabold text-amber-600 dark:text-amber-400 text-sm">
                          {formatCurrency(petrolCalc.sales_amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Diesel Reading */}
                {dieselNozzle && dieselCalc && (
                  <div
                    className={`p-4 rounded-lg border transition-all ${
                      !dieselCalc.isValid
                        ? 'border-red-300 dark:border-red-900/60 bg-red-50/20 dark:bg-red-950/20'
                        : 'border-blue-200 dark:border-blue-900/40 bg-blue-500/5 dark:bg-blue-950/10'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-blue-200/40 dark:border-blue-900/30">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                        <span className="font-bold text-xs uppercase tracking-wide text-blue-800 dark:text-blue-300">
                          Diesel Reading
                        </span>
                      </div>
                      <span className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400">
                        ₹{prices.DIESEL.toFixed(2)}/L
                      </span>
                    </div>

                    {/* Inputs */}
                    <div className="grid grid-cols-2 gap-2.5 pt-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                          <Gauge size={12} /> Opening
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g. 2400.0"
                          value={dieselNozzle.opening_reading}
                          onChange={(e) =>
                            updateNozzleByUniqueId(dieselNozzle.id!, 'opening_reading', e.target.value)
                          }
                          className="w-full min-h-touch px-3 py-2 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm font-mono text-zinc-900 dark:text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                          <Gauge size={12} /> Closing
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g. 2780.0"
                          value={dieselNozzle.closing_reading}
                          onChange={(e) =>
                            updateNozzleByUniqueId(dieselNozzle.id!, 'closing_reading', e.target.value)
                          }
                          className="w-full min-h-touch px-3 py-2 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm font-mono text-zinc-900 dark:text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Error */}
                    {!dieselCalc.isValid && (
                      <div className="mt-2 p-2 rounded bg-red-100 dark:bg-red-950/60 text-[11px] text-red-700 dark:text-red-300 flex items-center gap-1">
                        <AlertCircle size={13} className="shrink-0" />
                        <span>{dieselCalc.errorMessage}</span>
                      </div>
                    )}

                    {/* Live Calculations */}
                    <div className="mt-3 pt-2.5 border-t border-blue-200/40 dark:border-blue-900/30 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-zinc-400 block uppercase font-bold">Litres Sold</span>
                        <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                          {dieselCalc.litres_sold.toFixed(2)} L
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-zinc-400 block uppercase font-bold">Diesel Sales</span>
                        <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                          {formatCurrency(dieselCalc.sales_amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Station Aggregate Ribbon */}
      <div className="mt-5 p-4 rounded-lg bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6 text-xs">
          <div>
            <span className="text-zinc-500 dark:text-zinc-400 block text-[10px] uppercase font-semibold">Total Petrol (MS)</span>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
              {summary.petrolLitres.toFixed(2)} L
            </span>
            <span className="text-zinc-400 text-[11px] ml-1">
              ({formatCurrency(summary.petrolSales)})
            </span>
          </div>

          <div className="h-7 w-px bg-zinc-300 dark:bg-zinc-700 hidden sm:block" />

          <div>
            <span className="text-zinc-500 dark:text-zinc-400 block text-[10px] uppercase font-semibold">Total Diesel (HSD)</span>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
              {summary.dieselLitres.toFixed(2)} L
            </span>
            <span className="text-zinc-400 text-[11px] ml-1">
              ({formatCurrency(summary.dieselSales)})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400 block">All Machines Dispensed</span>
            <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200 text-sm">
              {summary.totalLitres.toFixed(2)} Litres
            </span>
          </div>
          <div className="h-7 w-px bg-zinc-300 dark:bg-zinc-700" />
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-brand-600 dark:text-brand-400 block">Calculated Fuel Sales</span>
            <span className="font-mono font-extrabold text-brand-600 dark:text-brand-400 text-base">
              {formatCurrency(summary.totalFuelSales)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

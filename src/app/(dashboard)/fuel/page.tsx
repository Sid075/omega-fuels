'use client';

import React, { useState, useEffect } from 'react';
import {
  Fuel,
  PlusCircle,
  Edit3,
  Truck,
  Zap,
  SlidersHorizontal,
  RefreshCw,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatLitres, formatDate, formatTime } from '@/lib/utils/formatters';
import { UpdatePriceModal } from '@/components/fuel/UpdatePriceModal';
import { RecordDeliveryModal } from '@/components/fuel/RecordDeliveryModal';
import { RecordUsageModal } from '@/components/fuel/RecordUsageModal';
import { AdjustStockModal } from '@/components/fuel/AdjustStockModal';

export default function FuelManagementPage() {
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState({ PETROL: 102.5, DIESEL: 89.8 });
  const [tanks, setTanks] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Modals
  const [isUpdatePriceOpen, setIsUpdatePriceOpen] = useState(false);
  const [isRecordDeliveryOpen, setIsRecordDeliveryOpen] = useState(false);
  const [isRecordUsageOpen, setIsRecordUsageOpen] = useState(false);
  const [isAdjustStockOpen, setIsAdjustStockOpen] = useState(false);

  // Filters
  const [fuelTypeFilter, setFuelTypeFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (fuelTypeFilter) query.set('fuel_type', fuelTypeFilter);
      if (typeFilter) query.set('type', typeFilter);

      const res = await fetch(`/api/fuel/transactions?${query.toString()}`);
      const json = await res.json();

      if (json.data) {
        if (json.data.prices) setPrices(json.data.prices);
        if (json.data.tanks) setTanks(json.data.tanks);
        if (json.data.transactions) setTransactions(json.data.transactions);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [fuelTypeFilter, typeFilter]);

  const handleActionSuccess = () => {
    fetchOverview();
  };

  const petrolTank = tanks.find((t) => t.fuel_type === 'PETROL') || {
    name: 'MS Underground Tank 1',
    current_stock_litres: 9450.5,
    capacity_litres: 15000,
    capacity_percentage: 63,
    stock_valuation: 9450.5 * prices.PETROL,
  };

  const dieselTank = tanks.find((t) => t.fuel_type === 'DIESEL') || {
    name: 'HSD Underground Tank 2',
    current_stock_litres: 14200.0,
    capacity_litres: 20000,
    capacity_percentage: 71,
    stock_valuation: 14200.0 * prices.DIESEL,
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 dark:text-slate-100 flex items-center gap-2">
            <Fuel size={22} className="text-brand-600 dark:text-brand-400" />
            <span>Fuel Inventory & Pricing</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5">
            Petrol & Diesel tank inventory, selling price rates, tanker decanting & stock movement
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsUpdatePriceOpen(true)}
            icon={<Edit3 size={15} />}
          >
            Update Selling Price
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsRecordUsageOpen(true)}
            icon={<Zap size={15} />}
          >
            Test / Generator Usage
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsAdjustStockOpen(true)}
            icon={<SlidersHorizontal size={15} />}
          >
            Adjust Tank Stock
          </Button>

          <Button
            size="sm"
            onClick={() => setIsRecordDeliveryOpen(true)}
            icon={<Truck size={15} />}
          >
            Record Tanker Delivery
          </Button>
        </div>
      </div>

      {/* Live Selling Price Rates & Tank Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Petrol Tank Gauge */}
        <Card
          title="Petrol (MS) Inventory & Rate"
          subtitle={`Active Retail Selling Rate: ₹${prices.PETROL.toFixed(2)} / Litre`}
          action={<Badge variant="success">Tank Normal</Badge>}
        >
          <div className="space-y-3.5">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-xs font-semibold text-zinc-500 dark:text-slate-400 uppercase tracking-wide">
                  Available Fuel Stock
                </div>
                <div className="text-3xl font-bold font-mono text-zinc-900 dark:text-slate-100 mt-0.5">
                  {formatLitres(petrolTank.current_stock_litres)}
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-semibold text-zinc-500 dark:text-slate-400 uppercase tracking-wide">
                  Tank Level
                </div>
                <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {petrolTank.capacity_percentage}%
                </div>
              </div>
            </div>

            {/* Visual Tank Progress Bar */}
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-3 rounded-full overflow-hidden p-0.5 border border-border-light dark:border-border-dark">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, petrolTank.capacity_percentage)}%` }}
              />
            </div>

            <div className="text-xs text-zinc-500 dark:text-slate-400 pt-2 border-t border-border-light dark:border-border-dark flex justify-between">
              <span>Capacity: {formatLitres(petrolTank.capacity_litres)}</span>
              <span>Stock Valuation: <strong className="font-mono text-zinc-900 dark:text-slate-100">{formatCurrency(petrolTank.stock_valuation)}</strong></span>
            </div>
          </div>
        </Card>

        {/* Diesel Tank Gauge */}
        <Card
          title="Diesel (HSD) Inventory & Rate"
          subtitle={`Active Retail Selling Rate: ₹${prices.DIESEL.toFixed(2)} / Litre`}
          action={<Badge variant="info">Tank Normal</Badge>}
        >
          <div className="space-y-3.5">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-xs font-semibold text-zinc-500 dark:text-slate-400 uppercase tracking-wide">
                  Available Fuel Stock
                </div>
                <div className="text-3xl font-bold font-mono text-zinc-900 dark:text-slate-100 mt-0.5">
                  {formatLitres(dieselTank.current_stock_litres)}
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-semibold text-zinc-500 dark:text-slate-400 uppercase tracking-wide">
                  Tank Level
                </div>
                <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5">
                  {dieselTank.capacity_percentage}%
                </div>
              </div>
            </div>

            {/* Visual Tank Progress Bar */}
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-3 rounded-full overflow-hidden p-0.5 border border-border-light dark:border-border-dark">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, dieselTank.capacity_percentage)}%` }}
              />
            </div>

            <div className="text-xs text-zinc-500 dark:text-slate-400 pt-2 border-t border-border-light dark:border-border-dark flex justify-between">
              <span>Capacity: {formatLitres(dieselTank.capacity_litres)}</span>
              <span>Stock Valuation: <strong className="font-mono text-zinc-900 dark:text-slate-100">{formatCurrency(dieselTank.stock_valuation)}</strong></span>
            </div>
          </div>
        </Card>
      </div>

      {/* Stock Transaction Stream Ledger */}
      <Card
        title="Fuel Stock Movement Stream"
        subtitle="Live chronological ledger of tanker deliveries, dispenser sales, test fuel & generator usage"
        action={
          <Button variant="ghost" size="sm" onClick={fetchOverview} icon={<RefreshCw size={14} />}>
            Refresh
          </Button>
        }
      >
        {/* Filters */}
        <div className="mb-4 pb-4 border-b border-border-light dark:border-border-dark flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-slate-400">
            <Filter size={14} />
            <span>Filter Movements:</span>
          </div>

          <select
            value={fuelTypeFilter}
            onChange={(e) => setFuelTypeFilter(e.target.value)}
            className="border border-border-light dark:border-border-dark rounded-md px-2.5 py-1.5 bg-surface-light dark:bg-surface-dark text-xs text-zinc-800 dark:text-slate-200 outline-none"
          >
            <option value="">All Fuel Products</option>
            <option value="PETROL">Petrol (MS)</option>
            <option value="DIESEL">Diesel (HSD)</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-border-light dark:border-border-dark rounded-md px-2.5 py-1.5 bg-surface-light dark:bg-surface-dark text-xs text-zinc-800 dark:text-slate-200 outline-none"
          >
            <option value="">All Transaction Types</option>
            <option value="DELIVERY">Tanker Delivery (+)</option>
            <option value="SALE">Dispenser Sale (-)</option>
            <option value="TEST_USAGE">Nozzle Test (-)</option>
            <option value="GENERATOR_USAGE">Generator Fuel (-)</option>
            <option value="ADJUSTMENT">Stock Adjustment (±)</option>
          </select>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-zinc-400">Loading stock transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400">No stock movements recorded for the selected filter.</div>
        ) : (
          <div className="divide-y divide-border-light dark:divide-border-dark">
            {transactions.map((tx) => {
              const isAddition = tx.transaction_type === 'DELIVERY' || tx.transaction_type === 'OPENING' || (tx.transaction_type === 'ADJUSTMENT' && tx.quantity_litres > 0);
              return (
                <div key={tx.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        tx.fuel_type === 'PETROL'
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                          : 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      <Fuel size={20} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-zinc-900 dark:text-slate-100">
                          {tx.fuel_type} • {tx.transaction_type}
                        </span>
                        <Badge variant={tx.fuel_type === 'PETROL' ? 'info' : 'warning'}>
                          {tx.fuel_type}
                        </Badge>
                      </div>

                      <div className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-1.5">
                        <span>{tx.notes || 'No notes recorded'}</span>
                        <span>•</span>
                        <span>Logged by {tx.creator_name || 'Staff'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-base font-bold font-mono ${
                        isAddition
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-zinc-700 dark:text-slate-300'
                      }`}
                    >
                      {isAddition ? '+' : ''}
                      {formatLitres(tx.quantity_litres)}
                    </div>
                    <div className="text-[11px] text-zinc-400 dark:text-slate-500">
                      {formatDate(tx.created_at)} {formatTime(tx.created_at)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modals */}
      <UpdatePriceModal
        isOpen={isUpdatePriceOpen}
        onClose={() => setIsUpdatePriceOpen(false)}
        onSuccess={handleActionSuccess}
        currentPrices={prices}
      />

      <RecordDeliveryModal
        isOpen={isRecordDeliveryOpen}
        onClose={() => setIsRecordDeliveryOpen(false)}
        onSuccess={handleActionSuccess}
      />

      <RecordUsageModal
        isOpen={isRecordUsageOpen}
        onClose={() => setIsRecordUsageOpen(false)}
        onSuccess={handleActionSuccess}
      />

      <AdjustStockModal
        isOpen={isAdjustStockOpen}
        onClose={() => setIsAdjustStockOpen(false)}
        onSuccess={handleActionSuccess}
      />
    </div>
  );
}

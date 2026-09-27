'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  FileText,
  AlertCircle,
  RefreshCw,
  Fuel,
  IndianRupee,
  CreditCard,
  Banknote,
  Smartphone,
  Droplet,
  BookOpen,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ReportData } from '@/services/report.service';

export default function ReportsPage() {
  const [exportType, setExportType] = useState<'XLSX' | 'CSV'>('XLSX');
  const [scope, setScope] = useState('ALL');
  const [period, setPeriod] = useState('THIS_MONTH');

  // Custom range dates
  const todayStr = new Date().toISOString().split('T')[0];
  const [customStart, setCustomStart] = useState(todayStr);
  const [customEnd, setCustomEnd] = useState(todayStr);

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchReports = useCallback(async (p: string, sc: string, start?: string, end?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        period: p,
        scope: sc,
      });
      if (p === 'CUSTOM' && start && end) {
        params.set('startDate', start);
        params.set('endDate', end);
      }

      const res = await fetch(`/api/reports?${params.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to load report data');
      }

      setReportData(json.data);
      if (json.data?.filter) {
        setCustomStart(json.data.filter.startDate);
        setCustomEnd(json.data.filter.endDate);
      }
    } catch (err: any) {
      setError(err?.message || 'Error fetching report analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch when period (non-custom) or scope changes
  useEffect(() => {
    if (period !== 'CUSTOM') {
      fetchReports(period, scope);
    }
  }, [period, scope, fetchReports]);

  // Handle custom range Apply
  const handleApplyCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStart > customEnd) {
      setError('Start date cannot be after end date.');
      return;
    }
    fetchReports('CUSTOM', scope, customStart, customEnd);
  };

  const activeStartDate = reportData?.filter.startDate || customStart;
  const activeEndDate = reportData?.filter.endDate || customEnd;

  const handleDownloadExport = () => {
    const params = new URLSearchParams({
      format: exportType.toLowerCase(),
      scope,
      startDate: activeStartDate,
      endDate: activeEndDate,
    });
    window.location.href = `/api/reports/export?${params.toString()}`;
  };

  const kpis = reportData?.kpis;
  const trendData = reportData?.paymentChannelTrend || [];
  const expenseData = reportData?.expenseCategories || [];
  const manifest = reportData?.manifest || { totalSheets: 9, modules: [] };

  const hasSalesData = trendData.some((t) => t.Total > 0);
  const hasExpenseData = expenseData.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 dark:text-slate-100 flex items-center gap-2">
            <FileSpreadsheet size={22} className="text-brand-600 dark:text-brand-400" />
            <span>Reports & Analytics</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5">
            Real-time financial analytics, payment distribution charts & multi-sheet Excel exports
          </p>
        </div>

        <Button
          onClick={handleDownloadExport}
          icon={<Download size={16} />}
          disabled={loading}
        >
          Download Export ({exportType})
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3.5 rounded-sm bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Export Configuration Parameters & Date Filters */}
      <Card title="Export Parameters & Filters">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Export Format */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-slate-300">
              Export Format
            </label>
            <select
              value={exportType}
              onChange={(e: any) => setExportType(e.target.value)}
              className="w-full min-h-touch px-3.5 py-2.5 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm outline-none focus:border-brand-600"
            >
              <option value="XLSX">Excel Workbook (.xlsx - Multi-sheet)</option>
              <option value="CSV">Comma-Separated Values (.csv)</option>
            </select>
          </div>

          {/* Date Period Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-slate-300">
              Date Period
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full min-h-touch px-3.5 py-2.5 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm outline-none focus:border-brand-600"
            >
              <option value="TODAY">Today</option>
              <option value="YESTERDAY">Yesterday</option>
              <option value="THIS_WEEK">This Week</option>
              <option value="LAST_WEEK">Last Week</option>
              <option value="THIS_MONTH">Current Month</option>
              <option value="LAST_MONTH">Last Month</option>
              <option value="THIS_YEAR">Current Year</option>
              <option value="CUSTOM">Custom Range</option>
            </select>
          </div>

          {/* Data Scope Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-slate-300">
              Data Scope
            </label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full min-h-touch px-3.5 py-2.5 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm outline-none focus:border-brand-600"
            >
              <option value="ALL">Full Master Workbook (All Sheets)</option>
              <option value="FINANCIAL">Financial & Cash Ledger Only</option>
              <option value="FUEL">Fuel Inventory & Stock Movements</option>
              <option value="CREDIT">Credit Book & Customer Ledger</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range Picker when CUSTOM is selected */}
        {period === 'CUSTOM' && (
          <form
            onSubmit={handleApplyCustomRange}
            className="mt-4 pt-4 border-t border-border-light dark:border-border-dark flex flex-col sm:flex-row items-end gap-3"
          >
            <div className="w-full sm:w-auto flex-1 flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-slate-300">
                From Date
              </label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full min-h-touch px-3 py-2 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-xs font-mono text-zinc-900 dark:text-slate-100 outline-none focus:border-brand-600"
                required
              />
            </div>

            <div className="w-full sm:w-auto flex-1 flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-slate-300">
                To Date
              </label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full min-h-touch px-3 py-2 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-xs font-mono text-zinc-900 dark:text-slate-100 outline-none focus:border-brand-600"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              icon={<Calendar size={14} />}
            >
              Apply Filter
            </Button>
          </form>
        )}

        {/* Active Period Badge Indicator */}
        <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>Active Range:</span>
            <span className="font-mono font-semibold text-zinc-800 dark:text-slate-200">
              {activeStartDate} → {activeEndDate}
            </span>
          </div>
          {loading && (
            <div className="flex items-center gap-1.5 text-brand-600 dark:text-brand-400">
              <RefreshCw size={13} className="animate-spin" />
              <span>Updating analytics...</span>
            </div>
          )}
        </div>
      </Card>

      {/* Dynamic Report KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3">
        {/* Total Sales */}
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-slate-400">
              Total Shift Sales
            </span>
            <div className="p-1.5 rounded-sm bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <IndianRupee size={16} />
            </div>
          </div>
          <div className="mt-2 font-mono text-xl md:text-2xl font-extrabold text-zinc-900 dark:text-slate-100">
            ₹{(kpis?.totalSales || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-zinc-400 dark:text-slate-500 mt-1">
            Fuel: ₹{(kpis?.totalFuelSales || 0).toLocaleString('en-IN')} + Other: ₹{(kpis?.otherSales || 0).toLocaleString('en-IN')}
          </div>
        </Card>

        {/* Physical Cash Received */}
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-slate-400">
              Cash Received (Drawer)
            </span>
            <div className="p-1.5 rounded-sm bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
              <Banknote size={16} />
            </div>
          </div>
          <div className="mt-2 font-mono text-xl md:text-2xl font-extrabold text-teal-700 dark:text-teal-400">
            ₹{(kpis?.totalPhysicalCashInflow || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-zinc-400 dark:text-slate-500 mt-1">
            Sales: ₹{(kpis?.cashReceived || 0).toLocaleString('en-IN')} + Repayments: ₹{(kpis?.creditRepaymentsCash || 0).toLocaleString('en-IN')}
          </div>
        </Card>

        {/* Digital Payments (UPI + Card) */}
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-slate-400">
              Digital Bank Settlements
            </span>
            <div className="p-1.5 rounded-sm bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Smartphone size={16} />
            </div>
          </div>
          <div className="mt-2 font-mono text-xl md:text-2xl font-extrabold text-blue-700 dark:text-blue-400">
            ₹{((kpis?.upiReceived || 0) + (kpis?.cardReceived || 0)).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-zinc-400 dark:text-slate-500 mt-1">
            UPI: ₹{(kpis?.upiReceived || 0).toLocaleString('en-IN')} | Card: ₹{(kpis?.cardReceived || 0).toLocaleString('en-IN')}
          </div>
        </Card>

        {/* Credit Issued (Fuel Chits) */}
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-slate-400">
              Credit Issued (Chits)
            </span>
            <div className="p-1.5 rounded-sm bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <CreditCard size={16} />
            </div>
          </div>
          <div className="mt-2 font-mono text-xl md:text-2xl font-extrabold text-amber-700 dark:text-amber-400">
            ₹{(kpis?.creditIssued || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-zinc-400 dark:text-slate-500 mt-1">
            Receivables issued during this period
          </div>
        </Card>

        {/* Credit Repayments Received */}
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-slate-400">
              Credit Repayments Collected
            </span>
            <div className="p-1.5 rounded-sm bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <BookOpen size={16} />
            </div>
          </div>
          <div className="mt-2 font-mono text-xl md:text-2xl font-extrabold text-indigo-700 dark:text-indigo-400">
            ₹{(kpis?.creditRepaymentsTotal || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-zinc-400 dark:text-slate-500 mt-1">
            Cash: ₹{(kpis?.creditRepaymentsCash || 0).toLocaleString('en-IN')} | Digital: ₹{(kpis?.creditRepaymentsDigital || 0).toLocaleString('en-IN')}
          </div>
        </Card>

        {/* Fuel Volume Sold */}
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-slate-400">
              Fuel Volume Dispensed
            </span>
            <div className="p-1.5 rounded-sm bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
              <Fuel size={16} />
            </div>
          </div>
          <div className="mt-2 font-mono text-xl md:text-2xl font-extrabold text-orange-700 dark:text-orange-400">
            {(kpis?.totalFuelLitres || 0).toLocaleString('en-IN')} L
          </div>
          <div className="text-[11px] text-zinc-400 dark:text-slate-500 mt-1">
            Petrol: {(kpis?.petrolLitres || 0).toLocaleString('en-IN')} L | Diesel: {(kpis?.dieselLitres || 0).toLocaleString('en-IN')} L
          </div>
        </Card>

        {/* Operating Expenses */}
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-slate-400">
              Operating Expenses
            </span>
            <div className="p-1.5 rounded-sm bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
              <Droplet size={16} />
            </div>
          </div>
          <div className="mt-2 font-mono text-xl md:text-2xl font-extrabold text-red-700 dark:text-red-400">
            ₹{(kpis?.operatingExpenses || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-zinc-400 dark:text-slate-500 mt-1">
            Total utility & maintenance vouchers
          </div>
        </Card>

        {/* Total Outstanding Customer Credit */}
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-slate-400">
              Total Outstanding Due
            </span>
            <div className="p-1.5 rounded-sm bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <FileText size={16} />
            </div>
          </div>
          <div className="mt-2 font-mono text-xl md:text-2xl font-extrabold text-rose-700 dark:text-rose-400">
            ₹{(kpis?.outstandingCredit || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-zinc-400 dark:text-slate-500 mt-1">
            Active balance across all customer accounts
          </div>
        </Card>
      </div>

      {/* Analytics Visual Charts (Hidden when scope is FUEL only or CREDIT only) */}
      {(scope === 'ALL' || scope === 'FINANCIAL') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Payment Channels Bar Chart */}
          <Card
            title="Revenue by Payment Channel"
            subtitle={`Daily distribution for ${activeStartDate} → ${activeEndDate}`}
            className="lg:col-span-2"
          >
            {mounted ? (
              hasSalesData ? (
                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <XAxis dataKey="day" stroke="#888888" fontSize={11} />
                      <YAxis stroke="#888888" fontSize={11} tickFormatter={(v) => `₹${v / 1000}k`} />
                      <Tooltip formatter={(value: any) => `₹${Number(value).toLocaleString('en-IN')}`} />
                      <Legend />
                      <Bar dataKey="Cash" fill="#10B981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="UPI" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Card" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Credit" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-xs text-zinc-400 dark:text-slate-500 space-y-1">
                  <span>No shift sales recorded for this period.</span>
                  <span className="text-[11px]">Create a shift or change the date range filter above.</span>
                </div>
              )
            ) : (
              <div className="h-64 flex items-center justify-center text-xs text-zinc-400">Loading chart...</div>
            )}
          </Card>

          {/* Expense Category Pie Chart */}
          <Card title="Operating Expenses Breakdown" subtitle="Distribution across expense categories">
            {mounted ? (
              hasExpenseData ? (
                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {expenseData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-xs text-zinc-400 dark:text-slate-500 space-y-1">
                  <span>No expenses recorded for this period.</span>
                  <span className="text-[11px]">Record an expense voucher to populate category analytics.</span>
                </div>
              )
            ) : (
              <div className="h-64 flex items-center justify-center text-xs text-zinc-400">Loading chart...</div>
            )}
          </Card>
        </div>
      )}

      {/* Fuel Performance Breakdown Card (When Scope is ALL or FUEL) */}
      {(scope === 'ALL' || scope === 'FUEL') && (
        <Card
          title="Fuel Dispenser Operations & Sales Breakdown"
          subtitle="Direct dispenser meter readings across Petrol (MS) and Diesel (HSD)"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2">
            <div className="p-3.5 rounded-sm bg-surface-light-subtle dark:bg-surface-dark-subtle border border-border-light dark:border-border-dark space-y-1">
              <span className="text-xs font-semibold text-zinc-500 dark:text-slate-400 block">
                Petrol (MS) Sales
              </span>
              <div className="font-mono text-lg font-bold text-zinc-900 dark:text-slate-100">
                ₹{(kpis?.petrolSales || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-zinc-500 font-mono">
                {(kpis?.petrolLitres || 0).toLocaleString('en-IN')} Litres dispensed
              </div>
            </div>

            <div className="p-3.5 rounded-sm bg-surface-light-subtle dark:bg-surface-dark-subtle border border-border-light dark:border-border-dark space-y-1">
              <span className="text-xs font-semibold text-zinc-500 dark:text-slate-400 block">
                Diesel (HSD) Sales
              </span>
              <div className="font-mono text-lg font-bold text-zinc-900 dark:text-slate-100">
                ₹{(kpis?.dieselSales || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-zinc-500 font-mono">
                {(kpis?.dieselLitres || 0).toLocaleString('en-IN')} Litres dispensed
              </div>
            </div>

            <div className="p-3.5 rounded-sm bg-surface-light-subtle dark:bg-surface-dark-subtle border border-border-light dark:border-border-dark space-y-1">
              <span className="text-xs font-semibold text-zinc-500 dark:text-slate-400 block">
                Total Fuel Sales Revenue
              </span>
              <div className="font-mono text-lg font-bold text-emerald-700 dark:text-emerald-400">
                ₹{(kpis?.totalFuelSales || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-zinc-500 font-mono">
                {(kpis?.totalFuelLitres || 0).toLocaleString('en-IN')} Total Litres
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Dynamic Workbook Sheet Manifest */}
      <Card
        title={`Excel Workbook Sheet Manifest (${manifest.totalSheets} Sheet${manifest.totalSheets > 1 ? 's' : ''})`}
        subtitle="Generated via secure server-side ExcelJS engine filtered by your selected date range and scope"
      >
        <div className="divide-y divide-border-light dark:divide-border-dark">
          {manifest.modules.map((mod) => (
            <div key={mod.name} className="py-3 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-slate-100 flex items-center gap-2">
                  <FileText size={15} className="text-brand-600 dark:text-brand-400" />
                  <span>{mod.name}</span>
                </div>
                <div className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5">
                  {mod.description}
                </div>
              </div>
              <Badge variant="neutral">{mod.sheets} Sheet{mod.sheets > 1 ? 's' : ''}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  FileText,
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
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

export default function ReportsPage() {
  const [exportType, setExportType] = useState<'XLSX' | 'CSV'>('XLSX');
  const [scope, setScope] = useState('ALL');
  const [dateRange, setDateRange] = useState('THIS_MONTH');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const reportModules = [
    { name: 'Summary & Key Metrics', description: 'Total revenue, gross margin, cash vs digital distribution', sheets: 1 },
    { name: 'Shift & Operator Breakdown', description: 'Employee-wise sales, cash, UPI, card, and credit totals', sheets: 2 },
    { name: 'Central Cash Ledger', description: 'Complete chronological cash inflow and owner collections stream', sheets: 1 },
    { name: 'Fuel Stock & Deliveries', description: 'Opening, deliveries, sales, test loss, generator usage, ending balance', sheets: 2 },
    { name: 'Credit Customer Book', description: 'Customer statements, credit extended, and repayments', sheets: 2 },
    { name: 'Operating Expenses', description: 'Itemized expense list categorized by utility and repairs', sheets: 1 },
    { name: 'Append-Only Audit Logs', description: 'Full traceability log of price changes and system modifications', sheets: 1 },
  ];

  // Analytics Chart Data
  const dailyTrendData = [
    { day: 'Mon', Cash: 42000, UPI: 18500, Card: 9200, Credit: 14000 },
    { day: 'Tue', Cash: 38000, UPI: 21000, Card: 11000, Credit: 8500 },
    { day: 'Wed', Cash: 45000, UPI: 19500, Card: 8000, Credit: 12000 },
    { day: 'Thu', Cash: 41000, UPI: 24000, Card: 10500, Credit: 15500 },
    { day: 'Fri', Cash: 49000, UPI: 22500, Card: 12000, Credit: 11000 },
    { day: 'Sat', Cash: 53000, UPI: 28000, Card: 14500, Credit: 9000 },
    { day: 'Sun', Cash: 47000, UPI: 26000, Card: 13000, Credit: 7500 },
  ];

  const expensePieData = [
    { name: 'Utilities & Power', value: 14500, color: '#3B82F6' },
    { name: 'Maintenance', value: 3200, color: '#10B981' },
    { name: 'Supplies', value: 1850, color: '#F59E0B' },
  ];

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
            Interactive financial analytics, payment distribution charts & multi-sheet Excel exports
          </p>
        </div>

        <Button
          onClick={() => {
            window.location.href = `/api/reports/export?format=${exportType.toLowerCase()}&dateRange=${dateRange}&scope=${scope}`;
          }}
          icon={<Download size={16} />}
        >
          Download Export ({exportType})
        </Button>
      </div>

      {/* Export Configuration Parameters */}
      <Card title="Export Parameters & Filters">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-slate-300">
              Export Format
            </label>
            <select
              value={exportType}
              onChange={(e: any) => setExportType(e.target.value)}
              className="w-full min-h-touch px-3.5 py-2.5 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm outline-none"
            >
              <option value="XLSX">Excel Workbook (.xlsx - Multi-sheet)</option>
              <option value="CSV">Comma-Separated Values (.csv)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-slate-300">
              Date Period
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full min-h-touch px-3.5 py-2.5 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm outline-none"
            >
              <option value="TODAY">Today&apos;s Operations</option>
              <option value="THIS_WEEK">Current Week</option>
              <option value="THIS_MONTH">Current Month</option>
              <option value="CUSTOM">Custom Date Range</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-slate-300">
              Data Scope
            </label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full min-h-touch px-3.5 py-2.5 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm outline-none"
            >
              <option value="ALL">Full Master Workbook (All 13 Sheets)</option>
              <option value="FINANCIAL">Financial & Cash Ledger Only</option>
              <option value="FUEL">Fuel Inventory & Stock Movements</option>
              <option value="CREDIT">Credit Book & Customer Ledger</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Analytics Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Payment Channels Bar Chart */}
        <Card
          title="Revenue by Payment Channel (Weekly)"
          subtitle="Cash vs UPI vs Card vs Credit distribution"
          className="lg:col-span-2"
        >
          {mounted ? (
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
            <div className="h-64 flex items-center justify-center text-xs text-zinc-400">Loading chart...</div>
          )}
        </Card>

        {/* Expense Category Pie Chart */}
        <Card title="Operating Expenses Breakdown" subtitle="Distribution across expense categories">
          {mounted ? (
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {expensePieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-zinc-400">Loading chart...</div>
          )}
        </Card>
      </div>

      {/* Workbook Sheet Manifest */}
      <Card
        title="Excel Workbook Sheet Manifest (13 Sheets)"
        subtitle="Generated via secure server-side ExcelJS engine without raw database exposure"
      >
        <div className="divide-y divide-border-light dark:divide-border-dark">
          {reportModules.map((mod) => (
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

'use client';

import React, { useState } from 'react';
import { FileSpreadsheet, Download, Calendar, Filter, FileText } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function ReportsPage() {
  const [exportType, setExportType] = useState<'XLSX' | 'CSV'>('XLSX');
  const [scope, setScope] = useState('ALL');
  const [dateRange, setDateRange] = useState('THIS_MONTH');

  const reportModules = [
    { name: 'Summary & Key Metrics', description: 'Total revenue, gross margin, cash vs digital distribution', sheets: 1 },
    { name: 'Shift & Operator Breakdown', description: 'Employee-wise sales, cash, UPI, card, and credit totals', sheets: 2 },
    { name: 'Central Cash Ledger', description: 'Complete chronological cash inflow and owner collections stream', sheets: 1 },
    { name: 'Fuel Stock & Deliveries', description: 'Opening, deliveries, sales, test loss, generator usage, ending balance', sheets: 2 },
    { name: 'Credit Customer Book', description: 'Customer statements, credit extended, and repayments', sheets: 2 },
    { name: 'Operating Expenses', description: 'Itemized expense list categorized by utility and repairs', sheets: 1 },
    { name: 'Append-Only Audit Logs', description: 'Full traceability log of price changes and system modifications', sheets: 1 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 dark:text-slate-100 flex items-center gap-2">
            <FileSpreadsheet size={22} className="text-brand-600 dark:text-brand-400" />
            <span>Reports & Financial Exports</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5">
            Authorized multi-sheet Excel (.xlsx) workbooks and CSV export generator
          </p>
        </div>

        <Button
          onClick={() => alert(`Generating multi-sheet ${exportType} workbook export...`)}
          icon={<Download size={16} />}
        >
          Download Export ({exportType})
        </Button>
      </div>

      {/* Export Configuration Controls */}
      <Card title="Export Parameters & Filters">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-slate-300">
              Export Format
            </label>
            <select
              value={exportType}
              onChange={(e: any) => setExportType(e.target.value)}
              className="w-full min-h-touch px-3.5 py-2.5 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm"
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
              className="w-full min-h-touch px-3.5 py-2.5 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm"
            >
              <option value="TODAY">Today&apos;s Operations</option>
              <option value="THIS_WEEK">Current Week</option>
              <option value="THIS_MONTH">Current Month (August 2026)</option>
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
              className="w-full min-h-touch px-3.5 py-2.5 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm"
            >
              <option value="ALL">Full Master Workbook (All 13 Sheets)</option>
              <option value="FINANCIAL">Financial & Cash Ledger Only</option>
              <option value="FUEL">Fuel Inventory & Stock Movements</option>
              <option value="CREDIT">Credit Book & Customer Ledger</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Workbook Sheets Included */}
      <Card
        title="Full Excel Workbook Sheet Manifest (13 Sheets)"
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

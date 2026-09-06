'use client';

import React, { useState, useEffect } from 'react';
import { History, ShieldCheck, Filter, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatTime, formatDate } from '@/lib/utils/formatters';

export default function AuditLogsPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [moduleFilter, setModuleFilter] = useState('');

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const url = moduleFilter ? `/api/audit-logs?module=${moduleFilter}` : '/api/audit-logs';
      const res = await fetch(url);
      const json = await res.json();
      if (json.data) setLogs(json.data);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [moduleFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 dark:text-slate-100 flex items-center gap-2">
            <History size={22} className="text-brand-600 dark:text-brand-400" />
            <span>Audit & Activity Trail</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5">
            Append-only traceability log for all sensitive operational and financial modifications
          </p>
        </div>

        <Button variant="ghost" size="sm" onClick={fetchAuditLogs} icon={<RefreshCw size={14} />}>
          Refresh
        </Button>
      </div>

      <Card title="Recorded System Events" subtitle="Complete chronological audit stream">
        {/* Module Filter */}
        <div className="mb-4 pb-4 border-b border-border-light dark:border-border-dark flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-slate-400">
            <Filter size={14} />
            <span>Filter Module:</span>
          </div>

          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="border border-border-light dark:border-border-dark rounded-md px-2.5 py-1.5 bg-surface-light dark:bg-surface-dark text-xs text-zinc-800 dark:text-slate-200 outline-none"
          >
            <option value="">All System Modules</option>
            <option value="CASH_LEDGER">Cash Ledger</option>
            <option value="FUEL_INVENTORY">Fuel Inventory</option>
            <option value="CREDIT_BOOK">Credit Book</option>
            <option value="SHIFTS">Shift Entries</option>
            <option value="EMPLOYEES">Employee Directory</option>
            <option value="EXPENSES">Expenses</option>
          </select>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-zinc-400">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400">No audit entries found for the selected module.</div>
        ) : (
          <div className="divide-y divide-border-light dark:divide-border-dark">
            {logs.map((log) => (
              <div key={log.id} className="py-3.5 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-900 dark:text-slate-100">
                      {log.actor_name || log.actor_user_id || 'System Staff'}
                    </span>
                    <Badge variant={log.actor_role === 'ADMIN' ? 'info' : 'success'}>
                      {log.actor_role}
                    </Badge>
                    <span className="text-xs text-zinc-400 dark:text-slate-500 font-mono">
                      [{log.module}]
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400 dark:text-slate-500">
                    {formatDate(log.created_at)} • {formatTime(log.created_at)}
                  </span>
                </div>

                <div className="text-xs text-zinc-700 dark:text-slate-300">
                  <span className="font-mono font-semibold text-brand-600 dark:text-brand-400 mr-2">
                    {log.action}
                  </span>
                  <span>{log.reason || 'Operation performed'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

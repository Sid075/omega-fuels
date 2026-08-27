'use client';

import React from 'react';
import { History, ShieldCheck, Filter } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatTime, formatDate } from '@/lib/utils/formatters';

export default function AuditLogsPage() {
  const auditLogs = [
    {
      id: 'audit_01',
      actor: 'Admin Owner',
      role: 'ADMIN',
      action: 'SYSTEM_INITIALIZATION',
      module: 'SYSTEM',
      entity: 'DATABASE',
      reason: 'Initial database calibration & fuel tank opening stock calibration',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'audit_02',
      actor: 'Station Manager',
      role: 'MANAGER',
      action: 'OWNER_CASH_COLLECTION',
      module: 'CASH_LEDGER',
      entity: 'COLLECTION #occ_01',
      reason: 'Mid-day cash deposit collected by Owner (₹25,000)',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'audit_03',
      actor: 'Station Manager',
      role: 'MANAGER',
      action: 'SHIFT_SUBMITTED',
      module: 'SHIFTS',
      entity: 'SHIFT #shift_01',
      reason: 'Morning shift entry for Ramesh Kumar (Total: ₹82,760)',
      timestamp: new Date().toISOString(),
    },
  ];

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

        <Button variant="secondary" icon={<Filter size={16} />}>
          Filter Logs
        </Button>
      </div>

      <Card title="Recorded System Events" subtitle="Showing recent system activity">
        <div className="divide-y divide-border-light dark:divide-border-dark">
          {auditLogs.map((log) => (
            <div key={log.id} className="py-3.5 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-900 dark:text-slate-100">
                    {log.actor}
                  </span>
                  <Badge variant={log.role === 'ADMIN' ? 'info' : 'success'}>
                    {log.role}
                  </Badge>
                  <span className="text-xs text-zinc-400 dark:text-slate-500 font-mono">
                    [{log.module}]
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400 dark:text-slate-500">
                  {formatDate(log.timestamp)} • {formatTime(log.timestamp)}
                </span>
              </div>

              <div className="text-xs text-zinc-700 dark:text-slate-300">
                <span className="font-mono font-semibold text-brand-600 dark:text-brand-400 mr-2">
                  {log.action}
                </span>
                <span>{log.reason}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

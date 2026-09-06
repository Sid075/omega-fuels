'use client';

import React, { useState, useEffect } from 'react';
import { FileText, ArrowDownLeft, ArrowUpRight, Printer } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils/formatters';

interface CustomerStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string | null;
}

export function CustomerStatementModal({
  isOpen,
  onClose,
  customerId,
}: CustomerStatementModalProps) {
  const [loading, setLoading] = useState(false);
  const [statementData, setStatementData] = useState<any>(null);

  useEffect(() => {
    if (isOpen && customerId) {
      setLoading(true);
      fetch(`/api/credit/statement/${customerId}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.data) setStatementData(json.data);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen, customerId]);

  if (!isOpen) return null;

  const customer = statementData?.customer;
  const summary = statementData?.summary || { totalCreditGiven: 0, totalPaymentsReceived: 0, outstandingBalance: 0 };
  const transactions = statementData?.transactions || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customer ? `Statement: ${customer.name}` : 'Customer Account Statement'}
      subtitle="Detailed itemized ledger of credit fuel sales, repayments & running due balance"
      maxWidth="lg"
      footer={
        <>
          <Button variant="secondary" onClick={() => window.print()} icon={<Printer size={15} />}>
            Print Statement
          </Button>
          <Button onClick={onClose}>Close Statement</Button>
        </>
      }
    >
      {loading ? (
        <div className="py-12 text-center text-xs text-zinc-400">Loading statement...</div>
      ) : !statementData ? (
        <div className="py-12 text-center text-xs text-zinc-400">Failed to load statement details.</div>
      ) : (
        <div className="space-y-4">
          {/* Customer Summary Banner */}
          <div className="p-4 rounded-md bg-surface-light-subtle dark:bg-surface-dark-subtle border border-border-light dark:border-border-dark grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="text-[11px] font-semibold text-zinc-500 dark:text-slate-400 uppercase tracking-wider">
                Total Credit Drawn
              </div>
              <div className="text-lg font-bold font-mono text-zinc-900 dark:text-slate-100 mt-0.5">
                {formatCurrency(summary.totalCreditGiven)}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-zinc-500 dark:text-slate-400 uppercase tracking-wider">
                Total Payments Received
              </div>
              <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatCurrency(summary.totalPaymentsReceived)}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-zinc-500 dark:text-slate-400 uppercase tracking-wider">
                Current Outstanding Due
              </div>
              <div className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                {formatCurrency(summary.outstandingBalance)}
              </div>
            </div>
          </div>

          {/* Statement Transaction History */}
          <div className="border border-border-light dark:border-border-dark rounded-md overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-surface-light-subtle dark:bg-surface-dark-subtle border-b border-border-light dark:border-border-dark text-zinc-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="px-3 py-2.5">Date & Time</th>
                  <th className="px-3 py-2.5">Type</th>
                  <th className="px-3 py-2.5">Details</th>
                  <th className="px-3 py-2.5 text-right">Debit (+)</th>
                  <th className="px-3 py-2.5 text-right">Credit (-)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-border-dark">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-400">
                      No transaction history found for this account.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx: any) => {
                    const isCreditGiven = tx.transaction_type === 'CREDIT_GIVEN';
                    return (
                      <tr key={tx.id} className="hover:bg-surface-light-subtle dark:hover:bg-surface-dark-subtle">
                        <td className="px-3 py-2.5 whitespace-nowrap text-zinc-500 dark:text-slate-400 font-mono">
                          {formatDate(tx.transaction_at)} {formatTime(tx.transaction_at)}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <Badge variant={isCreditGiven ? 'warning' : 'success'}>
                            {isCreditGiven ? 'CREDIT GIVEN' : `REPAYMENT (${tx.payment_method || 'CASH'})`}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 text-zinc-700 dark:text-slate-300">
                          {tx.description || 'No description recorded'}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                          {isCreditGiven ? formatCurrency(tx.amount) : '-'}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {!isCreditGiven ? formatCurrency(tx.amount) : '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  );
}

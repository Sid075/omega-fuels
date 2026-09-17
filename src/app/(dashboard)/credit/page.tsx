'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  PlusCircle,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  Phone,
  Search,
  RefreshCw,
  FileText,
  Edit3,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { CreditCustomerModal } from '@/components/credit/CreditCustomerModal';
import { RecordRepaymentModal } from '@/components/credit/RecordRepaymentModal';
import { RecordCreditGivenModal } from '@/components/credit/RecordCreditGivenModal';
import { CustomerStatementModal } from '@/components/credit/CustomerStatementModal';

export default function CreditBookPage() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<any>(null);

  const [isCreditGivenModalOpen, setIsCreditGivenModalOpen] = useState(false);
  const [creditGivenCustomerId, setCreditGivenCustomerId] = useState<string | undefined>(undefined);

  const [isRepaymentModalOpen, setIsRepaymentModalOpen] = useState(false);
  const [repaymentCustomerId, setRepaymentCustomerId] = useState<string | undefined>(undefined);

  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [selectedStatementId, setSelectedStatementId] = useState<string | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const url = searchQuery
        ? `/api/credit/customers?search=${encodeURIComponent(searchQuery)}`
        : '/api/credit/customers';
      const res = await fetch(url);
      const json = await res.json();

      if (json.data) {
        setCustomers(json.data.customers || []);
        setTotalOutstanding(json.data.totalOutstanding || 0);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [searchQuery]);

  const handleOpenAddCustomer = () => {
    setCustomerToEdit(null);
    setIsCustomerModalOpen(true);
  };

  const handleOpenEditCustomer = (cust: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomerToEdit(cust);
    setIsCustomerModalOpen(true);
  };

  const handleOpenCreditGiven = (customerId?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCreditGivenCustomerId(customerId);
    setIsCreditGivenModalOpen(true);
  };

  const handleOpenRepayment = (customerId?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRepaymentCustomerId(customerId);
    setIsRepaymentModalOpen(true);
  };

  const handleOpenStatement = (customerId: string) => {
    setSelectedStatementId(customerId);
    setIsStatementModalOpen(true);
  };

  const handleSuccess = () => {
    fetchCustomers();
  };

  const totalCreditGiven = customers.reduce((acc, c) => acc + (c.total_credit_given || 0), 0);
  const totalRepaid = customers.reduce((acc, c) => acc + (c.total_repayments || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 dark:text-slate-100 flex items-center gap-2">
            <BookOpen size={22} className="text-brand-600 dark:text-brand-400" />
            <span>Credit Customer Book</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5">
            Credit fuel chits issued (Credit Given), customer collections (Credit Received) & account ledgers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleOpenCreditGiven()}
            icon={<ArrowUpRight size={15} />}
          >
            + Give Credit
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleOpenRepayment()}
            icon={<ArrowDownLeft size={15} />}
          >
            ↓ Receive Payment
          </Button>
          <Button size="sm" onClick={handleOpenAddCustomer} icon={<PlusCircle size={15} />}>
            New Customer
          </Button>
        </div>
      </div>

      {/* Credit Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Total Credit Given"
          value={formatCurrency(totalCreditGiven)}
          subtitle="Cumulative fuel & products issued on credit"
          variant="warning"
          icon={<ArrowUpRight size={18} />}
        />

        <MetricCard
          label="Total Credit Received"
          value={formatCurrency(totalRepaid)}
          subtitle="Cumulative repayments collected (Cash & Digital)"
          variant="success"
          icon={<ArrowDownLeft size={18} />}
        />

        <MetricCard
          label="Net Outstanding Due"
          value={formatCurrency(totalOutstanding)}
          subtitle="Remaining unpaid customer debt"
          variant={totalOutstanding > 0 ? 'danger' : 'success'}
          icon={<CreditCard size={18} />}
        />
      </div>

      {/* Customer Directory Ledger */}
      <Card
        title="Credit Customer Directory"
        subtitle="Itemized customer accounts, credit given, repayments received & balance due"
        action={
          <Button variant="ghost" size="sm" onClick={fetchCustomers} icon={<RefreshCw size={14} />}>
            Refresh
          </Button>
        }
      >
        {/* Search Toolbar */}
        <div className="mb-4 pb-4 border-b border-border-light dark:border-border-dark flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search customer name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-xs text-zinc-900 dark:text-slate-100 outline-none"
            />
          </div>
        </div>

        {/* Directory List */}
        {loading ? (
          <div className="py-12 text-center text-xs text-zinc-400">Loading credit directory...</div>
        ) : customers.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400">No credit customers found.</div>
        ) : (
          <div className="space-y-3">
            {customers.map((cust) => (
              <div
                key={cust.id}
                onClick={() => handleOpenStatement(cust.id)}
                className="p-4 rounded-md border border-border-light dark:border-border-dark bg-surface-light-subtle dark:bg-surface-dark-subtle hover:border-brand-500/50 cursor-pointer transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-zinc-900 dark:text-slate-100">
                      {cust.name}
                    </span>
                    <Badge variant={cust.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {cust.status}
                    </Badge>
                  </div>

                  <div className="text-xs text-zinc-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                    {cust.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={12} />
                        <span>{cust.phone}</span>
                      </span>
                    )}
                    {cust.notes && <span>• {cust.notes}</span>}
                  </div>

                  <div className="text-[11px] text-zinc-400 dark:text-slate-500 mt-1.5">
                    Last Activity: {formatDate(cust.last_transaction_at)}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Given / Received / Due Stats */}
                  <div className="grid grid-cols-3 gap-3 text-right">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                        Credit Given
                      </div>
                      <div className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                        {formatCurrency(cust.total_credit_given || 0)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                        Received
                      </div>
                      <div className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(cust.total_repayments || 0)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-slate-400">
                        Due Balance
                      </div>
                      <div
                        className={`text-base font-bold font-mono ${
                          cust.outstanding_balance > 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {formatCurrency(cust.outstanding_balance)}
                      </div>
                    </div>
                  </div>

                  {/* Per-Customer Quick Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-border-light dark:border-border-dark">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => handleOpenCreditGiven(cust.id, e)}
                      icon={<ArrowUpRight size={13} />}
                    >
                      Give Credit
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => handleOpenRepayment(cust.id, e)}
                      icon={<ArrowDownLeft size={13} />}
                    >
                      Repay
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenStatement(cust.id);
                      }}
                      icon={<FileText size={13} />}
                    >
                      Statement
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleOpenEditCustomer(cust, e)}
                      icon={<Edit3 size={13} />}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modals */}
      <CreditCustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSuccess={handleSuccess}
        customerToEdit={customerToEdit}
      />

      <RecordCreditGivenModal
        isOpen={isCreditGivenModalOpen}
        onClose={() => setIsCreditGivenModalOpen(false)}
        onSuccess={handleSuccess}
        customers={customers}
        defaultCustomerId={creditGivenCustomerId}
      />

      <RecordRepaymentModal
        isOpen={isRepaymentModalOpen}
        onClose={() => setIsRepaymentModalOpen(false)}
        onSuccess={handleSuccess}
        customers={customers}
        defaultCustomerId={repaymentCustomerId}
      />

      <CustomerStatementModal
        isOpen={isStatementModalOpen}
        onClose={() => setIsStatementModalOpen(false)}
        customerId={selectedStatementId}
      />
    </div>
  );
}

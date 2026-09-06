'use client';

import React, { useState, useEffect } from 'react';
import { Receipt, PlusCircle, Filter, RefreshCw, Trash2, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { ExpenseModal } from '@/components/expenses/ExpenseModal';

export default function ExpensesPage() {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (categoryFilter) query.set('category', categoryFilter);

      const res = await fetch(`/api/expenses?${query.toString()}`);
      const json = await res.json();

      if (json.data) {
        setExpenses(json.data.expenses || []);
        setTotalAmount(json.data.totalAmount || 0);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [categoryFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense entry?')) return;
    try {
      await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      fetchExpenses();
    } catch {
      alert('Failed to delete expense entry.');
    }
  };

  const categories = Array.from(new Set(expenses.map((e) => e.category)));

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 dark:text-slate-100 flex items-center gap-2">
            <Receipt size={22} className="text-brand-600 dark:text-brand-400" />
            <span>Station Operational Expenses</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5">
            Log and categorize fuel station overheads, electricity bills, maintenance & supplies
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} icon={<PlusCircle size={16} />}>
          Record New Expense
        </Button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Total Operational Expenses"
          value={formatCurrency(totalAmount)}
          subtitle="Cumulative recorded expenditure"
          variant="danger"
          icon={<Receipt size={18} />}
        />

        <MetricCard
          label="Total Expense Entries"
          value={expenses.length.toString()}
          subtitle="Recorded receipt vouchers"
          variant="info"
          icon={<Calendar size={18} />}
        />

        <MetricCard
          label="Expense Categories"
          value={categories.length.toString()}
          subtitle="Distinct operational categories"
          variant="primary"
          icon={<Filter size={18} />}
        />
      </div>

      {/* Expense Stream Ledger */}
      <Card
        title="Expense Voucher Directory"
        subtitle="Itemized history of all station expenses"
        action={
          <Button variant="ghost" size="sm" onClick={fetchExpenses} icon={<RefreshCw size={14} />}>
            Refresh
          </Button>
        }
      >
        {/* Filter Toolbar */}
        <div className="mb-4 pb-4 border-b border-border-light dark:border-border-dark flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-slate-400">
            <Filter size={14} />
            <span>Filter Category:</span>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-border-light dark:border-border-dark rounded-md px-2.5 py-1.5 bg-surface-light dark:bg-surface-dark text-xs text-zinc-800 dark:text-slate-200 outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Expenses List */}
        {loading ? (
          <div className="py-12 text-center text-xs text-zinc-400">Loading expenses...</div>
        ) : expenses.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400">No expenses recorded for this filter.</div>
        ) : (
          <div className="divide-y divide-border-light dark:border-border-dark">
            {expenses.map((exp) => (
              <div key={exp.id} className="py-3.5 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-zinc-900 dark:text-slate-100">
                      {exp.description}
                    </span>
                    <Badge variant="neutral">{exp.category}</Badge>
                  </div>

                  <div className="text-xs text-zinc-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                    <span>Voucher Date: {formatDate(exp.expense_date)}</span>
                    <span>• Logged by {exp.creator_name || 'Staff'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-base font-bold font-mono text-red-600 dark:text-red-400">
                    {formatCurrency(exp.amount)}
                  </span>

                  <button
                    onClick={() => handleDelete(exp.id)}
                    className="p-1.5 text-zinc-400 hover:text-red-500 rounded hover:bg-surface-light-subtle dark:hover:bg-surface-dark-subtle transition-colors"
                    title="Delete expense entry"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchExpenses}
      />
    </div>
  );
}

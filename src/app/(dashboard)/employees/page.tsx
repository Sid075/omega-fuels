'use client';

import React, { useState, useEffect } from 'react';
import { Users, PlusCircle, Phone, UserCheck, UserX, Search, Filter, Edit3, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmployeeModal } from '@/components/employees/EmployeeModal';
import { Employee, EmployeeStatus } from '@/types';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/employees');
      const json = await res.json();
      if (json.success && json.data) {
        setEmployees(json.data);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleOpenAdd = () => {
    setEmployeeToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEmployeeToEdit(emp);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (emp: Employee) => {
    const nextStatus: EmployeeStatus = emp.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`/api/employees/${emp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setEmployees((prev) =>
          prev.map((e) => (e.id === emp.id ? { ...e, status: nextStatus } : e))
        );
        showNotification(
          `${emp.name} has been ${nextStatus === 'ACTIVE' ? 'reactivated' : 'deactivated'}.`
        );
      }
    } catch {
      // Ignore
    }
  };

  const handleSaved = (savedEmp: Employee) => {
    setEmployees((prev) => {
      const exists = prev.some((e) => e.id === savedEmp.id);
      if (exists) {
        return prev.map((e) => (e.id === savedEmp.id ? savedEmp : e));
      }
      return [...prev, savedEmp];
    });
    showNotification(
      employeeToEdit
        ? `Updated details for ${savedEmp.name}`
        : `Successfully added ${savedEmp.name}`
    );
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.phone && emp.phone.includes(searchTerm)) ||
      (emp.notes && emp.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' || emp.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 dark:text-slate-100 flex items-center gap-2">
            <Users size={22} className="text-brand-600 dark:text-brand-400" />
            <span>Station Employees & Operators</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5">
            Manage nozzle operators, dispenser assignments & operational status
          </p>
        </div>

        <Button onClick={handleOpenAdd} icon={<PlusCircle size={16} />}>
          Add New Employee
        </Button>
      </div>

      {notification && (
        <div className="p-3 rounded-sm bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 transition-all">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name, phone, or dispenser..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 min-h-touch rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-950 text-zinc-900 dark:text-slate-100 placeholder-zinc-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-zinc-400 shrink-0 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="min-h-touch px-3.5 py-2 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-xs font-semibold text-zinc-700 dark:text-slate-300 outline-none"
          >
            <option value="ALL">All Employees ({employees.length})</option>
            <option value="ACTIVE">
              Active Only ({employees.filter((e) => e.status === 'ACTIVE').length})
            </option>
            <option value="INACTIVE">
              Inactive ({employees.filter((e) => e.status === 'INACTIVE').length})
            </option>
          </select>
        </div>
      </div>

      {/* Employee List */}
      <Card
        title={`Staff Directory (${filteredEmployees.length})`}
        subtitle="Operator assignments and status"
      >
        {loading ? (
          <div className="text-center py-10 text-xs text-zinc-400">Loading staff directory...</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="w-12 h-12 rounded-full bg-surface-light-subtle dark:bg-surface-dark-subtle text-zinc-400 mx-auto flex items-center justify-center">
              <Users size={24} />
            </div>
            <div className="text-sm font-semibold text-zinc-700 dark:text-slate-300">
              No employees found
            </div>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {searchTerm
                ? 'Try adjusting your search filter.'
                : 'Click "Add New Employee" to register your station nozzle operators.'}
            </p>
            <Button size="sm" onClick={handleOpenAdd} icon={<PlusCircle size={14} />}>
              Add Employee
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border-light dark:divide-border-dark">
            {filteredEmployees.map((emp) => (
              <div
                key={emp.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold text-zinc-900 dark:text-slate-100">
                      {emp.name}
                    </span>
                    <Badge
                      variant={emp.status === 'ACTIVE' ? 'success' : 'neutral'}
                      icon={emp.status === 'ACTIVE' ? <UserCheck size={12} /> : <UserX size={12} />}
                    >
                      {emp.status}
                    </Badge>
                  </div>

                  <div className="text-xs text-zinc-500 dark:text-slate-400 flex items-center gap-2">
                    {emp.phone ? (
                      <span className="flex items-center gap-1">
                        <Phone size={12} />
                        {emp.phone}
                      </span>
                    ) : (
                      <span className="text-zinc-400">No phone registered</span>
                    )}
                  </div>

                  {emp.notes && (
                    <div className="text-xs text-zinc-600 dark:text-slate-400 font-medium">
                      {emp.notes}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleStatus(emp)}
                  >
                    {emp.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}
                  </Button>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleOpenEdit(emp)}
                    icon={<Edit3 size={14} />}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Employee Add/Edit Modal */}
      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={handleSaved}
        employeeToEdit={employeeToEdit}
      />
    </div>
  );
}

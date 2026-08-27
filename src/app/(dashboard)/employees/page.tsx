'use client';

import React from 'react';
import { Users, PlusCircle, Phone, UserCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function EmployeesPage() {
  const employees = [
    {
      id: 'emp_01',
      name: 'Ramesh Kumar',
      phone: '+91 98765 43210',
      role: 'Senior Nozzle Operator',
      dispensers: 'Dispenser 1 & 2 (Petrol / Diesel)',
      status: 'ACTIVE',
      shiftsCompleted: 142,
    },
    {
      id: 'emp_02',
      name: 'Suresh Verma',
      phone: '+91 98765 43211',
      role: 'Shift Attendant',
      dispensers: 'Dispenser 3 & 4 (Diesel High Speed)',
      status: 'ACTIVE',
      shiftsCompleted: 98,
    },
    {
      id: 'emp_03',
      name: 'Vikram Singh',
      phone: '+91 98765 43212',
      role: 'Night Attendant',
      dispensers: 'All Dispensers',
      status: 'ACTIVE',
      shiftsCompleted: 64,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 dark:text-slate-100 flex items-center gap-2">
            <Users size={22} className="text-brand-600 dark:text-brand-400" />
            <span>Station Employees & Operators</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5">
            Manage nozzle operators, shift attendants & operational staff
          </p>
        </div>

        <Button icon={<PlusCircle size={16} />}>
          Add New Employee
        </Button>
      </div>

      <Card title="Employee Directory" subtitle="Active station staff">
        <div className="space-y-3">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className="p-4 rounded-md border border-border-light dark:border-border-dark bg-surface-light-subtle dark:bg-surface-dark-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-zinc-900 dark:text-slate-100">
                    {emp.name}
                  </span>
                  <Badge variant="success" icon={<UserCheck size={12} />}>
                    {emp.status}
                  </Badge>
                </div>
                <div className="text-xs text-zinc-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                  <Phone size={12} />
                  <span>{emp.phone}</span>
                  <span>• {emp.role}</span>
                </div>
                <div className="text-xs text-zinc-600 dark:text-slate-400 mt-1">
                  Assigned: {emp.dispensers}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-zinc-400 dark:text-slate-500">Shifts Logged</div>
                  <div className="text-sm font-bold font-mono text-zinc-800 dark:text-slate-200">
                    {emp.shiftsCompleted}
                  </div>
                </div>
                <Button size="sm" variant="secondary">
                  Edit Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

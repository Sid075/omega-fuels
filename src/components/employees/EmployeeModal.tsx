'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Employee, EmployeeStatus } from '@/types';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (employee: Employee) => void;
  employeeToEdit?: Employee | null;
}

export function EmployeeModal({
  isOpen,
  onClose,
  onSaved,
  employeeToEdit,
}: EmployeeModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<EmployeeStatus>('ACTIVE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (employeeToEdit) {
      setName(employeeToEdit.name || '');
      setPhone(employeeToEdit.phone || '');
      setNotes(employeeToEdit.notes || '');
      setStatus(employeeToEdit.status || 'ACTIVE');
    } else {
      setName('');
      setPhone('');
      setNotes('');
      setStatus('ACTIVE');
    }
    setError(null);
  }, [employeeToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Employee name is required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = employeeToEdit
        ? `/api/employees/${employeeToEdit.id}`
        : '/api/employees';
      const method = employeeToEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, notes, status }),
      });

      const result = await res.json();
      if (!res.ok || result.error) {
        setError(result.error || 'Failed to save employee.');
        setLoading(false);
        return;
      }

      onSaved(result.data);
      onClose();
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={employeeToEdit ? 'Edit Employee Details' : 'Add New Staff / Operator'}
      subtitle={
        employeeToEdit
          ? 'Update staff details, dispenser assignments, or status'
          : 'Create record for nozzle operators or shift attendants'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {employeeToEdit ? 'Save Changes' : 'Create Employee'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-sm bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <Input
          label="Full Name *"
          placeholder="e.g. Ramesh Kumar"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Input
          label="Phone Number"
          type="tel"
          placeholder="e.g. +91 98765 43210"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-700 dark:text-slate-300">
            Dispenser Assignment & Operational Notes
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Assigned to Dispenser 1 & 2 (Petrol / Diesel). Senior nozzle operator."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-950"
          />
        </div>

        {employeeToEdit && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-slate-300">
              Employment Status
            </label>
            <select
              value={status}
              onChange={(e: any) => setStatus(e.target.value)}
              className="w-full min-h-touch px-3.5 py-2.5 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm font-medium"
            >
              <option value="ACTIVE">ACTIVE (Can be assigned to shifts)</option>
              <option value="INACTIVE">INACTIVE (Preserve history, hide from shift picker)</option>
            </select>
            <p className="text-[11px] text-zinc-400 dark:text-slate-500">
              Employees with past shift records are soft-deactivated to preserve historical integrity.
            </p>
          </div>
        )}
      </form>
    </Modal>
  );
}

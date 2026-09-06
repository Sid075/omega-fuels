'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface CreditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customerToEdit?: any;
}

export function CreditCustomerModal({
  isOpen,
  onClose,
  onSuccess,
  customerToEdit,
}: CreditCustomerModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (customerToEdit) {
        setName(customerToEdit.name || '');
        setPhone(customerToEdit.phone || '');
        setNotes(customerToEdit.notes || '');
        setStatus(customerToEdit.status || 'ACTIVE');
      } else {
        setName('');
        setPhone('');
        setNotes('');
        setStatus('ACTIVE');
      }
      setError(null);
    }
  }, [isOpen, customerToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Customer / Transport Company name is required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/credit/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: customerToEdit?.id,
          name: name.trim(),
          phone: phone.trim() || undefined,
          notes: notes.trim() || undefined,
          status,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error || 'Failed to save credit customer.');
        setLoading(false);
        return;
      }

      onSuccess();
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
      title={customerToEdit ? 'Edit Credit Customer' : 'Add Credit Customer'}
      subtitle="Register transport company, contractor or fleet account for credit fuel sales"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading} icon={<UserPlus size={16} />}>
            {customerToEdit ? 'Update Customer' : 'Create Customer Account'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-sm bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <Input
          label="Customer / Company Name *"
          placeholder="e.g. Sharma Transport Co. or Apex Construction"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />

        <Input
          label="Phone / Mobile Number"
          type="tel"
          placeholder="e.g. +91 98765 43210"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <Input
          label="Credit Terms & Agreement Notes"
          placeholder="e.g. 15-day billing cycle, max limit ₹1,00,000, authorized vehicle lists"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {customerToEdit && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-slate-300">
              Account Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full min-h-touch px-3.5 py-2.5 rounded-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm text-zinc-900 dark:text-slate-100 outline-none"
            >
              <option value="ACTIVE">ACTIVE (Allowed for shift chit credit)</option>
              <option value="INACTIVE">INACTIVE (Frozen for credit sales)</option>
            </select>
          </div>
        )}
      </form>
    </Modal>
  );
}

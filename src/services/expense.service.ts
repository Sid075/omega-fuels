import { createClient } from '@/lib/supabase/server';
import { Expense } from '@/types';
import { safeRound } from '@/lib/calculations/cash';
import { logAuditAction } from './audit.service';
import { getCurrentUser } from './auth.service';

export interface ExpenseWithMeta extends Expense {
  creator_name?: string;
}

let localExpenses: ExpenseWithMeta[] = [
  {
    id: 'exp_01',
    category: 'Electricity / Utilities',
    description: 'Monthly BESCOM Station Power Bill Payment',
    amount: 14500.0,
    expense_date: '2026-08-25',
    created_by: 'usr_admin_001',
    creator_name: 'Station Admin',
    created_at: '2026-08-25T10:00:00.000Z',
    updated_at: '2026-08-25T10:00:00.000Z',
  },
  {
    id: 'exp_02',
    category: 'Maintenance & Repairs',
    description: 'Dispenser 2 Nozzle Swivel Joint Repair & Hose Pipe replacement',
    amount: 3200.0,
    expense_date: '2026-08-22',
    created_by: 'usr_manager_001',
    creator_name: 'Station Manager',
    created_at: '2026-08-22T14:30:00.000Z',
    updated_at: '2026-08-22T14:30:00.000Z',
  },
  {
    id: 'exp_03',
    category: 'Station Supplies',
    description: 'Thermal POS paper roll box & cleaning consumables',
    amount: 1850.0,
    expense_date: '2026-08-19',
    created_by: 'usr_manager_001',
    creator_name: 'Station Manager',
    created_at: '2026-08-19T11:15:00.000Z',
    updated_at: '2026-08-19T11:15:00.000Z',
  },
];

export async function getExpenses(
  categoryFilter?: string,
  startDate?: string,
  endDate?: string
): Promise<{ expenses: ExpenseWithMeta[]; totalAmount: number }> {
  let expenses: ExpenseWithMeta[] = [];

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    try {
      const supabase = await createClient();
      let query = supabase
        .from('expenses')
        .select('*, profile:created_by(name)')
        .order('expense_date', { ascending: false });

      if (categoryFilter) query = query.eq('category', categoryFilter);
      if (startDate) query = query.gte('expense_date', startDate);
      if (endDate) query = query.lte('expense_date', endDate);

      const { data, error } = await query;
      if (!error && data) {
        expenses = data.map((d: any) => ({
          ...d,
          amount: Number(d.amount),
          creator_name: d.profile?.name || 'Staff',
        }));
      }
    } catch {
      // Fallback
    }
  }

  if (expenses.length === 0) {
    let filtered = [...localExpenses];
    if (categoryFilter) filtered = filtered.filter((e) => e.category === categoryFilter);
    if (startDate) filtered = filtered.filter((e) => e.expense_date >= startDate);
    if (endDate) filtered = filtered.filter((e) => e.expense_date <= endDate);
    expenses = filtered;
  }

  const totalAmount = safeRound(expenses.reduce((acc, curr) => acc + curr.amount, 0));
  return { expenses, totalAmount };
}

export async function recordExpense(input: {
  category: string;
  description: string;
  amount: number;
  expense_date?: string;
}): Promise<ExpenseWithMeta> {
  const currentUser = await getCurrentUser();
  const userId = currentUser?.id || 'usr_manager_001';
  const userRole = currentUser?.role || 'MANAGER';
  const amount = Math.abs(Number(input.amount));
  const expDate = input.expense_date || new Date().toISOString().split('T')[0];
  const expId = `exp_${Date.now()}`;
  const now = new Date().toISOString();

  const record: ExpenseWithMeta = {
    id: expId,
    category: input.category.trim(),
    description: input.description.trim(),
    amount,
    expense_date: expDate,
    created_by: userId,
    creator_name: currentUser?.name || 'Station Manager',
    created_at: now,
    updated_at: now,
  };

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    try {
      const supabase = await createClient();
      await supabase.from('expenses').insert({
        id: expId,
        category: input.category.trim(),
        description: input.description.trim(),
        amount,
        expense_date: expDate,
        created_by: userId,
      });

      await logAuditAction({
        actorUserId: userId,
        actorRole: userRole,
        action: 'EXPENSE_RECORDED',
        module: 'EXPENSES',
        entityType: 'EXPENSE',
        entityId: expId,
        newValues: record,
        reason: `Expense recorded: ₹${amount} for ${input.category}`,
      });

      return record;
    } catch {
      // Fallback
    }
  }

  localExpenses.unshift(record);

  await logAuditAction({
    actorUserId: userId,
    actorRole: userRole,
    action: 'EXPENSE_RECORDED',
    module: 'EXPENSES',
    entityType: 'EXPENSE',
    entityId: expId,
    newValues: record,
    reason: `Expense recorded: ₹${amount} for ${input.category}`,
  });

  return record;
}

export async function deleteExpense(id: string): Promise<boolean> {
  const currentUser = await getCurrentUser();
  const userId = currentUser?.id || 'usr_admin_001';
  const userRole = currentUser?.role || 'ADMIN';

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    try {
      const supabase = await createClient();
      await supabase.from('expenses').delete().eq('id', id);
    } catch {
      // Fallback
    }
  }

  localExpenses = localExpenses.filter((e) => e.id !== id);

  await logAuditAction({
    actorUserId: userId,
    actorRole: userRole,
    action: 'EXPENSE_DELETED',
    module: 'EXPENSES',
    entityType: 'EXPENSE',
    entityId: id,
    reason: `Deleted expense record #${id}`,
  });

  return true;
}

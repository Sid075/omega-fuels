import { createClient } from '@/lib/supabase/server';
import { CashLedgerEntry, CashLedgerEntryType, OwnerCashCollection } from '@/types';
import { calculateCashLedgerSummary } from '@/lib/calculations/cash';
import { logAuditAction } from './audit.service';
import { getCurrentUser } from './auth.service';

export interface CashLedgerItemWithMeta extends CashLedgerEntry {
  title: string;
  is_inflow: boolean;
  creator_name?: string;
}

// In-memory fallback persistent store for local/demo evaluation
let localLedgerEntries: CashLedgerItemWithMeta[] = [
  {
    id: 'cl_01',
    entry_type: 'SHIFT_CASH',
    amount: 42500.0,
    reference_type: 'SHIFT',
    reference_id: 'shift_01',
    occurred_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    notes: 'Morning shift physical cash collected (Ramesh Kumar - Dispenser 1 & 2)',
    created_by: 'usr_manager_001',
    creator_name: 'Station Manager',
    title: 'Morning Shift Physical Cash',
    is_inflow: true,
    created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  },
  {
    id: 'cl_02',
    entry_type: 'OWNER_COLLECTION',
    amount: -25000.0,
    reference_type: 'OWNER_COLLECTION',
    reference_id: 'occ_01',
    occurred_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    notes: 'Mid-day cash withdrawal for bank deposit (Receipt #DEP-449)',
    created_by: 'usr_manager_001',
    creator_name: 'Station Manager',
    title: 'Owner Mid-Shift Cash Collection',
    is_inflow: false,
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
];

let localOwnerCollections: OwnerCashCollection[] = [
  {
    id: 'occ_01',
    amount: 25000.0,
    collected_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    notes: 'Mid-day cash withdrawal for bank deposit (Receipt #DEP-449)',
    recorded_by: 'usr_manager_001',
    recorded_by_name: 'Station Manager',
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
];

export async function getCashLedger(
  dateFilter?: string,
  typeFilter?: CashLedgerEntryType
): Promise<{ entries: CashLedgerItemWithMeta[]; summary: ReturnType<typeof calculateCashLedgerSummary> }> {
  let entries: CashLedgerItemWithMeta[] = [];

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    try {
      const supabase = await createClient();
      let query = supabase
        .from('cash_ledger')
        .select(`
          *,
          profile:created_by(name)
        `)
        .order('occurred_at', { ascending: false });

      if (typeFilter) query = query.eq('entry_type', typeFilter);

      const { data, error } = await query;
      if (!error && data) {
        entries = data.map((d: any) => {
          const isInflow = d.entry_type === 'SHIFT_CASH' || d.entry_type === 'CREDIT_CASH_PAYMENT' || (d.entry_type === 'ADJUSTMENT' && d.amount > 0);
          let title = 'Cash Transaction';
          if (d.entry_type === 'SHIFT_CASH') title = 'Shift Cash Inflow';
          else if (d.entry_type === 'CREDIT_CASH_PAYMENT') title = 'Credit Repayment in Cash';
          else if (d.entry_type === 'OWNER_COLLECTION') title = 'Owner Cash Collection';
          else if (d.entry_type === 'ADJUSTMENT') title = `Cash Adjustment (${d.amount >= 0 ? '+' : '-'})`;

          return {
            ...d,
            amount: Number(d.amount),
            title,
            is_inflow: isInflow,
            creator_name: d.profile?.name || 'Staff',
          };
        });
      }
    } catch {
      // Fallback
    }
  }

  if (entries.length === 0) {
    entries = [...localLedgerEntries];
    if (typeFilter) {
      entries = entries.filter((e) => e.entry_type === typeFilter);
    }
  }

  if (dateFilter) {
    entries = entries.filter((e) => e.occurred_at.startsWith(dateFilter));
  }

  // Calculate summary strictly using our financial engine
  const summary = calculateCashLedgerSummary(localLedgerEntries);

  return { entries, summary };
}

export interface RecordOwnerCollectionInput {
  amount: number;
  notes?: string;
  collected_at?: string;
}

export async function recordOwnerCashCollection(input: RecordOwnerCollectionInput): Promise<OwnerCashCollection> {
  const currentUser = await getCurrentUser();
  const userId = currentUser?.id || 'usr_manager_001';
  const userRole = currentUser?.role || 'MANAGER';

  const amount = Math.abs(Number(input.amount));
  const occurredAt = input.collected_at || new Date().toISOString();
  const occId = `occ_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const clId = `cl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const collectionRecord: OwnerCashCollection = {
    id: occId,
    amount,
    collected_at: occurredAt,
    notes: input.notes?.trim() || null,
    recorded_by: userId,
    recorded_by_name: currentUser?.name || 'Station Manager',
    created_at: new Date().toISOString(),
  };

  const ledgerEntry: CashLedgerItemWithMeta = {
    id: clId,
    entry_type: 'OWNER_COLLECTION',
    amount: -amount, // Negative entry in cash ledger
    reference_type: 'OWNER_COLLECTION',
    reference_id: occId,
    occurred_at: occurredAt,
    notes: input.notes?.trim() || 'Owner cash withdrawal',
    created_by: userId,
    creator_name: currentUser?.name || 'Station Manager',
    title: 'Owner Cash Collection',
    is_inflow: false,
    created_at: new Date().toISOString(),
  };

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    try {
      const supabase = await createClient();

      // Insert collection record
      await supabase.from('owner_cash_collections').insert({
        id: occId,
        amount,
        collected_at: occurredAt,
        notes: input.notes?.trim() || null,
        recorded_by: userId,
      });

      // Insert negative cash ledger entry
      await supabase.from('cash_ledger').insert({
        id: clId,
        entry_type: 'OWNER_COLLECTION',
        amount: -amount,
        reference_type: 'OWNER_COLLECTION',
        reference_id: occId,
        occurred_at: occurredAt,
        notes: input.notes?.trim() || 'Owner cash withdrawal',
        created_by: userId,
      });

      // Insert audit log
      await logAuditAction({
        actorUserId: userId,
        actorRole: userRole,
        action: 'OWNER_CASH_COLLECTED',
        module: 'CASH_LEDGER',
        entityType: 'OWNER_COLLECTION',
        entityId: occId,
        newValues: {
          collection_id: occId,
          amount_collected: amount,
          occurred_at: occurredAt,
          notes: input.notes,
        },
        reason: `Owner collected ₹${amount.toLocaleString('en-IN')}: ${input.notes || 'Mid-shift collection'}`,
      });

      return collectionRecord;
    } catch {
      // Fallback
    }
  }

  // Local fallback persistence
  localOwnerCollections.unshift(collectionRecord);
  localLedgerEntries.unshift(ledgerEntry);

  await logAuditAction({
    actorUserId: userId,
    actorRole: userRole,
    action: 'OWNER_CASH_COLLECTED',
    module: 'CASH_LEDGER',
    entityType: 'OWNER_COLLECTION',
    entityId: occId,
    newValues: {
      collection_id: occId,
      amount_collected: amount,
      occurred_at: occurredAt,
      notes: input.notes,
    },
    reason: `Owner collected ₹${amount.toLocaleString('en-IN')}: ${input.notes || 'Mid-shift collection'}`,
  });

  return collectionRecord;
}

export interface RecordCashAdjustmentInput {
  amount: number; // Positive (excess) or Negative (shortage)
  reason: string;
}

export async function recordCashAdjustment(input: RecordCashAdjustmentInput): Promise<CashLedgerItemWithMeta> {
  const currentUser = await getCurrentUser();
  const userId = currentUser?.id || 'usr_manager_001';
  const userRole = currentUser?.role || 'MANAGER';

  const amount = Number(input.amount);
  const occurredAt = new Date().toISOString();
  const clId = `cl_adj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const ledgerEntry: CashLedgerItemWithMeta = {
    id: clId,
    entry_type: 'ADJUSTMENT',
    amount,
    reference_type: 'MANUAL_ADJUSTMENT',
    reference_id: null,
    occurred_at: occurredAt,
    notes: input.reason.trim(),
    created_by: userId,
    creator_name: currentUser?.name || 'Staff',
    title: `Cash Adjustment (${amount >= 0 ? '+' : '-'}${Math.abs(amount)})`,
    is_inflow: amount >= 0,
    created_at: occurredAt,
  };

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    try {
      const supabase = await createClient();
      await supabase.from('cash_ledger').insert({
        id: clId,
        entry_type: 'ADJUSTMENT',
        amount,
        reference_type: 'MANUAL_ADJUSTMENT',
        reference_id: null,
        occurred_at: occurredAt,
        notes: input.reason.trim(),
        created_by: userId,
      });

      await logAuditAction({
        actorUserId: userId,
        actorRole: userRole,
        action: 'CASH_DRAWER_ADJUSTMENT',
        module: 'CASH_LEDGER',
        entityType: 'ADJUSTMENT',
        entityId: clId,
        newValues: { amount, reason: input.reason },
        reason: `Manual cash adjustment of ₹${amount}: ${input.reason}`,
      });

      return ledgerEntry;
    } catch {
      // Fallback
    }
  }

  localLedgerEntries.unshift(ledgerEntry);

  await logAuditAction({
    actorUserId: userId,
    actorRole: userRole,
    action: 'CASH_DRAWER_ADJUSTMENT',
    module: 'CASH_LEDGER',
    entityType: 'ADJUSTMENT',
    entityId: clId,
    newValues: { amount, reason: input.reason },
    reason: `Manual cash adjustment of ₹${amount}: ${input.reason}`,
  });

  return ledgerEntry;
}

export function appendShiftCashToLedger(shiftId: string, cashAmount: number, employeeName: string, userId: string) {
  if (cashAmount <= 0) return;

  const now = new Date().toISOString();
  const clId = `cl_shift_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const ledgerEntry: CashLedgerItemWithMeta = {
    id: clId,
    entry_type: 'SHIFT_CASH',
    amount: cashAmount,
    reference_type: 'SHIFT',
    reference_id: shiftId,
    occurred_at: now,
    notes: `Shift physical cash collected from ${employeeName}`,
    created_by: userId,
    creator_name: 'Station Manager',
    title: `Shift Cash (${employeeName})`,
    is_inflow: true,
    created_at: now,
  };

  localLedgerEntries.unshift(ledgerEntry);
}

import { createClient } from '@/lib/supabase/server';
import { CreditCustomer, CreditTransaction, CreditPaymentMethod } from '@/types';
import { calculateCreditBalance } from '@/lib/calculations/credit';
import { logAuditAction } from './audit.service';
import { getCurrentUser } from './auth.service';

export interface CreditCustomerWithBalance extends CreditCustomer {
  outstanding_balance: number;
  total_credit_given: number;
  total_repayments: number;
  last_transaction_at?: string;
}

export interface CreditTransactionWithMeta extends CreditTransaction {
  customer_name?: string;
  creator_name?: string;
}

// In-memory fallback stores for demo & offline persistence
let localCustomers: CreditCustomer[] = [
  {
    id: 'cust_01',
    name: 'Sharma Transport Co.',
    phone: '+91 98765 43210',
    status: 'ACTIVE',
    notes: 'Regular fleet customer - 15 days credit terms',
    created_by: 'usr_admin_001',
    created_at: new Date(Date.now() - 30 * 86400 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 86400 * 1000).toISOString(),
  },
  {
    id: 'cust_02',
    name: 'Verma Earthmovers',
    phone: '+91 98111 22334',
    status: 'ACTIVE',
    notes: 'JCB & excavator diesel chit account',
    created_by: 'usr_admin_001',
    created_at: new Date(Date.now() - 20 * 86400 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 20 * 86400 * 1000).toISOString(),
  },
  {
    id: 'cust_03',
    name: 'Gupta Bus Services',
    phone: '+91 99887 76655',
    status: 'ACTIVE',
    notes: 'Intercity bus fleet account',
    created_by: 'usr_admin_001',
    created_at: new Date(Date.now() - 15 * 86400 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 86400 * 1000).toISOString(),
  },
];

let localCreditTransactions: CreditTransactionWithMeta[] = [
  {
    id: 'ctx_01',
    customer_id: 'cust_01',
    customer_name: 'Sharma Transport Co.',
    transaction_type: 'CREDIT_GIVEN',
    amount: 15400.0,
    payment_method: null,
    description: 'Shift #shift_01 Diesel Fuel Chit (#CH-401)',
    transaction_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    created_by: 'usr_manager_001',
    creator_name: 'Station Manager',
    created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  },
  {
    id: 'ctx_02',
    customer_id: 'cust_02',
    customer_name: 'Verma Earthmovers',
    transaction_type: 'CREDIT_GIVEN',
    amount: 8500.0,
    payment_method: null,
    description: 'Shift #shift_01 HSD Fuel Chit (#CH-402)',
    transaction_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    created_by: 'usr_manager_001',
    creator_name: 'Station Manager',
    created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
  {
    id: 'ctx_03',
    customer_id: 'cust_01',
    customer_name: 'Sharma Transport Co.',
    transaction_type: 'PAYMENT_RECEIVED',
    amount: 5000.0,
    payment_method: 'CASH',
    description: 'Part cash repayment received at station counter',
    transaction_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    created_by: 'usr_manager_001',
    creator_name: 'Station Manager',
    created_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
  },
];

/**
 * Get all credit customers with live calculated outstanding balance
 */
export async function getCreditCustomers(searchTerm?: string): Promise<{
  customers: CreditCustomerWithBalance[];
  totalOutstanding: number;
}> {
  let customers: CreditCustomerWithBalance[] = [];

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    try {
      const supabase = await createClient();
      let query = supabase.from('credit_customers').select('*').order('name', { ascending: true });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (!error && data) {
        customers = data.map((cust: any) => {
          const bal = calculateCreditBalance(localCreditTransactions, cust.id);
          const custTxs = localCreditTransactions
            .filter((t) => t.customer_id === cust.id)
            .sort((a, b) => new Date(b.transaction_at).getTime() - new Date(a.transaction_at).getTime());

          return {
            ...cust,
            outstanding_balance: bal.outstandingBalance,
            total_credit_given: bal.totalCreditGiven,
            total_repayments: bal.totalPaymentsReceived,
            last_transaction_at: custTxs[0]?.transaction_at || cust.created_at,
          };
        });
      }
    } catch {
      // Fallback
    }
  }

  if (customers.length === 0) {
    let filtered = [...localCustomers];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) => c.name.toLowerCase().includes(term) || (c.phone && c.phone.includes(term))
      );
    }

    customers = filtered.map((cust) => {
      const bal = calculateCreditBalance(localCreditTransactions, cust.id);
      const custTxs = localCreditTransactions
        .filter((t) => t.customer_id === cust.id)
        .sort((a, b) => new Date(b.transaction_at).getTime() - new Date(a.transaction_at).getTime());

      return {
        ...cust,
        outstanding_balance: bal.outstandingBalance,
        total_credit_given: bal.totalCreditGiven,
        total_repayments: bal.totalPaymentsReceived,
        last_transaction_at: custTxs[0]?.transaction_at || cust.created_at,
      };
    });
  }

  const overallBalance = calculateCreditBalance(localCreditTransactions);

  return {
    customers,
    totalOutstanding: overallBalance.outstandingBalance,
  };
}

/**
 * Create or update credit customer
 */
export async function saveCreditCustomer(input: {
  id?: string;
  name: string;
  phone?: string;
  notes?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}): Promise<CreditCustomer> {
  const currentUser = await getCurrentUser();
  const userId = currentUser?.id || 'usr_admin_001';
  const userRole = currentUser?.role || 'ADMIN';
  const isEdit = Boolean(input.id);
  const custId = input.id || `cust_${Date.now()}`;
  const now = new Date().toISOString();

  const customerRecord: CreditCustomer = {
    id: custId,
    name: input.name.trim(),
    phone: input.phone?.trim() || null,
    status: input.status || 'ACTIVE',
    notes: input.notes?.trim() || null,
    created_by: userId,
    created_at: now,
    updated_at: now,
  };

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    try {
      const supabase = await createClient();
      if (isEdit) {
        await supabase
          .from('credit_customers')
          .update({
            name: input.name.trim(),
            phone: input.phone?.trim() || null,
            status: input.status || 'ACTIVE',
            notes: input.notes?.trim() || null,
            updated_at: now,
          })
          .eq('id', custId);
      } else {
        await supabase.from('credit_customers').insert({
          id: custId,
          name: input.name.trim(),
          phone: input.phone?.trim() || null,
          status: input.status || 'ACTIVE',
          notes: input.notes?.trim() || null,
          created_by: userId,
        });
      }

      await logAuditAction({
        actorUserId: userId,
        actorRole: userRole,
        action: isEdit ? 'CREDIT_CUSTOMER_UPDATED' : 'CREDIT_CUSTOMER_CREATED',
        module: 'CREDIT_BOOK',
        entityType: 'CREDIT_CUSTOMER',
        entityId: custId,
        newValues: customerRecord,
        reason: `${isEdit ? 'Updated' : 'Created'} credit account for ${input.name}`,
      });

      return customerRecord;
    } catch {
      // Fallback
    }
  }

  if (isEdit) {
    const idx = localCustomers.findIndex((c) => c.id === custId);
    if (idx >= 0) localCustomers[idx] = { ...localCustomers[idx], ...customerRecord };
  } else {
    localCustomers.unshift(customerRecord);
  }

  await logAuditAction({
    actorUserId: userId,
    actorRole: userRole,
    action: isEdit ? 'CREDIT_CUSTOMER_UPDATED' : 'CREDIT_CUSTOMER_CREATED',
    module: 'CREDIT_BOOK',
    entityType: 'CREDIT_CUSTOMER',
    entityId: custId,
    newValues: customerRecord,
    reason: `${isEdit ? 'Updated' : 'Created'} credit account for ${input.name}`,
  });

  return customerRecord;
}

/**
 * Record Credit Repayment or Credit Given transaction
 */
export interface RecordCreditTransactionInput {
  customer_id: string;
  transaction_type: 'CREDIT_GIVEN' | 'PAYMENT_RECEIVED' | 'ADJUSTMENT';
  amount: number;
  payment_method?: CreditPaymentMethod;
  description?: string;
  transaction_at?: string;
}

export async function recordCreditTransaction(
  input: RecordCreditTransactionInput
): Promise<CreditTransactionWithMeta> {
  const currentUser = await getCurrentUser();
  const userId = currentUser?.id || 'usr_manager_001';
  const userRole = currentUser?.role || 'MANAGER';
  const amount = Math.abs(Number(input.amount));
  const timestamp = input.transaction_at || new Date().toISOString();
  const ctxId = `ctx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const customer = localCustomers.find((c) => c.id === input.customer_id);
  const customerName = customer?.name || 'Credit Customer';

  const txRecord: CreditTransactionWithMeta = {
    id: ctxId,
    customer_id: input.customer_id,
    customer_name: customerName,
    transaction_type: input.transaction_type,
    amount,
    payment_method: input.transaction_type === 'PAYMENT_RECEIVED' ? input.payment_method || 'CASH' : null,
    description: input.description?.trim() || null,
    transaction_at: timestamp,
    created_by: userId,
    creator_name: currentUser?.name || 'Station Manager',
    created_at: new Date().toISOString(),
  };

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    try {
      const supabase = await createClient();

      await supabase.from('credit_transactions').insert({
        id: ctxId,
        customer_id: input.customer_id,
        transaction_type: input.transaction_type,
        amount,
        payment_method: input.transaction_type === 'PAYMENT_RECEIVED' ? input.payment_method || 'CASH' : null,
        description: input.description?.trim() || null,
        transaction_at: timestamp,
        created_by: userId,
      });

      // If CASH repayment, append to cash ledger
      if (input.transaction_type === 'PAYMENT_RECEIVED' && input.payment_method === 'CASH') {
        const clId = `cl_cred_${Date.now()}`;
        await supabase.from('cash_ledger').insert({
          id: clId,
          entry_type: 'CREDIT_CASH_PAYMENT',
          amount, // Positive cash inflow
          reference_type: 'CREDIT_TRANSACTION',
          reference_id: ctxId,
          occurred_at: timestamp,
          notes: `Cash credit repayment from ${customerName}`,
          created_by: userId,
        });
      }

      await logAuditAction({
        actorUserId: userId,
        actorRole: userRole,
        action: input.transaction_type === 'PAYMENT_RECEIVED' ? 'CREDIT_REPAYMENT_RECORDED' : 'CREDIT_GIVEN_RECORDED',
        module: 'CREDIT_BOOK',
        entityType: 'CREDIT_TRANSACTION',
        entityId: ctxId,
        newValues: { customer_id: input.customer_id, amount, payment_method: input.payment_method },
        reason: `${input.transaction_type}: ₹${amount.toLocaleString('en-IN')} for ${customerName}`,
      });

      return txRecord;
    } catch {
      // Fallback
    }
  }

  localCreditTransactions.unshift(txRecord);

  await logAuditAction({
    actorUserId: userId,
    actorRole: userRole,
    action: input.transaction_type === 'PAYMENT_RECEIVED' ? 'CREDIT_REPAYMENT_RECORDED' : 'CREDIT_GIVEN_RECORDED',
    module: 'CREDIT_BOOK',
    entityType: 'CREDIT_TRANSACTION',
    entityId: ctxId,
    newValues: { customer_id: input.customer_id, amount, payment_method: input.payment_method },
    reason: `${input.transaction_type}: ₹${amount.toLocaleString('en-IN')} for ${customerName}`,
  });

  return txRecord;
}

/**
 * Get detailed customer account statement ledger
 */
export async function getCustomerStatement(customerId: string) {
  const customer = localCustomers.find((c) => c.id === customerId);
  let transactions = localCreditTransactions.filter((t) => t.customer_id === customerId);

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from('credit_transactions')
        .select('*, profile:created_by(name)')
        .eq('customer_id', customerId)
        .order('transaction_at', { ascending: false });

      if (data) {
        transactions = data.map((d: any) => ({
          ...d,
          amount: Number(d.amount),
          creator_name: d.profile?.name || 'Staff',
        }));
      }
    } catch {
      // Fallback
    }
  }

  const balanceSummary = calculateCreditBalance(transactions);

  return {
    customer: customer || { id: customerId, name: 'Credit Customer', status: 'ACTIVE' },
    summary: balanceSummary,
    transactions: transactions.sort((a, b) => new Date(b.transaction_at).getTime() - new Date(a.transaction_at).getTime()),
  };
}

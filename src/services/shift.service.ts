import { createClient } from '@/lib/supabase/server';
import {
  Shift,
  ShiftPayment,
  OtherSale,
  ShiftType,
  PaymentMethod,
  CashLedgerEntry,
} from '@/types';
import { logAuditAction } from './audit.service';
import { getCurrentUser } from './auth.service';
import { getEmployeeById } from './employee.service';

export interface ShiftRecordWithDetails extends Shift {
  payments: ShiftPayment[];
  other_sales: OtherSale[];
  total_sales: number;
  cash_amount: number;
  digital_amount: number;
  credit_amount: number;
}

// In-memory fallback persistent store
let localShifts: ShiftRecordWithDetails[] = [
  {
    id: 'shift_01',
    employee_id: 'emp_01',
    employee_name: 'Ramesh Kumar',
    shift_date: new Date().toISOString().split('T')[0],
    shift_type: 'MORNING',
    custom_shift_name: null,
    status: 'COMPLETED',
    notes: 'Morning shift completed smoothly. Dispenser 1 & 2.',
    entered_by: 'usr_manager_001',
    entered_by_name: 'Station Manager',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    payments: [
      {
        id: 'sp_01',
        shift_id: 'shift_01',
        payment_method: 'CASH',
        amount: 42500.0,
        customer_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'sp_02',
        shift_id: 'shift_01',
        payment_method: 'UPI',
        amount: 18200.0,
        customer_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'sp_03',
        shift_id: 'shift_01',
        payment_method: 'CARD',
        amount: 9300.0,
        customer_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'sp_04',
        shift_id: 'shift_01',
        payment_method: 'CREDIT',
        amount: 12000.0,
        customer_id: 'cust_02',
        customer_name: 'Green Earth Transport',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    other_sales: [
      {
        id: 'os_01',
        shift_id: 'shift_01',
        description: 'Engine Oil 20W40 (2 x 1L pouches)',
        amount: 760.0,
        created_by: 'usr_manager_001',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    total_sales: 82760.0,
    cash_amount: 42500.0,
    digital_amount: 27500.0,
    credit_amount: 12000.0,
  },
];

export async function getShifts(dateFilter?: string, employeeIdFilter?: string): Promise<ShiftRecordWithDetails[]> {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    try {
      const supabase = await createClient();
      let query = supabase
        .from('shifts')
        .select(`
          *,
          employee:employees(name),
          payments:shift_payments(*),
          other_sales:other_sales(*)
        `)
        .order('shift_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (dateFilter) query = query.eq('shift_date', dateFilter);
      if (employeeIdFilter) query = query.eq('employee_id', employeeIdFilter);

      const { data, error } = await query;
      if (!error && data) {
        return data.map((s: any) => {
          const payments: ShiftPayment[] = s.payments || [];
          const otherSales: OtherSale[] = s.other_sales || [];
          const cashAmount = payments.filter((p) => p.payment_method === 'CASH').reduce((sum, p) => sum + Number(p.amount), 0);
          const upiAmount = payments.filter((p) => p.payment_method === 'UPI').reduce((sum, p) => sum + Number(p.amount), 0);
          const cardAmount = payments.filter((p) => p.payment_method === 'CARD').reduce((sum, p) => sum + Number(p.amount), 0);
          const creditAmount = payments.filter((p) => p.payment_method === 'CREDIT').reduce((sum, p) => sum + Number(p.amount), 0);
          const otherAmount = otherSales.reduce((sum, o) => sum + Number(o.amount), 0);

          return {
            ...s,
            employee_name: s.employee?.name || 'Unknown',
            payments,
            other_sales: otherSales,
            total_sales: cashAmount + upiAmount + cardAmount + creditAmount + otherAmount,
            cash_amount: cashAmount,
            digital_amount: upiAmount + cardAmount,
            credit_amount: creditAmount,
          };
        });
      }
    } catch {
      // Fallback
    }
  }

  let results = [...localShifts];
  if (dateFilter) {
    results = results.filter((s) => s.shift_date === dateFilter);
  }
  if (employeeIdFilter) {
    results = results.filter((s) => s.employee_id === employeeIdFilter);
  }
  return results;
}

export interface CreateShiftInput {
  employee_id: string;
  shift_date: string;
  shift_type: ShiftType;
  custom_shift_name?: string;
  notes?: string;
  payments: {
    payment_method: PaymentMethod;
    amount: number;
    customer_id?: string | null;
  }[];
  other_sales?: {
    description: string;
    amount: number;
  }[];
}

export async function createShift(input: CreateShiftInput): Promise<ShiftRecordWithDetails> {
  const currentUser = await getCurrentUser();
  const userId = currentUser?.id || 'usr_manager_001';
  const userRole = currentUser?.role || 'MANAGER';
  const employee = await getEmployeeById(input.employee_id);

  const shiftId = `shift_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  // Payments
  const payments: ShiftPayment[] = input.payments
    .filter((p) => p.amount > 0)
    .map((p, idx) => ({
      id: `sp_${Date.now()}_${idx}`,
      shift_id: shiftId,
      payment_method: p.payment_method,
      amount: Number(p.amount),
      customer_id: p.customer_id || null,
      created_at: now,
      updated_at: now,
    }));

  // Other Sales
  const otherSales: OtherSale[] = (input.other_sales || [])
    .filter((o) => o.amount > 0 && o.description.trim())
    .map((o, idx) => ({
      id: `os_${Date.now()}_${idx}`,
      shift_id: shiftId,
      description: o.description.trim(),
      amount: Number(o.amount),
      created_by: userId,
      created_at: now,
      updated_at: now,
    }));

  const cashAmount = payments.filter((p) => p.payment_method === 'CASH').reduce((sum, p) => sum + p.amount, 0);
  const upiAmount = payments.filter((p) => p.payment_method === 'UPI').reduce((sum, p) => sum + p.amount, 0);
  const cardAmount = payments.filter((p) => p.payment_method === 'CARD').reduce((sum, p) => sum + p.amount, 0);
  const creditAmount = payments.filter((p) => p.payment_method === 'CREDIT').reduce((sum, p) => sum + p.amount, 0);
  const otherAmount = otherSales.reduce((sum, o) => sum + o.amount, 0);
  const totalSales = cashAmount + upiAmount + cardAmount + creditAmount + otherAmount;

  const newShift: ShiftRecordWithDetails = {
    id: shiftId,
    employee_id: input.employee_id,
    employee_name: employee?.name || 'Staff Attendant',
    shift_date: input.shift_date,
    shift_type: input.shift_type,
    custom_shift_name: input.custom_shift_name || null,
    status: 'COMPLETED',
    notes: input.notes || null,
    entered_by: userId,
    entered_by_name: currentUser?.name || 'Station Manager',
    created_at: now,
    updated_at: now,
    payments,
    other_sales: otherSales,
    total_sales: totalSales,
    cash_amount: cashAmount,
    digital_amount: upiAmount + cardAmount,
    credit_amount: creditAmount,
  };

  // 1. Post to Supabase if configured
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    try {
      const supabase = await createClient();

      // Insert Shift
      await supabase.from('shifts').insert({
        id: shiftId,
        employee_id: input.employee_id,
        shift_date: input.shift_date,
        shift_type: input.shift_type,
        custom_shift_name: input.custom_shift_name || null,
        status: 'COMPLETED',
        notes: input.notes || null,
        entered_by: userId,
        created_at: now,
        updated_at: now,
      });

      // Insert Payments
      if (payments.length > 0) {
        await supabase.from('shift_payments').insert(payments);
      }

      // Insert Other Sales
      if (otherSales.length > 0) {
        await supabase.from('other_sales').insert(otherSales);
      }

      // Post to Cash Ledger if Physical Cash Received
      if (cashAmount > 0) {
        await supabase.from('cash_ledger').insert({
          entry_type: 'SHIFT_CASH',
          amount: cashAmount,
          reference_type: 'SHIFT',
          reference_id: shiftId,
          occurred_at: now,
          notes: `Shift cash collected for ${employee?.name || 'staff'} (${input.shift_type})`,
          created_by: userId,
        });
      }

      // Post Credit Transaction if Credit Issued
      const creditPayment = payments.find((p) => p.payment_method === 'CREDIT' && p.customer_id);
      if (creditPayment && creditPayment.customer_id) {
        await supabase.from('credit_transactions').insert({
          customer_id: creditPayment.customer_id,
          transaction_type: 'CREDIT_GIVEN',
          amount: creditPayment.amount,
          description: `Fuel credit chit from shift #${shiftId.substring(0, 8)} (${employee?.name || 'staff'})`,
          transaction_at: now,
          created_by: userId,
        });
      }

      // Audit Log
      await logAuditAction({
        actorUserId: userId,
        actorRole: userRole,
        action: 'SHIFT_RECORDED',
        module: 'SHIFTS',
        entityType: 'SHIFT',
        entityId: shiftId,
        newValues: {
          shift_id: shiftId,
          employee: employee?.name,
          date: input.shift_date,
          shift_type: input.shift_type,
          total_revenue: totalSales,
          cash: cashAmount,
          digital: upiAmount + cardAmount,
          credit: creditAmount,
        },
        reason: `Recorded shift for ${employee?.name || 'staff'} on ${input.shift_date} (Total: ₹${totalSales})`,
      });

      return newShift;
    } catch {
      // Fallback to local
    }
  }

  // Local fallback persistence
  localShifts.unshift(newShift);

  await logAuditAction({
    actorUserId: userId,
    actorRole: userRole,
    action: 'SHIFT_RECORDED',
    module: 'SHIFTS',
    entityType: 'SHIFT',
    entityId: shiftId,
    newValues: {
      shift_id: shiftId,
      employee: employee?.name,
      date: input.shift_date,
      shift_type: input.shift_type,
      total_revenue: totalSales,
      cash: cashAmount,
      digital: upiAmount + cardAmount,
      credit: creditAmount,
    },
    reason: `Recorded shift for ${employee?.name || 'staff'} on ${input.shift_date} (Total: ₹${totalSales})`,
  });

  return newShift;
}

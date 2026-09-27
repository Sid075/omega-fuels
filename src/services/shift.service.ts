import { createClient } from '@/lib/supabase/server';
import {
  Shift,
  ShiftPayment,
  OtherSale,
  ShiftType,
  PaymentMethod,
  CashLedgerEntry,
  ShiftNozzleReading,
  ShiftCreditPayment,
  CreditPaymentMethod,
  FuelType,
} from '@/types';
import { logAuditAction } from './audit.service';
import { getCurrentUser } from './auth.service';
import { getEmployeeById } from './employee.service';
import { appendShiftCashToLedger } from './cash.service';
import { recordCreditTransaction, getCreditCustomerById } from './credit.service';
import { safeRound } from '@/lib/calculations/cash';

export interface ShiftRecordWithDetails extends Shift {
  payments: ShiftPayment[];
  other_sales: OtherSale[];
  nozzle_readings?: ShiftNozzleReading[];
  credit_payments?: ShiftCreditPayment[];
  credit_issued?: { customer_id: string; customer_name: string; amount: number }[];
  total_sales: number;
  cash_amount: number;
  digital_amount: number;
  credit_amount: number;
  credit_repayments_cash?: number;
  credit_repayments_digital?: number;
  credit_repayments_total?: number;
  total_physical_cash?: number;
  calculated_fuel_sales?: number;
  total_fuel_litres?: number;
  reconciliation_variance?: number;
}

// In-memory fallback persistent store
let localShifts: ShiftRecordWithDetails[] = [
  {
    id: 'shift_01',
    employee_id: 'emp_01',
    employee_name: 'Ramesh Kumar',
    shift_date: '2026-08-25',
    shift_type: 'MORNING',
    custom_shift_name: null,
    status: 'COMPLETED',
    notes: 'Morning shift completed smoothly. Dispenser 1 & 2.',
    entered_by: 'usr_manager_001',
    entered_by_name: 'Station Manager',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    nozzle_readings: [
      {
        id: 'snr_01',
        shift_id: 'shift_01',
        nozzle_name: 'Machine 1 - Petrol',
        fuel_type: 'PETROL',
        opening_reading: 1204.5,
        closing_reading: 1820.0,
        litres_sold: 615.5,
        price_per_litre: 103.5,
        sales_amount: 63704.25,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'snr_02',
        shift_id: 'shift_01',
        nozzle_name: 'Machine 1 - Diesel',
        fuel_type: 'DIESEL',
        opening_reading: 2400.0,
        closing_reading: 2602.76,
        litres_sold: 202.76,
        price_per_litre: 90.24,
        sales_amount: 18297.06,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
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
    credit_payments: [],
    credit_repayments_cash: 0,
    credit_repayments_digital: 0,
    credit_repayments_total: 0,
    total_physical_cash: 42500.0,
    total_sales: 82761.31,
    cash_amount: 42500.0,
    digital_amount: 27500.0,
    credit_amount: 12000.0,
    calculated_fuel_sales: 82001.31,
    total_fuel_litres: 818.26,
    reconciliation_variance: -0.00,
  },
];

export async function getShifts(
  dateFilter?: string,
  employeeIdFilter?: string,
  startDate?: string,
  endDate?: string
): Promise<ShiftRecordWithDetails[]> {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    try {
      const supabase = await createClient();
      let query = supabase
        .from('shifts')
        .select(`
          *,
          employee:employees(name),
          payments:shift_payments(*),
          other_sales:other_sales(*),
          nozzle_readings:shift_nozzle_readings(*),
          credit_transactions:credit_transactions(*)
        `)
        .order('shift_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (dateFilter) query = query.eq('shift_date', dateFilter);
      if (startDate) query = query.gte('shift_date', startDate);
      if (endDate) query = query.lte('shift_date', endDate);
      if (employeeIdFilter) query = query.eq('employee_id', employeeIdFilter);

      const { data, error } = await query;
      if (!error && data) {
        return data.map((s: any) => {
          const payments: ShiftPayment[] = s.payments || [];
          const otherSales: OtherSale[] = s.other_sales || [];
          const nozzleReadings: ShiftNozzleReading[] = s.nozzle_readings || [];

          const cashAmount = safeRound(payments.filter((p) => p.payment_method === 'CASH').reduce((sum, p) => sum + Number(p.amount), 0));
          const upiAmount = safeRound(payments.filter((p) => p.payment_method === 'UPI').reduce((sum, p) => sum + Number(p.amount), 0));
          const cardAmount = safeRound(payments.filter((p) => p.payment_method === 'CARD').reduce((sum, p) => sum + Number(p.amount), 0));
          const creditAmount = safeRound(payments.filter((p) => p.payment_method === 'CREDIT').reduce((sum, p) => sum + Number(p.amount), 0));
          const otherAmount = safeRound(otherSales.reduce((sum, o) => sum + Number(o.amount), 0));
          const actualCollections = safeRound(cashAmount + upiAmount + cardAmount + creditAmount);

          const totalFuelLitres = safeRound(nozzleReadings.reduce((sum, n) => sum + Number(n.litres_sold || 0), 0));
          const calculatedFuelSales = safeRound(nozzleReadings.reduce((sum, n) => sum + Number(n.sales_amount || 0), 0));
          const expectedTotalSales = nozzleReadings.length > 0
            ? safeRound(calculatedFuelSales + otherAmount)
            : safeRound(actualCollections + otherAmount);

          const reconciliationVariance = nozzleReadings.length > 0
            ? safeRound(actualCollections - expectedTotalSales)
            : 0;

          // Credit book repayments associated with this shift
          const creditRepayments: ShiftCreditPayment[] = (s.credit_transactions || [])
            .filter((ct: any) => ct.transaction_type === 'PAYMENT_RECEIVED')
            .map((ct: any) => ({
              id: ct.id,
              shift_id: s.id,
              customer_id: ct.customer_id,
              customer_name: ct.customer_name || 'Customer',
              amount: Number(ct.amount),
              payment_method: ct.payment_method || 'CASH',
              notes: ct.description || null,
              created_at: ct.transaction_at,
            }));

          const creditRepaymentsCash = safeRound(
            creditRepayments.filter((cr) => cr.payment_method === 'CASH').reduce((sum, cr) => sum + cr.amount, 0)
          );
          const creditRepaymentsDigital = safeRound(
            creditRepayments.filter((cr) => cr.payment_method !== 'CASH').reduce((sum, cr) => sum + cr.amount, 0)
          );
          const creditRepaymentsTotal = safeRound(creditRepaymentsCash + creditRepaymentsDigital);
          const totalPhysicalCash = safeRound(cashAmount + creditRepaymentsCash);

          const creditIssued = (s.credit_transactions || [])
            .filter((ct: any) => ct.transaction_type === 'CREDIT_GIVEN')
            .map((ct: any) => ({
              customer_id: ct.customer_id,
              customer_name: ct.customer_name || 'Customer',
              amount: Number(ct.amount),
            }));

          return {
            ...s,
            employee_name: s.employee?.name || 'Unknown',
            payments,
            other_sales: otherSales,
            nozzle_readings: nozzleReadings,
            credit_payments: creditRepayments,
            credit_issued: creditIssued,
            total_sales: expectedTotalSales,
            cash_amount: cashAmount,
            digital_amount: safeRound(upiAmount + cardAmount),
            credit_amount: creditAmount,
            credit_repayments_cash: creditRepaymentsCash,
            credit_repayments_digital: creditRepaymentsDigital,
            credit_repayments_total: creditRepaymentsTotal,
            total_physical_cash: totalPhysicalCash,
            total_fuel_litres: totalFuelLitres,
            calculated_fuel_sales: calculatedFuelSales,
            reconciliation_variance: reconciliationVariance,
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
  if (startDate) {
    results = results.filter((s) => s.shift_date >= startDate);
  }
  if (endDate) {
    results = results.filter((s) => s.shift_date <= endDate);
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
  nozzle_readings?: {
    nozzle_name: string;
    fuel_type: FuelType;
    opening_reading: number;
    closing_reading: number;
    litres_sold: number;
    price_per_litre: number;
    sales_amount: number;
  }[];
  payments: {
    payment_method: PaymentMethod;
    amount: number;
    customer_id?: string | null;
  }[];
  other_sales?: {
    description: string;
    amount: number;
  }[];
  credit_payments?: {
    customer_id: string;
    amount: number;
    payment_method: CreditPaymentMethod;
    notes?: string;
  }[];
}

export async function createShift(input: CreateShiftInput): Promise<ShiftRecordWithDetails> {
  const currentUser = await getCurrentUser();
  const userId = currentUser?.id || 'usr_manager_001';
  const userRole = currentUser?.role || 'MANAGER';
  const employee = await getEmployeeById(input.employee_id);

  const shiftId = `shift_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  // Validate Credit Given items
  const creditPaymentInputs = (input.payments || []).filter(
    (p) => p.payment_method === 'CREDIT'
  );

  for (const cp of creditPaymentInputs) {
    const amt = Number(cp.amount);
    if (isNaN(amt) || amt < 0) {
      throw new Error('Credit amount cannot be negative.');
    }
    if (amt > 0) {
      if (!cp.customer_id || cp.customer_id.trim() === '' || cp.customer_id === 'walk_in_credit') {
        throw new Error(`Customer must be selected for credit of ₹${amt.toLocaleString('en-IN')}.`);
      }
      const cust = await getCreditCustomerById(cp.customer_id);
      if (!cust) {
        throw new Error(`Credit customer '${cp.customer_id}' not found.`);
      }
      if (cust.status !== 'ACTIVE') {
        throw new Error(`Credit customer '${cust.name}' is inactive.`);
      }
    }
  }

  // Validate and format Nozzle Readings
  const nozzleReadings: ShiftNozzleReading[] = (input.nozzle_readings || [])
    .filter((n) => Number(n.closing_reading) >= Number(n.opening_reading) && Number(n.opening_reading) >= 0)
    .map((n, idx) => {
      const open = Number(n.opening_reading);
      const close = Number(n.closing_reading);
      const litres = safeRound(close - open);
      const price = safeRound(Number(n.price_per_litre));
      const sales = safeRound(litres * price);
      return {
        id: `snr_${Date.now()}_${idx}`,
        shift_id: shiftId,
        nozzle_name: n.nozzle_name?.trim() || `Nozzle ${idx + 1}`,
        fuel_type: n.fuel_type === 'DIESEL' ? 'DIESEL' : 'PETROL',
        opening_reading: open,
        closing_reading: close,
        litres_sold: litres,
        price_per_litre: price,
        sales_amount: sales,
        created_at: now,
        updated_at: now,
      };
    });

  const totalFuelLitres = safeRound(nozzleReadings.reduce((sum, n) => sum + n.litres_sold, 0));
  const calculatedFuelSales = safeRound(nozzleReadings.reduce((sum, n) => sum + n.sales_amount, 0));

  // Payments (Sales payment methods)
  const payments: ShiftPayment[] = input.payments
    .filter((p) => p.amount > 0)
    .map((p, idx) => ({
      id: `sp_${Date.now()}_${idx}`,
      shift_id: shiftId,
      payment_method: p.payment_method,
      amount: safeRound(Number(p.amount)),
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
      amount: safeRound(Number(o.amount)),
      created_by: userId,
      created_at: now,
      updated_at: now,
    }));

  const cashAmount = safeRound(payments.filter((p) => p.payment_method === 'CASH').reduce((sum, p) => sum + p.amount, 0));
  const upiAmount = safeRound(payments.filter((p) => p.payment_method === 'UPI').reduce((sum, p) => sum + p.amount, 0));
  const cardAmount = safeRound(payments.filter((p) => p.payment_method === 'CARD').reduce((sum, p) => sum + p.amount, 0));
  const creditAmount = safeRound(payments.filter((p) => p.payment_method === 'CREDIT').reduce((sum, p) => sum + p.amount, 0));
  const otherAmount = safeRound(otherSales.reduce((sum, o) => sum + o.amount, 0));
  const actualCollections = safeRound(cashAmount + upiAmount + cardAmount + creditAmount);

  // Authoritative Expected Total Sales (Strictly fuel + other product sales; credit repayments are NOT sales revenue)
  const expectedTotalSales = nozzleReadings.length > 0
    ? safeRound(calculatedFuelSales + otherAmount)
    : safeRound(actualCollections + otherAmount);

  // Variance: actual collections minus expected total sales
  const reconciliationVariance = nozzleReadings.length > 0
    ? safeRound(actualCollections - expectedTotalSales)
    : 0;

  // Process Optional Credit Book Payments Received (Repayments from existing customers)
  const creditRepaymentsInput = (input.credit_payments || []).filter(
    (cp) => Number(cp.amount) > 0 && cp.customer_id
  );

  let creditRepaymentsCash = 0;
  let creditRepaymentsDigital = 0;
  const recordedCreditPayments: ShiftCreditPayment[] = [];

  for (const cp of creditRepaymentsInput) {
    const cpAmount = safeRound(Number(cp.amount));
    const isCash = cp.payment_method === 'CASH';

    if (isCash) {
      creditRepaymentsCash = safeRound(creditRepaymentsCash + cpAmount);
    } else {
      creditRepaymentsDigital = safeRound(creditRepaymentsDigital + cpAmount);
    }

    // Call recordCreditTransaction linked to this shift
    const tx = await recordCreditTransaction({
      customer_id: cp.customer_id,
      shift_id: shiftId,
      transaction_type: 'PAYMENT_RECEIVED',
      amount: cpAmount,
      payment_method: cp.payment_method,
      description: cp.notes?.trim() || `Credit book repayment on shift #${shiftId.substring(0, 8)}`,
      transaction_at: now,
    });

    recordedCreditPayments.push({
      id: tx.id,
      shift_id: shiftId,
      customer_id: cp.customer_id,
      customer_name: tx.customer_name,
      amount: cpAmount,
      payment_method: cp.payment_method,
      notes: cp.notes?.trim() || null,
      created_at: now,
    });
  }

  // Process Credit Given (Fuel chits issued to customers on credit)
  const recordedCreditGiven: { customer_id: string; customer_name: string; amount: number }[] = [];
  const creditPaymentsToRecord = (input.payments || []).filter(
    (p) => p.payment_method === 'CREDIT' && Number(p.amount) > 0 && p.customer_id
  );

  for (let idx = 0; idx < creditPaymentsToRecord.length; idx++) {
    const cp = creditPaymentsToRecord[idx];
    const cpAmount = safeRound(Number(cp.amount));
    const deterministicId = `ctx_${shiftId}_credit_${idx}`;

    const tx = await recordCreditTransaction({
      id: deterministicId,
      customer_id: cp.customer_id!,
      shift_id: shiftId,
      transaction_type: 'CREDIT_GIVEN',
      amount: cpAmount,
      description:
        (cp as any).notes?.trim() ||
        `Fuel credit chit from shift #${shiftId.substring(0, 8)} (${employee?.name || 'staff'})`,
      transaction_at: now,
    });

    recordedCreditGiven.push({
      customer_id: cp.customer_id!,
      customer_name: tx.customer_name || 'Customer',
      amount: cpAmount,
    });
  }

  const creditRepaymentsTotal = safeRound(creditRepaymentsCash + creditRepaymentsDigital);
  const totalPhysicalCash = safeRound(cashAmount + creditRepaymentsCash);

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
    nozzle_readings: nozzleReadings,
    payments,
    other_sales: otherSales,
    credit_payments: recordedCreditPayments,
    credit_issued: recordedCreditGiven,
    total_sales: expectedTotalSales,
    cash_amount: cashAmount,
    digital_amount: safeRound(upiAmount + cardAmount),
    credit_amount: creditAmount,
    credit_repayments_cash: creditRepaymentsCash,
    credit_repayments_digital: creditRepaymentsDigital,
    credit_repayments_total: creditRepaymentsTotal,
    total_physical_cash: totalPhysicalCash,
    total_fuel_litres: totalFuelLitres,
    calculated_fuel_sales: calculatedFuelSales,
    reconciliation_variance: reconciliationVariance,
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

      // Insert Nozzle Readings
      if (nozzleReadings.length > 0) {
        await supabase.from('shift_nozzle_readings').insert(nozzleReadings);
      }

      // Insert Payments
      if (payments.length > 0) {
        await supabase.from('shift_payments').insert(payments);
      }

      // Insert Other Sales
      if (otherSales.length > 0) {
        await supabase.from('other_sales').insert(otherSales);
      }

      // Post to Cash Ledger if Physical Cash Received from Shift Sales
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
          total_revenue: expectedTotalSales,
          calculated_fuel_sales: calculatedFuelSales,
          fuel_litres: totalFuelLitres,
          nozzle_count: nozzleReadings.length,
          reconciliation_variance: reconciliationVariance,
          cash: cashAmount,
          digital: safeRound(upiAmount + cardAmount),
          credit: creditAmount,
          credit_repayments_total: creditRepaymentsTotal,
          credit_repayments_cash: creditRepaymentsCash,
          credit_repayments_digital: creditRepaymentsDigital,
          total_physical_cash: totalPhysicalCash,
        },
        reason: `Recorded shift for ${employee?.name || 'staff'} on ${input.shift_date} (Expected Total: ₹${expectedTotalSales}, Repayments: ₹${creditRepaymentsTotal}, Variance: ₹${reconciliationVariance})`,
      });

      return newShift;
    } catch {
      // Fallback to local
    }
  }

  // Local fallback persistence
  localShifts.unshift(newShift);
  if (cashAmount > 0) {
    appendShiftCashToLedger(shiftId, cashAmount, employee?.name || 'Staff', userId);
  }

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
      total_revenue: expectedTotalSales,
      calculated_fuel_sales: calculatedFuelSales,
      fuel_litres: totalFuelLitres,
      nozzle_count: nozzleReadings.length,
      reconciliation_variance: reconciliationVariance,
      cash: cashAmount,
      digital: safeRound(upiAmount + cardAmount),
      credit: creditAmount,
      credit_repayments_total: creditRepaymentsTotal,
      credit_repayments_cash: creditRepaymentsCash,
      credit_repayments_digital: creditRepaymentsDigital,
      total_physical_cash: totalPhysicalCash,
    },
    reason: `Recorded shift for ${employee?.name || 'staff'} on ${input.shift_date} (Expected Total: ₹${expectedTotalSales}, Repayments: ₹${creditRepaymentsTotal}, Variance: ₹${reconciliationVariance})`,
  });

  return newShift;
}

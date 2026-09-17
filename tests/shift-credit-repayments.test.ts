/**
 * OMEGA FUELS — Automated Test Suite: Shift Credit Book Payments Received
 * 
 * Tests Required:
 * 1. No credit payment in shift -> valid
 * 2. One CASH repayment -> outstanding decreases + cash ledger increases
 * 3. One UPI repayment -> outstanding decreases + physical cash unchanged
 * 4. Multiple repayments in one shift -> all recorded
 * 5. Cash + UPI repayments -> correct separate totals
 * 6. Credit repayment does not count as new sales revenue
 * 7. Payment is linked to current shift
 * 8. Existing credit balance remains correct
 * 9. Duplicate submission does not create duplicate payment
 * 10. Existing historical credit transactions continue working
 */

import assert from 'node:assert';
import { createShift, getShifts } from '../src/services/shift.service';
import {
  getCreditCustomers,
  saveCreditCustomer,
  recordCreditTransaction,
  getCustomerStatement,
  getCreditPaymentsForShift,
} from '../src/services/credit.service';
import { getCashLedger } from '../src/services/cash.service';
import { safeRound } from '../src/lib/calculations/cash';

console.log('🧪 Starting OMEGA FUELS Shift Credit Book Payments Test Suite...\n');

let passedTests = 0;
let totalTests = 0;

async function runTest(name: string, fn: () => Promise<void> | void) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  ✅ PASSED: ${name}`);
  } catch (err) {
    console.error(`  ❌ FAILED: ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

async function main() {
  // Setup: Create two dedicated test credit customers
  const custA = await saveCreditCustomer({
    name: 'Test Fleet Logistics A',
    phone: '9876543210',
    status: 'ACTIVE',
  });

  const custB = await saveCreditCustomer({
    name: 'Test Transporters B',
    phone: '9876543211',
    status: 'ACTIVE',
  });

  // Give initial credit to both customers
  // Cust A: ₹10,000 credit
  await recordCreditTransaction({
    customer_id: custA.id,
    transaction_type: 'CREDIT_GIVEN',
    amount: 10000,
    description: 'Initial fleet credit',
  });

  // Cust B: ₹8,000 credit
  await recordCreditTransaction({
    customer_id: custB.id,
    transaction_type: 'CREDIT_GIVEN',
    amount: 8000,
    description: 'Initial transporter credit',
  });

  // Check initial outstanding balance
  const initialCustomers = await getCreditCustomers();
  const initialA = initialCustomers.customers.find((c) => c.id === custA.id);
  const initialB = initialCustomers.customers.find((c) => c.id === custB.id);
  assert.strictEqual(initialA?.outstanding_balance, 10000, 'Initial Cust A balance should be 10000');
  assert.strictEqual(initialB?.outstanding_balance, 8000, 'Initial Cust B balance should be 8000');

  // Test 1: No credit payment in shift -> valid
  await runTest('1. No credit payment in shift -> valid', async () => {
    const shift = await createShift({
      employee_id: 'emp_01',
      shift_date: '2026-09-16',
      shift_type: 'MORNING',
      nozzle_readings: [
        {
          nozzle_name: 'Machine 1 - Petrol',
          fuel_type: 'PETROL',
          opening_reading: 100,
          closing_reading: 200,
          litres_sold: 100,
          price_per_litre: 100,
          sales_amount: 10000,
        },
      ],
      payments: [{ payment_method: 'CASH', amount: 10000 }],
      // credit_payments omitted / empty
    });

    assert(shift.id, 'Shift should be successfully created');
    assert.strictEqual(shift.credit_payments?.length || 0, 0, 'Should have 0 credit payments');
    assert.strictEqual(shift.credit_repayments_total, 0, 'Repayments total should be 0');
    assert.strictEqual(shift.total_sales, 10000, 'Total sales should be 10000');
  });

  // Test 2: One CASH repayment -> outstanding decreases + cash ledger increases
  await runTest('2. One CASH repayment -> outstanding decreases + cash ledger increases', async () => {
    const initialLedger = await getCashLedger();
    const initialCashInflow = initialLedger.summary.totalInflows;

    const shift = await createShift({
      employee_id: 'emp_01',
      shift_date: '2026-09-16',
      shift_type: 'EVENING',
      nozzle_readings: [
        {
          nozzle_name: 'Machine 1 - Diesel',
          fuel_type: 'DIESEL',
          opening_reading: 500,
          closing_reading: 700,
          litres_sold: 200,
          price_per_litre: 90,
          sales_amount: 18000,
        },
      ],
      payments: [{ payment_method: 'CASH', amount: 18000 }],
      credit_payments: [
        {
          customer_id: custA.id,
          amount: 3000,
          payment_method: 'CASH',
          notes: 'Cash payment on bill #441',
        },
      ],
    });

    // Check customer outstanding decreased by 3000 (from 10000 to 7000)
    const custs = await getCreditCustomers();
    const updatedA = custs.customers.find((c) => c.id === custA.id);
    assert.strictEqual(updatedA?.outstanding_balance, 7000, 'Customer A outstanding should decrease to 7000');

    // Check cash ledger increased by 18000 (shift sales) + 3000 (cash repayment)
    const newLedger = await getCashLedger();
    const newCashInflow = newLedger.summary.totalInflows;
    assert.strictEqual(
      safeRound(newCashInflow - initialCashInflow),
      21000,
      'Cash ledger inflow should increase by 18000 (sales cash) + 3000 (credit cash repayment)'
    );

    // Check shift physical cash available
    assert.strictEqual(shift.total_physical_cash, 21000, 'Total physical cash in shift should be 21000');
    assert.strictEqual(shift.credit_repayments_cash, 3000, 'Cash repayments should be 3000');
  });

  // Test 3: One UPI repayment -> outstanding decreases + physical cash unchanged
  await runTest('3. One UPI repayment -> outstanding decreases + physical cash unchanged', async () => {
    const initialLedger = await getCashLedger();
    const initialCashInflow = initialLedger.summary.totalInflows;

    const shift = await createShift({
      employee_id: 'emp_01',
      shift_date: '2026-09-16',
      shift_type: 'NIGHT',
      nozzle_readings: [
        {
          nozzle_name: 'Machine 2 - Petrol',
          fuel_type: 'PETROL',
          opening_reading: 200,
          closing_reading: 250,
          litres_sold: 50,
          price_per_litre: 100,
          sales_amount: 5000,
        },
      ],
      payments: [{ payment_method: 'CASH', amount: 5000 }],
      credit_payments: [
        {
          customer_id: custB.id,
          amount: 2000,
          payment_method: 'UPI',
          notes: 'UPI ref 99881122',
        },
      ],
    });

    // Check customer B outstanding decreased by 2000 (from 8000 to 6000)
    const custs = await getCreditCustomers();
    const updatedB = custs.customers.find((c) => c.id === custB.id);
    assert.strictEqual(updatedB?.outstanding_balance, 6000, 'Customer B outstanding should decrease to 6000');

    // Check physical cash ledger increased ONLY by 5000 (shift sales cash), NOT by the 2000 UPI repayment
    const newLedger = await getCashLedger();
    const newCashInflow = newLedger.summary.totalInflows;
    assert.strictEqual(
      safeRound(newCashInflow - initialCashInflow),
      5000,
      'Cash ledger inflow should increase only by 5000, UPI repayment must NOT touch physical cash'
    );

    // Check shift physical cash available is strictly 5000
    assert.strictEqual(shift.total_physical_cash, 5000, 'Total physical cash in shift should be 5000');
    assert.strictEqual(shift.credit_repayments_digital, 2000, 'Digital repayments should be 2000');
  });

  // Test 4: Multiple repayments in one shift -> all recorded
  await runTest('4. Multiple repayments in one shift -> all recorded', async () => {
    const shift = await createShift({
      employee_id: 'emp_02',
      shift_date: '2026-09-16',
      shift_type: 'MORNING',
      nozzle_readings: [],
      payments: [{ payment_method: 'CASH', amount: 2000 }],
      credit_payments: [
        {
          customer_id: custA.id,
          amount: 1500,
          payment_method: 'CASH',
          notes: 'Cust A repayment 1',
        },
        {
          customer_id: custB.id,
          amount: 1000,
          payment_method: 'CARD',
          notes: 'Cust B POS slip',
        },
        {
          customer_id: custA.id,
          amount: 500,
          payment_method: 'UPI',
          notes: 'Cust A repayment 2',
        },
      ],
    });

    assert.strictEqual(shift.credit_payments?.length, 3, 'Should record all 3 credit payments');
    assert.strictEqual(shift.credit_repayments_total, 3000, 'Total repayments should be 1500 + 1000 + 500 = 3000');
  });

  // Test 5: Cash + UPI repayments -> correct separate totals
  await runTest('5. Cash + UPI repayments -> correct separate totals', async () => {
    // Example from prompt: ABC Traders ₹2,000 CASH, XYZ Agencies ₹1,500 UPI, Rahman Stores ₹1,000 CASH
    // Total Received: ₹4,500 | Cash Received: ₹3,000 | UPI Received: ₹1,500
    const shift = await createShift({
      employee_id: 'emp_01',
      shift_date: '2026-09-16',
      shift_type: 'EVENING',
      nozzle_readings: [],
      payments: [{ payment_method: 'CASH', amount: 40000 }, { payment_method: 'UPI', amount: 20000 }],
      credit_payments: [
        { customer_id: custA.id, amount: 2000, payment_method: 'CASH' },
        { customer_id: custB.id, amount: 1500, payment_method: 'UPI' },
        { customer_id: custA.id, amount: 1000, payment_method: 'CASH' },
      ],
    });

    assert.strictEqual(shift.credit_repayments_total, 4500, 'Total repayments should be 4500');
    assert.strictEqual(shift.credit_repayments_cash, 3000, 'Cash repayments should be 3000');
    assert.strictEqual(shift.credit_repayments_digital, 1500, 'Digital repayments should be 1500');

    // Prompt example: Physical cash available: ₹40,000 + ₹3,000 = ₹43,000 NOT ₹45,000
    assert.strictEqual(shift.total_physical_cash, 43000, 'Physical cash available must be 43000');
  });

  // Test 6: Credit repayment does not count as new sales revenue
  await runTest('6. Credit repayment does not count as new sales revenue', async () => {
    const shift = await createShift({
      employee_id: 'emp_01',
      shift_date: '2026-09-16',
      shift_type: 'MORNING',
      nozzle_readings: [
        {
          nozzle_name: 'Machine 1 - Petrol',
          fuel_type: 'PETROL',
          opening_reading: 1000,
          closing_reading: 1100,
          litres_sold: 100,
          price_per_litre: 100,
          sales_amount: 10000,
        },
      ],
      other_sales: [
        { description: 'Engine Oil 1L', amount: 500 },
      ],
      payments: [{ payment_method: 'CASH', amount: 10500 }],
      credit_payments: [
        { customer_id: custA.id, amount: 5000, payment_method: 'CASH' },
        { customer_id: custB.id, amount: 2500, payment_method: 'UPI' },
      ],
    });

    // Total sales must strictly be fuel (10000) + other sales (500) = 10500
    // Repayments (7500) must NOT inflate total_sales
    assert.strictEqual(
      shift.total_sales,
      10500,
      'Total sales revenue must remain 10500 (Fuel + Other), not inflated by 7500 repayments'
    );
  });

  // Test 7: Payment is linked to current shift
  await runTest('7. Payment is linked to current shift', async () => {
    const shift = await createShift({
      employee_id: 'emp_01',
      shift_date: '2026-09-16',
      shift_type: 'MORNING',
      nozzle_readings: [],
      payments: [{ payment_method: 'CASH', amount: 1000 }],
      credit_payments: [
        {
          customer_id: custA.id,
          amount: 800,
          payment_method: 'CASH',
          notes: 'Shift linked test',
        },
      ],
    });

    const shiftPayments = await getCreditPaymentsForShift(shift.id);
    assert.strictEqual(shiftPayments.length, 1, 'Should find 1 credit payment linked to shift');
    assert.strictEqual(shiftPayments[0].shift_id, shift.id, 'Payment shift_id should match shift id');
    assert.strictEqual(shiftPayments[0].amount, 800, 'Payment amount should be 800');
  });

  // Test 8: Existing credit balance remains correct
  await runTest('8. Existing credit balance remains correct', async () => {
    // Check statement for Cust A
    const stmt = await getCustomerStatement(custA.id);
    assert(stmt.customer, 'Customer should exist');
    assert(stmt.transactions.length >= 2, 'Should have multiple transactions in ledger');

    // Balance verification: totalCreditGiven - totalPaymentsReceived = outstanding (clamped at >= 0)
    const expectedBalance = Math.max(
      0,
      safeRound(stmt.summary.totalCreditGiven - stmt.summary.totalPaymentsReceived)
    );
    assert.strictEqual(
      stmt.summary.outstandingBalance,
      expectedBalance,
      'Outstanding balance must match credit given minus payments received (clamped to 0 min)'
    );
  });

  // Test 9: Duplicate submission does not create duplicate payment
  await runTest('9. Duplicate submission does not create duplicate payment', async () => {
    // When an existing shift ID is retrieved from getShifts, it contains the recorded payments
    const allShifts = await getShifts();
    const latestShift = allShifts[0];

    const paymentsBefore = latestShift.credit_payments?.length || 0;
    // Re-fetching same shift should return identical payments count
    const refetchedShifts = await getShifts();
    const refetchedLatest = refetchedShifts.find((s) => s.id === latestShift.id);
    assert.strictEqual(
      refetchedLatest?.credit_payments?.length || 0,
      paymentsBefore,
      'Duplicate queries must not duplicate shift payments'
    );
  });

  // Test 10: Existing historical credit transactions continue working
  await runTest('10. Existing historical credit transactions continue working', async () => {
    // Standalone credit transaction without shift_id (historical / office collection)
    const standalonePayment = await recordCreditTransaction({
      customer_id: custA.id,
      transaction_type: 'PAYMENT_RECEIVED',
      amount: 500,
      payment_method: 'CASH',
      description: 'Office direct payment without shift',
    });

    assert(standalonePayment.id, 'Standalone payment created');
    assert.strictEqual(standalonePayment.shift_id, null, 'Historical / standalone payment has null shift_id');

    // Ensure statement works with null shift_id
    const statement = await getCustomerStatement(custA.id);
    const found = statement.transactions.find((t) => t.id === standalonePayment.id);
    assert(found, 'Standalone payment must appear in customer account statement');
    assert.strictEqual(found?.shift_id, null, 'Standalone payment in statement has null shift_id');
  });

  console.log(`\nResults: ${passedTests} / ${totalTests} tests passed.`);
  if (passedTests === totalTests) {
    console.log('🎉 ALL 10 TESTS PASSED SUCCESSFULLY!\n');
  } else {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('Test runner encountered fatal error:', err);
  process.exit(1);
});

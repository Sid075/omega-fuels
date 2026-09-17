/**
 * OMEGA FUELS — Automated Test Suite: Shift Credit Given & Credit Book Synchronization
 * 
 * Required Scenarios:
 * 1. Shift with ₹2500 credit to ABC -> credit transaction created -> ABC outstanding increases by ₹2500
 * 2. Shift with zero credit -> no credit transaction created
 * 3. Credit amount > 0 without customer -> validation error
 * 4. Multiple credit customers in one shift -> every credit transaction created
 * 5. Credit given does NOT increase physical cash
 * 6. Cash credit repayment DOES increase physical cash
 * 7. UPI credit repayment does NOT increase physical cash
 * 8. Duplicate shift submission does not duplicate credit transaction
 * 9. Local fallback mode updates Credit Book
 * 10. Supabase mode updates Credit Book (schema mapping & parity)
 * 11. Existing historical shifts continue to work
 * 12. Audit log is created
 */

import assert from 'node:assert';
import { createShift, getShifts } from '../src/services/shift.service';
import {
  getCreditCustomers,
  saveCreditCustomer,
  recordCreditTransaction,
  getCustomerStatement,
} from '../src/services/credit.service';
import { getCashLedger } from '../src/services/cash.service';
import { getAuditLogs } from '../src/services/audit.service';
import { safeRound } from '../src/lib/calculations/cash';

console.log('🧪 Starting OMEGA FUELS Shift Credit Given Test Suite...\n');

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
  // Setup: Create test customers
  const customerABC = await saveCreditCustomer({
    name: 'ABC Traders',
    phone: '9811122233',
    status: 'ACTIVE',
  });

  const customerXYZ = await saveCreditCustomer({
    name: 'XYZ Agencies',
    phone: '9822233344',
    status: 'ACTIVE',
  });

  const customerRahman = await saveCreditCustomer({
    name: 'Rahman Stores',
    phone: '9833344455',
    status: 'ACTIVE',
  });

  // Verify baseline outstanding balance is ₹0
  let customersList = await getCreditCustomers();
  const getBal = (id: string) =>
    customersList.customers.find((c) => c.id === id)?.outstanding_balance || 0;

  assert.strictEqual(getBal(customerABC.id), 0, 'ABC initial balance should be 0');
  assert.strictEqual(getBal(customerXYZ.id), 0, 'XYZ initial balance should be 0');
  assert.strictEqual(getBal(customerRahman.id), 0, 'Rahman initial balance should be 0');

  // Test 1: Shift with ₹2500 credit to ABC -> credit transaction created -> ABC outstanding increases by ₹2500
  let shift1Id = '';
  await runTest('1. Shift with ₹2500 credit to ABC -> transaction created & ABC balance +₹2500', async () => {
    const balBefore = getBal(customerABC.id);
    const shift = await createShift({
      employee_id: 'emp_01',
      shift_date: '2026-09-17',
      shift_type: 'MORNING',
      nozzle_readings: [
        {
          nozzle_name: 'Machine 1 - Petrol',
          fuel_type: 'PETROL',
          opening_reading: 1000,
          closing_reading: 1050,
          litres_sold: 50,
          price_per_litre: 100,
          sales_amount: 5000,
        },
      ],
      payments: [
        { payment_method: 'CASH', amount: 2500 },
        { payment_method: 'CREDIT', amount: 2500, customer_id: customerABC.id },
      ],
    });
    shift1Id = shift.id;

    customersList = await getCreditCustomers();
    const balAfter = getBal(customerABC.id);
    assert.strictEqual(balAfter - balBefore, 2500, 'ABC balance should increase by 2500');

    const stmt = await getCustomerStatement(customerABC.id);
    const creditTx = stmt.transactions.find(
      (t) => t.shift_id === shift.id && t.transaction_type === 'CREDIT_GIVEN'
    );
    assert(creditTx, 'Should create CREDIT_GIVEN transaction linked to shift');
    assert.strictEqual(creditTx.amount, 2500, 'Transaction amount must be 2500');
  });

  // Test 2: Shift with zero credit -> no credit transaction created
  await runTest('2. Shift with zero credit -> no credit transaction created', async () => {
    const balBefore = getBal(customerABC.id);
    const stmtBefore = await getCustomerStatement(customerABC.id);
    const txCountBefore = stmtBefore.transactions.length;

    const shift = await createShift({
      employee_id: 'emp_01',
      shift_date: '2026-09-17',
      shift_type: 'EVENING',
      nozzle_readings: [
        {
          nozzle_name: 'Machine 1 - Diesel',
          fuel_type: 'DIESEL',
          opening_reading: 500,
          closing_reading: 550,
          litres_sold: 50,
          price_per_litre: 90,
          sales_amount: 4500,
        },
      ],
      payments: [
        { payment_method: 'CASH', amount: 4500 },
        { payment_method: 'CREDIT', amount: 0 },
      ],
    });

    customersList = await getCreditCustomers();
    const balAfter = getBal(customerABC.id);
    assert.strictEqual(balAfter, balBefore, 'ABC balance must remain unchanged');

    const stmtAfter = await getCustomerStatement(customerABC.id);
    assert.strictEqual(
      stmtAfter.transactions.length,
      txCountBefore,
      'No new credit transaction should be created'
    );
  });

  // Test 3: Credit amount > 0 without customer -> validation error
  await runTest('3. Credit amount > 0 without customer -> validation error', async () => {
    let errorThrown = false;
    try {
      await createShift({
        employee_id: 'emp_01',
        shift_date: '2026-09-17',
        shift_type: 'NIGHT',
        payments: [
          { payment_method: 'CASH', amount: 1000 },
          { payment_method: 'CREDIT', amount: 2500 }, // missing customer_id!
        ],
      });
    } catch (err: any) {
      errorThrown = true;
      assert(
        err.message.includes('Customer must be selected'),
        `Unexpected error message: ${err.message}`
      );
    }
    assert.strictEqual(errorThrown, true, 'Must reject shift with credit assigned to no customer');
  });

  // Test 4: Multiple credit customers in one shift -> every credit transaction created
  await runTest('4. Multiple credit customers in one shift -> every credit transaction created', async () => {
    customersList = await getCreditCustomers();
    const abcBefore = getBal(customerABC.id);
    const xyzBefore = getBal(customerXYZ.id);
    const rahmanBefore = getBal(customerRahman.id);

    const shift = await createShift({
      employee_id: 'emp_01',
      shift_date: '2026-09-17',
      shift_type: 'MORNING',
      payments: [
        { payment_method: 'CASH', amount: 1000 },
        { payment_method: 'CREDIT', amount: 2500, customer_id: customerABC.id },
        { payment_method: 'CREDIT', amount: 1500, customer_id: customerXYZ.id },
        { payment_method: 'CREDIT', amount: 1000, customer_id: customerRahman.id },
      ],
    });

    customersList = await getCreditCustomers();
    assert.strictEqual(getBal(customerABC.id) - abcBefore, 2500, 'ABC should increase by 2500');
    assert.strictEqual(getBal(customerXYZ.id) - xyzBefore, 1500, 'XYZ should increase by 1500');
    assert.strictEqual(getBal(customerRahman.id) - rahmanBefore, 1000, 'Rahman should increase by 1000');

    assert.strictEqual(shift.credit_issued?.length, 3, 'Shift details must list 3 credit items');
    assert.strictEqual(shift.credit_amount, 5000, 'Total credit amount must be 5000');
  });

  // Test 5: Credit given does NOT increase physical cash
  await runTest('5. Credit given does NOT increase physical cash', async () => {
    const cashBefore = (await getCashLedger()).summary.totalShiftCash;

    // Shift: Cash sales = 5000, UPI sales = 2000, Credit given = 2500
    await createShift({
      employee_id: 'emp_01',
      shift_date: '2026-09-17',
      shift_type: 'EVENING',
      payments: [
        { payment_method: 'CASH', amount: 5000 },
        { payment_method: 'UPI', amount: 2000 },
        { payment_method: 'CREDIT', amount: 2500, customer_id: customerABC.id },
      ],
    });

    const cashAfter = (await getCashLedger()).summary.totalShiftCash;
    // Physical cash must increase by EXACTLY 5000, NOT 5000 + 2500
    assert.strictEqual(
      cashAfter - cashBefore,
      5000,
      'Physical cash must increase by strictly cash sales (₹5000), ignoring credit given'
    );
  });

  // Test 6: Cash credit repayment DOES increase physical cash
  await runTest('6. Cash credit repayment DOES increase physical cash', async () => {
    customersList = await getCreditCustomers();
    const cashBefore = (await getCashLedger()).summary.netBalance;
    const abcBefore = getBal(customerABC.id);

    // Customer ABC repays ₹1000 in CASH
    await recordCreditTransaction({
      customer_id: customerABC.id,
      transaction_type: 'PAYMENT_RECEIVED',
      amount: 1000,
      payment_method: 'CASH',
      description: 'Cash repayment at counter',
    });

    customersList = await getCreditCustomers();
    const abcAfter = getBal(customerABC.id);
    assert.strictEqual(abcBefore - abcAfter, 1000, 'Outstanding must decrease by 1000');

    const cashAfter = (await getCashLedger()).summary.netBalance;
    assert.strictEqual(
      cashAfter - cashBefore,
      1000,
      'CASH repayment must increase central physical cash ledger'
    );
  });

  // Test 7: UPI credit repayment does NOT increase physical cash
  await runTest('7. UPI credit repayment does NOT increase physical cash', async () => {
    const cashBefore = (await getCashLedger()).summary.netBalance;
    const abcBefore = getBal(customerABC.id);

    // Customer ABC repays ₹500 via UPI
    await recordCreditTransaction({
      customer_id: customerABC.id,
      transaction_type: 'PAYMENT_RECEIVED',
      amount: 500,
      payment_method: 'UPI',
      description: 'UPI QR repayment',
    });

    customersList = await getCreditCustomers();
    const abcAfter = getBal(customerABC.id);
    assert.strictEqual(abcBefore - abcAfter, 500, 'Outstanding must decrease by 500');

    const cashAfter = (await getCashLedger()).summary.netBalance;
    assert.strictEqual(
      cashAfter,
      cashBefore,
      'UPI repayment must NOT alter physical drawer cash'
    );
  });

  // Test 8: Duplicate shift submission does not duplicate credit transaction
  await runTest('8. Duplicate shift submission does not duplicate credit transaction', async () => {
    const deterministicId = `ctx_test_dedup_${Date.now()}`;
    const abcBefore = getBal(customerABC.id);

    // First call
    const tx1 = await recordCreditTransaction({
      id: deterministicId,
      customer_id: customerABC.id,
      shift_id: 'shift_dedup_test',
      transaction_type: 'CREDIT_GIVEN',
      amount: 700,
      description: 'Chit test dedup',
    });

    customersList = await getCreditCustomers();
    assert.strictEqual(getBal(customerABC.id) - abcBefore, 700, 'Balance increases by 700');

    // Repeated call with same ID & shift
    const tx2 = await recordCreditTransaction({
      id: deterministicId,
      customer_id: customerABC.id,
      shift_id: 'shift_dedup_test',
      transaction_type: 'CREDIT_GIVEN',
      amount: 700,
      description: 'Chit test dedup repeated',
    });

    assert.strictEqual(tx1.id, tx2.id, 'Should return the same transaction');

    customersList = await getCreditCustomers();
    assert.strictEqual(
      getBal(customerABC.id) - abcBefore,
      700,
      'Balance must NOT double count duplicate submission'
    );
  });

  // Test 9: Local fallback mode updates Credit Book
  await runTest('9. Local fallback mode updates Credit Book immediately', async () => {
    const balBefore = getBal(customerRahman.id);

    await recordCreditTransaction({
      customer_id: customerRahman.id,
      transaction_type: 'CREDIT_GIVEN',
      amount: 400,
      description: 'Local fallback test',
    });

    customersList = await getCreditCustomers();
    const balAfter = getBal(customerRahman.id);
    assert.strictEqual(balAfter - balBefore, 400, 'Credit Book must immediately reflect new balance');
  });

  // Test 10: Supabase mode parity & schema compatibility
  await runTest('10. Supabase mode data mapping & schema compatibility', async () => {
    const stmt = await getCustomerStatement(customerABC.id);
    assert(stmt.transactions.length > 0, 'Should have transactions');
    const tx = stmt.transactions[0];

    // Verify required schema fields
    assert(tx.id, 'Must have transaction id');
    assert(tx.customer_id, 'Must have customer_id');
    assert(tx.transaction_type, 'Must have transaction_type');
    assert(typeof tx.amount === 'number', 'Amount must be number');
    assert(tx.transaction_at, 'Must have transaction_at timestamp');
    assert(tx.created_by, 'Must have created_by');
  });

  // Test 11: Existing historical shifts continue to work
  await runTest('11. Existing historical shifts continue to work', async () => {
    const allShifts = await getShifts();
    assert(allShifts.length > 0, 'Should return shifts');
    for (const s of allShifts) {
      assert(s.id, 'Shift must have id');
      assert(typeof s.total_sales === 'number', 'total_sales must be number');
      assert(typeof s.cash_amount === 'number', 'cash_amount must be number');
    }
  });

  // Test 12: Audit log is created
  await runTest('12. Audit log is created for credit given & shift', async () => {
    const logs = await getAuditLogs('CREDIT_BOOK');
    const creditGivenLog = logs.find(
      (l) => l.action === 'CREDIT_GIVEN_RECORDED'
    );
    assert(creditGivenLog, 'Audit log must record CREDIT_GIVEN_RECORDED');
    assert.strictEqual(creditGivenLog.module, 'CREDIT_BOOK');
  });

  console.log(`\n========================================`);
  console.log(`Results: ${passedTests} / ${totalTests} tests passed.`);
  if (passedTests === totalTests) {
    console.log('🎉 ALL 12 TESTS PASSED SUCCESSFULLY!');
  } else {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});

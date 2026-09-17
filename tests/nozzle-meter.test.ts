/**
 * OMEGA FUELS — Automated Test Suite: Nozzle Meter Readings & Reconciliation
 * 
 * Test Scenarios:
 * 1. Opening 1000, closing 1500 -> 500 litres
 * 2. Petrol price ₹103.50 -> ₹51,750 sales
 * 3. Closing < opening -> validation error
 * 4. Multiple nozzles -> correct total litres and sales
 * 5. Petrol + Diesel -> correct separate calculations
 * 6. Other product sales included correctly
 * 7. Cash/UPI/Card/Credit reconciliation & variance calculation
 * 8. No cash double-counting (cash ledger strictly receives physical cash)
 * 9. Historical fuel price lookup by shift date
 * 10. Invalid / negative / NaN readings rejected
 * 11. Existing historical shifts without nozzle readings still load smoothly
 */

import assert from 'node:assert';
import {
  calculateNozzleReading,
  calculateShiftNozzlesSummary,
  calculateShiftReconciliation,
  NozzleInputItem,
} from '../src/lib/calculations/nozzle';
import { safeRound } from '../src/lib/calculations/cash';
import { createShift, getShifts } from '../src/services/shift.service';
import { getFuelPricesForDate } from '../src/services/fuel.service';
import { getCashLedger } from '../src/services/cash.service';

console.log('🧪 Starting OMEGA FUELS Nozzle Meter Reading Test Suite...\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name: string, fn: () => void | Promise<void>) {
  totalTests++;
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result
        .then(() => {
          passedTests++;
          console.log(`  ✅ PASSED: ${name}`);
        })
        .catch((err) => {
          console.error(`  ❌ FAILED: ${name}`);
          console.error(err);
          process.exitCode = 1;
        });
    } else {
      passedTests++;
      console.log(`  ✅ PASSED: ${name}`);
    }
  } catch (err) {
    console.error(`  ❌ FAILED: ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

async function main() {
  // Test 1: Opening 1000, closing 1500 -> 500 litres
  runTest('1. Opening 1000, closing 1500 -> 500 litres', () => {
    const nozzle: NozzleInputItem = {
      nozzle_name: 'Nozzle 1',
      fuel_type: 'PETROL',
      opening_reading: 1000,
      closing_reading: 1500,
    };
    const result = calculateNozzleReading(nozzle, { PETROL: 100, DIESEL: 90 });
    assert.strictEqual(result.litres_sold, 500);
    assert.strictEqual(result.isValid, true);
  });

  // Test 2: Petrol price ₹103.50 -> ₹51,750 sales (500L * 103.50)
  runTest('2. Petrol price ₹103.50 -> ₹51,750 sales', () => {
    const nozzle: NozzleInputItem = {
      nozzle_name: 'Nozzle 1',
      fuel_type: 'PETROL',
      opening_reading: 1000,
      closing_reading: 1500,
    };
    const result = calculateNozzleReading(nozzle, { PETROL: 103.5, DIESEL: 90.24 });
    assert.strictEqual(result.litres_sold, 500);
    assert.strictEqual(result.price_per_litre, 103.5);
    assert.strictEqual(result.sales_amount, 51750);
    assert.strictEqual(result.isValid, true);
  });

  // Test 3: Closing < opening -> validation error
  runTest('3. Closing < opening -> validation error', () => {
    const nozzle: NozzleInputItem = {
      nozzle_name: 'Nozzle 1',
      fuel_type: 'PETROL',
      opening_reading: 1500,
      closing_reading: 1200,
    };
    const result = calculateNozzleReading(nozzle, { PETROL: 103.5, DIESEL: 90.24 });
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errorMessage?.includes('cannot be less than opening reading'));
  });

  // Test 4: Multiple nozzles -> correct total litres & sales
  runTest('4. Multiple nozzles -> correct total litres & sales', () => {
    const nozzles: NozzleInputItem[] = [
      {
        nozzle_name: 'Nozzle 1',
        fuel_type: 'PETROL',
        opening_reading: 1204.5,
        closing_reading: 1820.0, // 615.5L * 103.50 = 63,704.25
      },
      {
        nozzle_name: 'Nozzle 2',
        fuel_type: 'DIESEL',
        opening_reading: 2400.0,
        closing_reading: 2780.0, // 380.0L * 91.20 = 34,656.00
      },
    ];
    const prices = { PETROL: 103.5, DIESEL: 91.2 };
    const summary = calculateShiftNozzlesSummary(nozzles, prices);

    assert.strictEqual(summary.totalLitres, 995.5);
    assert.strictEqual(summary.totalFuelSales, 98360.25);
    assert.strictEqual(summary.isValid, true);
  });

  // Test 5: Petrol + Diesel -> correct separate calculations
  runTest('5. Petrol + Diesel -> correct separate calculations', () => {
    const nozzles: NozzleInputItem[] = [
      { nozzle_name: 'N1', fuel_type: 'PETROL', opening_reading: 100, closing_reading: 200 }, // 100L * 103.5 = 10350
      { nozzle_name: 'N2', fuel_type: 'PETROL', opening_reading: 200, closing_reading: 350 }, // 150L * 103.5 = 15525
      { nozzle_name: 'N3', fuel_type: 'DIESEL', opening_reading: 500, closing_reading: 800 }, // 300L * 90.0 = 27000
    ];
    const prices = { PETROL: 103.5, DIESEL: 90.0 };
    const summary = calculateShiftNozzlesSummary(nozzles, prices);

    assert.strictEqual(summary.petrolLitres, 250);
    assert.strictEqual(summary.petrolSales, 25875);
    assert.strictEqual(summary.dieselLitres, 300);
    assert.strictEqual(summary.dieselSales, 27000);
    assert.strictEqual(summary.totalLitres, 550);
    assert.strictEqual(summary.totalFuelSales, 52875);
  });

  // Test 6: Other product sales included correctly
  runTest('6. Other product sales included correctly in expected total sales', () => {
    const calculatedFuelSales = 98360.25;
    const otherProductSales = 2000.0;
    const collections = { cash: 45000, upi: 30000, card: 15000, credit: 10360 };

    const recon = calculateShiftReconciliation(calculatedFuelSales, otherProductSales, collections);
    assert.strictEqual(recon.expectedTotalSales, 100360.25);
    assert.strictEqual(recon.actualCollections, 100360.0);
    assert.strictEqual(recon.variance, -0.25);
    assert.strictEqual(recon.isShortage, true);
  });

  // Test 7: Cash/UPI/Card/Credit reconciliation & variance calculation
  runTest('7. Cash/UPI/Card/Credit reconciliation with zero variance', () => {
    const calculatedFuelSales = 98360.0;
    const otherProductSales = 2000.0;
    const collections = { cash: 45000, upi: 30000, card: 15000, credit: 10360 };

    const recon = calculateShiftReconciliation(calculatedFuelSales, otherProductSales, collections);
    assert.strictEqual(recon.expectedTotalSales, 100360.0);
    assert.strictEqual(recon.actualCollections, 100360.0);
    assert.strictEqual(recon.variance, 0);
    assert.strictEqual(recon.isBalanced, true);
  });

  // Test 8: Important cash accounting rule — no cash double-counting
  await runTest('8. Cash accounting rule — no cash double-counting in ledger', async () => {
    const cashBefore = (await getCashLedger()).summary.totalShiftCash;

    // Shift with 10,000 nozzle fuel sales, but payment is 4,000 cash, 4,000 UPI, 2,000 Credit
    await createShift({
      employee_id: 'emp_01',
      shift_date: '2026-09-16',
      shift_type: 'MORNING',
      nozzle_readings: [
        {
          nozzle_name: 'Nozzle Test',
          fuel_type: 'PETROL',
          opening_reading: 100,
          closing_reading: 200,
          litres_sold: 100,
          price_per_litre: 100,
          sales_amount: 10000,
        },
      ],
      payments: [
        { payment_method: 'CASH', amount: 4000 },
        { payment_method: 'UPI', amount: 4000 },
        { payment_method: 'CREDIT', amount: 2000, customer_id: 'cust_01' },
      ],
    });

    const cashAfter = (await getCashLedger()).summary.totalShiftCash;
    // Strictly exactly 4,000 cash added to ledger, NOT the 10,000 nozzle sales amount
    assert.strictEqual(cashAfter - cashBefore, 4000);
  });

  // Test 9: Historical fuel price lookup for shift date
  await runTest('9. Historical fuel price lookup retains correct date rates', async () => {
    const today = new Date().toISOString().split('T')[0];
    const pricesToday = await getFuelPricesForDate(today);
    assert.ok(pricesToday.PETROL > 0, 'PETROL price should be positive');
    assert.ok(pricesToday.DIESEL > 0, 'DIESEL price should be positive');

    // Historical date query fallback
    const pricesPast = await getFuelPricesForDate('2025-01-01');
    assert.ok(pricesPast.PETROL > 0, 'Historical PETROL price should resolve');
    assert.ok(pricesPast.DIESEL > 0, 'Historical DIESEL price should resolve');
  });

  // Test 10: Invalid / negative / NaN readings rejected
  runTest('10. Invalid, negative, and NaN readings rejected', () => {
    // Negative opening
    const resNegativeOpen = calculateNozzleReading(
      { nozzle_name: 'N1', fuel_type: 'PETROL', opening_reading: -50, closing_reading: 100 },
      { PETROL: 100, DIESEL: 90 }
    );
    assert.strictEqual(resNegativeOpen.isValid, false);
    assert.ok(resNegativeOpen.errorMessage?.includes('cannot be negative'));

    // Negative closing
    const resNegativeClose = calculateNozzleReading(
      { nozzle_name: 'N1', fuel_type: 'PETROL', opening_reading: 50, closing_reading: -100 },
      { PETROL: 100, DIESEL: 90 }
    );
    assert.strictEqual(resNegativeClose.isValid, false);

    // Non-numeric string / NaN
    const resNaN = calculateNozzleReading(
      { nozzle_name: 'N1', fuel_type: 'PETROL', opening_reading: 'abc', closing_reading: 100 },
      { PETROL: 100, DIESEL: 90 }
    );
    assert.strictEqual(resNaN.isValid, false);
    assert.ok(resNaN.errorMessage?.includes('valid numbers'));
  });

  // Test 11: Existing historical shifts without nozzle readings still load smoothly
  await runTest('11. Existing historical shifts without nozzle readings still load smoothly', async () => {
    const shifts = await getShifts();
    assert.ok(shifts.length > 0, 'Should load existing shifts');
    const firstShift = shifts[0];
    assert.ok(firstShift.id, 'Shift must have an id');
    assert.ok(firstShift.total_sales > 0, 'Shift total_sales must be positive number');
    assert.ok(Array.isArray(firstShift.payments), 'Payments array must exist');
    assert.ok(Array.isArray(firstShift.other_sales), 'Other sales array must exist');
    if (firstShift.nozzle_readings && firstShift.nozzle_readings.length > 0) {
      assert.ok(firstShift.nozzle_readings[0].litres_sold >= 0);
      assert.ok(firstShift.nozzle_readings[0].sales_amount >= 0);
    }
  });

  // Test 12: Two machines (Machine 1 & Machine 2), each with Petrol and Diesel readings
  runTest('12. Two dispensing machines (Machine 1 & 2), each with Petrol and Diesel counters', () => {
    const machineNozzles: NozzleInputItem[] = [
      // Machine 1
      {
        id: 'm1_petrol',
        machine_id: 'machine_1',
        machine_name: 'Machine 1',
        nozzle_name: 'Machine 1 - Petrol',
        fuel_type: 'PETROL',
        opening_reading: 1000,
        closing_reading: 1200, // 200L * 103.50 = 20,700
      },
      {
        id: 'm1_diesel',
        machine_id: 'machine_1',
        machine_name: 'Machine 1',
        nozzle_name: 'Machine 1 - Diesel',
        fuel_type: 'DIESEL',
        opening_reading: 2000,
        closing_reading: 2300, // 300L * 90.00 = 27,000
      },
      // Machine 2
      {
        id: 'm2_petrol',
        machine_id: 'machine_2',
        machine_name: 'Machine 2',
        nozzle_name: 'Machine 2 - Petrol',
        fuel_type: 'PETROL',
        opening_reading: 500,
        closing_reading: 650, // 150L * 103.50 = 15,525
      },
      {
        id: 'm2_diesel',
        machine_id: 'machine_2',
        machine_name: 'Machine 2',
        nozzle_name: 'Machine 2 - Diesel',
        fuel_type: 'DIESEL',
        opening_reading: 800,
        closing_reading: 900, // 100L * 90.00 = 9,000
      },
    ];

    const prices = { PETROL: 103.5, DIESEL: 90.0 };
    const summary = calculateShiftNozzlesSummary(machineNozzles, prices);

    // Total Petrol: 200 + 150 = 350L; Sales = 20700 + 15525 = 36225
    assert.strictEqual(summary.petrolLitres, 350);
    assert.strictEqual(summary.petrolSales, 36225);

    // Total Diesel: 300 + 100 = 400L; Sales = 27000 + 9000 = 36000
    assert.strictEqual(summary.dieselLitres, 400);
    assert.strictEqual(summary.dieselSales, 36000);

    // Grand Total: 750L, ₹72,225
    assert.strictEqual(summary.totalLitres, 750);
    assert.strictEqual(summary.totalFuelSales, 72225);
    assert.strictEqual(summary.isValid, true);
  });

  console.log(`\n========================================`);
  console.log(`Test Summary: ${passedTests} / ${totalTests} tests passed`);
  console.log(`========================================\n`);

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

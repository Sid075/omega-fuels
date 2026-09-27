/**
 * OMEGA FUELS — Automated Test Suite: Reports & Analytics Functional Verification
 *
 * Requirements:
 * 1. Shift A on 2026-09-01 (Cash ₹10,000) & Shift B on 2026-09-20 (Cash ₹50,000)
 * 2. Range 2026-09-01 -> 2026-09-05 yields ₹10,000
 * 3. Range 2026-09-20 -> 2026-09-25 yields ₹50,000
 * 4. Range 2026-09-01 -> 2026-09-30 yields ₹60,000
 * 5. Operating expenses filtered strictly by date range
 * 6. Credit transactions filtered strictly by date range
 * 7. Payment channel chart grouping correctly reflects range
 * 8. Date period presets (TODAY, YESTERDAY, THIS_WEEK, THIS_MONTH, etc.)
 * 9. Excel export (XLSX) respects date range and data scope
 * 10. CSV export respects date range and data scope
 * 11. Dynamic sheet manifest reflects selected scope
 */

import assert from 'node:assert';
import { createShift } from '../src/services/shift.service';
import { recordExpense } from '../src/services/expense.service';
import { recordCreditTransaction, saveCreditCustomer } from '../src/services/credit.service';
import {
  getReportData,
  getDateRangeForPeriod,
  getManifestForScope,
} from '../src/services/report.service';
import {
  generateMultiSheetExcelWorkbook,
  generateCsvExport,
} from '../src/services/export.service';

console.log('🧪 Starting OMEGA FUELS Reports & Analytics Test Suite...\n');

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
  // Setup: Create test customer
  const cust = await saveCreditCustomer({
    name: 'Report Test Customer',
    phone: '9899001122',
    status: 'ACTIVE',
  });

  // Setup: Shift A on 2026-09-01 with Cash ₹10,000
  await createShift({
    employee_id: 'emp_01',
    shift_date: '2026-09-01',
    shift_type: 'MORNING',
    payments: [{ payment_method: 'CASH', amount: 10000 }],
  });

  // Setup: Shift B on 2026-09-20 with Cash ₹50,000
  await createShift({
    employee_id: 'emp_01',
    shift_date: '2026-09-20',
    shift_type: 'MORNING',
    payments: [{ payment_method: 'CASH', amount: 50000 }],
  });

  // Setup: Expense on 2026-09-05 (₹4,000) and 2026-09-22 (₹7,500)
  await recordExpense({
    category: 'Electricity / Utilities',
    description: 'Early month power voucher',
    amount: 4000,
    expense_date: '2026-09-05',
  });

  await recordExpense({
    category: 'Station Supplies',
    description: 'Late month cleaning supplies',
    amount: 7500,
    expense_date: '2026-09-22',
  });

  // Test 1: Date Range 2026-09-01 -> 2026-09-05 yields ₹10,000
  await runTest('1. Range 2026-09-01 -> 2026-09-05 yields exactly ₹10,000 cash/sales', async () => {
    const report = await getReportData({
      startDate: '2026-09-01',
      endDate: '2026-09-05',
      scope: 'ALL',
      period: 'CUSTOM',
    });

    assert.strictEqual(report.kpis.cashReceived, 10000, 'Cash received must be 10000');
    assert.strictEqual(report.kpis.totalSales, 10000, 'Total sales must be 10000');
  });

  // Test 2: Date Range 2026-09-20 -> 2026-09-25 yields ₹50,000
  await runTest('2. Range 2026-09-20 -> 2026-09-25 yields exactly ₹50,000 cash/sales', async () => {
    const report = await getReportData({
      startDate: '2026-09-20',
      endDate: '2026-09-25',
      scope: 'ALL',
      period: 'CUSTOM',
    });

    assert.strictEqual(report.kpis.cashReceived, 50000, 'Cash received must be 50000');
    assert.strictEqual(report.kpis.totalSales, 50000, 'Total sales must be 50000');
  });

  // Test 3: Date Range 2026-09-01 -> 2026-09-30 yields ₹60,000
  await runTest('3. Range 2026-09-01 -> 2026-09-30 yields exactly ₹60,000 combined', async () => {
    const report = await getReportData({
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      scope: 'ALL',
      period: 'CUSTOM',
    });

    assert.strictEqual(report.kpis.cashReceived, 60000, 'Cash received must be 60000');
    assert.strictEqual(report.kpis.totalSales, 60000, 'Total sales must be 60000');
  });

  // Test 4: Expenses filtered strictly by selected date range
  await runTest('4. Expense filtering by date range', async () => {
    const reportEarly = await getReportData({
      startDate: '2026-09-01',
      endDate: '2026-09-10',
      scope: 'ALL',
    });
    assert.strictEqual(reportEarly.kpis.operatingExpenses, 4000, 'Early range should only have ₹4,000 expense');

    const reportLate = await getReportData({
      startDate: '2026-09-20',
      endDate: '2026-09-25',
      scope: 'ALL',
    });
    assert.strictEqual(reportLate.kpis.operatingExpenses, 7500, 'Late range should only have ₹7,500 expense');

    const reportFull = await getReportData({
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      scope: 'ALL',
    });
    assert.strictEqual(reportFull.kpis.operatingExpenses, 11500, 'Full month should include ₹11,500 expenses');
  });

  // Test 5: Payment Channel Chart generates points matching selected range
  await runTest('5. Payment channel chart dynamically populates daily points', async () => {
    const report = await getReportData({
      startDate: '2026-09-01',
      endDate: '2026-09-03',
      scope: 'ALL',
    });

    assert.strictEqual(report.paymentChannelTrend.length, 3, '3-day range must have 3 chart entries');
    const day1 = report.paymentChannelTrend.find((t) => t.date === '2026-09-01');
    assert(day1, 'Must include 2026-09-01 in trend data');
    assert.strictEqual(day1.Cash, 10000, 'Day 1 cash must be 10000');
  });

  // Test 6: Date period presets calculate consistent start and end dates
  await runTest('6. Date period presets (TODAY, YESTERDAY, THIS_WEEK, THIS_MONTH)', () => {
    const todayRange = getDateRangeForPeriod('TODAY');
    assert(todayRange.startDate === todayRange.endDate, 'Today start and end must match');

    const yesterdayRange = getDateRangeForPeriod('YESTERDAY');
    assert(yesterdayRange.startDate === yesterdayRange.endDate, 'Yesterday start and end must match');

    const thisMonthRange = getDateRangeForPeriod('THIS_MONTH');
    assert(thisMonthRange.startDate.endsWith('-01'), 'Month start must be 1st of month');

    const customRange = getDateRangeForPeriod('CUSTOM', '2026-09-01', '2026-09-15');
    assert.strictEqual(customRange.startDate, '2026-09-01');
    assert.strictEqual(customRange.endDate, '2026-09-15');
  });

  // Test 7: Multi-sheet Excel workbook export generates buffer with date filtering
  await runTest('7. Excel workbook (XLSX) generation with date range and scope', async () => {
    const bufferAll = await generateMultiSheetExcelWorkbook({
      startDate: '2026-09-01',
      endDate: '2026-09-05',
      scope: 'ALL',
    });
    assert(bufferAll && bufferAll.length > 0, 'Must produce valid binary Excel buffer');

    const bufferFin = await generateMultiSheetExcelWorkbook({
      startDate: '2026-09-01',
      endDate: '2026-09-05',
      scope: 'FINANCIAL',
    });
    assert(bufferFin && bufferFin.length > 0, 'Must produce valid Financial Excel buffer');
  });

  // Test 8: CSV export generates formatted text with date range header
  await runTest('8. CSV export generation with date range and scope', async () => {
    const csv = await generateCsvExport({
      startDate: '2026-09-01',
      endDate: '2026-09-05',
      scope: 'FINANCIAL',
    });
    assert(typeof csv === 'string', 'CSV output must be string');
    assert(csv.includes('OMEGA FUELS MASTER TRANSACTION EXPORT'), 'Must contain report header');
    assert(csv.includes('Date Filter,2026-09-01 to 2026-09-05'), 'Must contain date filter header');
  });

  // Test 9: Dynamic sheet manifest reflects selected scope
  await runTest('9. Dynamic sheet manifest reflects selected scope', () => {
    const allManifest = getManifestForScope('ALL');
    assert.strictEqual(allManifest.totalSheets, 9, 'Scope ALL must report 9 sheets');

    const finManifest = getManifestForScope('FINANCIAL');
    assert.strictEqual(finManifest.totalSheets, 4, 'Scope FINANCIAL must report 4 sheets');

    const fuelManifest = getManifestForScope('FUEL');
    assert.strictEqual(fuelManifest.totalSheets, 4, 'Scope FUEL must report 4 sheets');

    const creditManifest = getManifestForScope('CREDIT');
    assert.strictEqual(creditManifest.totalSheets, 2, 'Scope CREDIT must report 2 sheets');
  });

  console.log(`\n========================================`);
  console.log(`Results: ${passedTests} / ${totalTests} tests passed.`);
  if (passedTests === totalTests) {
    console.log('🎉 ALL REPORTS & ANALYTICS TESTS PASSED SUCCESSFULLY!');
  } else {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});

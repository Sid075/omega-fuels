import ExcelJS from 'exceljs';
import { getCashLedger } from './cash.service';
import { getFuelStockOverview, getFuelPriceHistory } from './fuel.service';
import { getCreditCustomers } from './credit.service';
import { getExpenses } from './expense.service';
import { getEmployees } from './employee.service';
import { getShifts } from './shift.service';

export async function generateMultiSheetExcelWorkbook(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'OMEGA FUELS Management System';
  workbook.lastModifiedBy = 'Station Admin';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Fetch live domain datasets
  const cashData = await getCashLedger();
  const fuelData = await getFuelStockOverview();
  const priceHistory = await getFuelPriceHistory();
  const creditData = await getCreditCustomers();
  const expenseData = await getExpenses();
  const employees = await getEmployees();

  // Helper styling
  const headerFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' }, // Dark slate
  };
  const headerFont: Partial<ExcelJS.Font> = {
    bold: true,
    color: { argb: 'FFFFFFFF' },
    size: 11,
  };

  // Sheet 1: Executive Summary & KPIs
  const summarySheet = workbook.addWorksheet('Executive Summary');
  summarySheet.columns = [
    { header: 'Key Performance Indicator', key: 'kpi', width: 35 },
    { header: 'Current Value (₹ / Litres)', key: 'val', width: 25 },
    { header: 'Status / Notes', key: 'notes', width: 40 },
  ];
  summarySheet.getRow(1).fill = headerFill;
  summarySheet.getRow(1).font = headerFont;

  summarySheet.addRows([
    { kpi: 'Total Shift Cash Received', val: `₹${cashData.summary.totalShiftCash.toLocaleString('en-IN')}`, notes: 'Cumulative physical cash collected from shifts' },
    { kpi: 'Total Credit Cash Repayments', val: `₹${cashData.summary.totalCreditCashRepayments.toLocaleString('en-IN')}`, notes: 'Repayments deposited into cash drawer' },
    { kpi: 'Owner Cash Collections', val: `₹${cashData.summary.totalOwnerCollected.toLocaleString('en-IN')}`, notes: 'Physical cash withdrawn by station owner' },
    { kpi: 'Drawer Cash Balance', val: `₹${cashData.summary.remainingExpectedCash.toLocaleString('en-IN')}`, notes: 'Expected physical cash in drawer' },
    { kpi: 'Total Outstanding Credit Due', val: `₹${creditData.totalOutstanding.toLocaleString('en-IN')}`, notes: 'Active customer credit balance' },
    { kpi: 'Petrol (MS) Available Stock', val: `${fuelData.summary.petrolStock.toLocaleString('en-IN')} L`, notes: 'Main underground tank 1 volume' },
    { kpi: 'Diesel (HSD) Available Stock', val: `${fuelData.summary.dieselStock.toLocaleString('en-IN')} L`, notes: 'Main underground tank 2 volume' },
    { kpi: 'Total Operational Expenses', val: `₹${expenseData.totalAmount.toLocaleString('en-IN')}`, notes: 'Recorded station overheads & utilities' },
  ]);

  // Sheet 2: Central Cash Ledger
  const cashSheet = workbook.addWorksheet('Cash Ledger');
  cashSheet.columns = [
    { header: 'Transaction ID', key: 'id', width: 20 },
    { header: 'Type', key: 'type', width: 22 },
    { header: 'Amount (₹)', key: 'amount', width: 16 },
    { header: 'Inflow / Outflow', key: 'inflow', width: 18 },
    { header: 'Notes / Description', key: 'notes', width: 40 },
    { header: 'Recorded By', key: 'recorded_by', width: 22 },
    { header: 'Occurred At', key: 'time', width: 22 },
  ];
  cashSheet.getRow(1).fill = headerFill;
  cashSheet.getRow(1).font = headerFont;

  cashData.entries.forEach((e) => {
    cashSheet.addRow({
      id: e.id,
      type: e.entry_type,
      amount: e.amount,
      inflow: e.amount >= 0 ? 'INFLOW (+)' : 'OUTFLOW (-)',
      notes: e.notes || e.title,
      recorded_by: e.creator_name || 'Staff',
      time: e.occurred_at,
    });
  });

  // Sheet 3: Fuel Inventory Tanks
  const tankSheet = workbook.addWorksheet('Fuel Tanks Overview');
  tankSheet.columns = [
    { header: 'Tank Name', key: 'name', width: 28 },
    { header: 'Fuel Product', key: 'fuel', width: 15 },
    { header: 'Capacity (L)', key: 'cap', width: 15 },
    { header: 'Current Stock (L)', key: 'stock', width: 18 },
    { header: 'Level %', key: 'level', width: 12 },
    { header: 'Selling Rate (₹/L)', key: 'rate', width: 18 },
    { header: 'Stock Valuation (₹)', key: 'val', width: 22 },
  ];
  tankSheet.getRow(1).fill = headerFill;
  tankSheet.getRow(1).font = headerFont;

  fuelData.tanks.forEach((t) => {
    tankSheet.addRow({
      name: t.name,
      fuel: t.fuel_type,
      cap: t.capacity_litres,
      stock: t.current_stock_litres,
      level: `${t.capacity_percentage}%`,
      rate: t.price_per_litre,
      val: t.stock_valuation,
    });
  });

  // Sheet 4: Fuel Stock Movements
  const fuelTxSheet = workbook.addWorksheet('Fuel Movements');
  fuelTxSheet.columns = [
    { header: 'Transaction ID', key: 'id', width: 20 },
    { header: 'Product', key: 'fuel', width: 12 },
    { header: 'Movement Type', key: 'type', width: 20 },
    { header: 'Volume (Litres)', key: 'vol', width: 16 },
    { header: 'Notes & Ref', key: 'notes', width: 45 },
    { header: 'Logged By', key: 'by', width: 20 },
    { header: 'Timestamp', key: 'time', width: 22 },
  ];
  fuelTxSheet.getRow(1).fill = headerFill;
  fuelTxSheet.getRow(1).font = headerFont;

  fuelData.transactions.forEach((tx) => {
    fuelTxSheet.addRow({
      id: tx.id,
      fuel: tx.fuel_type,
      type: tx.transaction_type,
      vol: tx.quantity_litres,
      notes: tx.notes || '',
      by: tx.creator_name || 'Staff',
      time: tx.created_at,
    });
  });

  // Sheet 5: Fuel Price Timeline
  const priceSheet = workbook.addWorksheet('Fuel Price Timeline');
  priceSheet.columns = [
    { header: 'Price ID', key: 'id', width: 20 },
    { header: 'Fuel Product', key: 'fuel', width: 15 },
    { header: 'Selling Rate (₹/L)', key: 'rate', width: 20 },
    { header: 'Effective Timestamp', key: 'effective', width: 24 },
  ];
  priceSheet.getRow(1).fill = headerFill;
  priceSheet.getRow(1).font = headerFont;

  priceHistory.forEach((p) => {
    priceSheet.addRow({
      id: p.id,
      fuel: p.fuel_type,
      rate: p.price_per_litre,
      effective: p.effective_at,
    });
  });

  // Sheet 6: Credit Customers
  const credSheet = workbook.addWorksheet('Credit Customer Accounts');
  credSheet.columns = [
    { header: 'Account ID', key: 'id', width: 18 },
    { header: 'Customer / Company Name', key: 'name', width: 30 },
    { header: 'Phone', key: 'phone', width: 18 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Outstanding Due (₹)', key: 'due', width: 20 },
    { header: 'Total Credit Drawn (₹)', key: 'drawn', width: 22 },
    { header: 'Total Repaid (₹)', key: 'repaid', width: 18 },
  ];
  credSheet.getRow(1).fill = headerFill;
  credSheet.getRow(1).font = headerFont;

  creditData.customers.forEach((c) => {
    credSheet.addRow({
      id: c.id,
      name: c.name,
      phone: c.phone || '',
      status: c.status,
      due: c.outstanding_balance,
      drawn: c.total_credit_given,
      repaid: c.total_repayments,
    });
  });

  // Sheet 7: Operating Expenses
  const expSheet = workbook.addWorksheet('Operating Expenses');
  expSheet.columns = [
    { header: 'Expense ID', key: 'id', width: 18 },
    { header: 'Category', key: 'cat', width: 25 },
    { header: 'Description', key: 'desc', width: 40 },
    { header: 'Amount (₹)', key: 'amt', width: 16 },
    { header: 'Voucher Date', key: 'date', width: 15 },
    { header: 'Logged By', key: 'by', width: 20 },
  ];
  expSheet.getRow(1).fill = headerFill;
  expSheet.getRow(1).font = headerFont;

  expenseData.expenses.forEach((e) => {
    expSheet.addRow({
      id: e.id,
      cat: e.category,
      desc: e.description,
      amt: e.amount,
      date: e.expense_date,
      by: e.creator_name || 'Staff',
    });
  });

  // Sheet 8: Staff Employee Master
  const empSheet = workbook.addWorksheet('Employee Staff Master');
  empSheet.columns = [
    { header: 'Employee ID', key: 'id', width: 18 },
    { header: 'Full Name', key: 'name', width: 25 },
    { header: 'Phone', key: 'phone', width: 18 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Notes', key: 'notes', width: 30 },
  ];
  empSheet.getRow(1).fill = headerFill;
  empSheet.getRow(1).font = headerFont;

  employees.forEach((emp) => {
    empSheet.addRow({
      id: emp.id,
      name: emp.name,
      phone: emp.phone || '',
      status: emp.status,
      notes: emp.notes || '',
    });
  });

  // Sheet 9: Shifts & Nozzle Operations
  const shifts = await getShifts();
  const shiftSheet = workbook.addWorksheet('Shift & Nozzle Operations');
  shiftSheet.columns = [
    { header: 'Shift ID', key: 'id', width: 22 },
    { header: 'Shift Date', key: 'date', width: 14 },
    { header: 'Operator', key: 'op', width: 20 },
    { header: 'Shift Type', key: 'type', width: 14 },
    { header: 'Nozzle Name', key: 'nozzle', width: 16 },
    { header: 'Fuel Type', key: 'fuel', width: 12 },
    { header: 'Opening Meter', key: 'open', width: 15 },
    { header: 'Closing Meter', key: 'close', width: 15 },
    { header: 'Litres Sold', key: 'litres', width: 14 },
    { header: 'Rate (₹/L)', key: 'rate', width: 14 },
    { header: 'Fuel Sales (₹)', key: 'fuel_sales', width: 16 },
    { header: 'Expected Total (₹)', key: 'total', width: 18 },
    { header: 'Physical Cash (₹)', key: 'cash', width: 16 },
    { header: 'Digital Inflow (₹)', key: 'digital', width: 16 },
    { header: 'Credit Inflow (₹)', key: 'credit', width: 16 },
    { header: 'Repayments Cash (₹)', key: 'repay_cash', width: 18 },
    { header: 'Repayments Digital (₹)', key: 'repay_digital', width: 18 },
    { header: 'Total Cash Drawer (₹)', key: 'total_physical_cash', width: 18 },
    { header: 'Variance (₹)', key: 'variance', width: 14 },
  ];
  shiftSheet.getRow(1).fill = headerFill;
  shiftSheet.getRow(1).font = headerFont;

  shifts.forEach((s) => {
    if (s.nozzle_readings && s.nozzle_readings.length > 0) {
      s.nozzle_readings.forEach((nr) => {
        shiftSheet.addRow({
          id: s.id,
          date: s.shift_date,
          op: s.employee_name,
          type: s.shift_type,
          nozzle: nr.nozzle_name,
          fuel: nr.fuel_type,
          open: nr.opening_reading,
          close: nr.closing_reading,
          litres: nr.litres_sold,
          rate: nr.price_per_litre,
          fuel_sales: nr.sales_amount,
          total: s.total_sales,
          cash: s.cash_amount,
          digital: s.digital_amount,
          credit: s.credit_amount,
          repay_cash: s.credit_repayments_cash ?? 0,
          repay_digital: s.credit_repayments_digital ?? 0,
          total_physical_cash: s.total_physical_cash ?? s.cash_amount,
          variance: s.reconciliation_variance ?? 0,
        });
      });
    } else {
      // Historical shift without nozzle breakdown
      shiftSheet.addRow({
        id: s.id,
        date: s.shift_date,
        op: s.employee_name,
        type: s.shift_type,
        nozzle: 'N/A (Legacy)',
        fuel: 'N/A',
        open: '-',
        close: '-',
        litres: s.total_fuel_litres || 0,
        rate: '-',
        fuel_sales: s.calculated_fuel_sales || 0,
        total: s.total_sales,
        cash: s.cash_amount,
        digital: s.digital_amount,
        credit: s.credit_amount,
        repay_cash: s.credit_repayments_cash ?? 0,
        repay_digital: s.credit_repayments_digital ?? 0,
        total_physical_cash: s.total_physical_cash ?? s.cash_amount,
        variance: s.reconciliation_variance ?? 0,
      });
    }
  });

  // Generate buffer
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

export async function generateCsvExport(scope: string = 'ALL'): Promise<string> {
  const cashData = await getCashLedger();
  const fuelData = await getFuelStockOverview();
  const creditData = await getCreditCustomers();
  const expenseData = await getExpenses();

  const lines: string[] = [];

  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  lines.push('=== OMEGA FUELS MASTER TRANSACTION EXPORT ===');
  lines.push(`Generated At,${new Date().toISOString()}`);
  lines.push('');

  // 1. Central Cash Ledger
  lines.push('--- CENTRAL CASH LEDGER ---');
  lines.push('ID,Type,Amount (INR),Inflow/Outflow,Notes,Recorded By,Timestamp');
  cashData.entries.forEach((e) => {
    lines.push([
      escapeCsv(e.id),
      escapeCsv(e.entry_type),
      e.amount,
      escapeCsv(e.amount >= 0 ? 'INFLOW' : 'OUTFLOW'),
      escapeCsv(e.notes || e.title),
      escapeCsv(e.creator_name || 'Staff'),
      escapeCsv(e.occurred_at),
    ].join(','));
  });
  lines.push('');

  // 2. Fuel Stock Movements
  lines.push('--- FUEL STOCK MOVEMENTS ---');
  lines.push('ID,Product,Movement Type,Volume (Litres),Notes,Logged By,Timestamp');
  fuelData.transactions.forEach((t) => {
    lines.push([
      escapeCsv(t.id),
      escapeCsv(t.fuel_type),
      escapeCsv(t.transaction_type),
      t.quantity_litres,
      escapeCsv(t.notes || ''),
      escapeCsv(t.creator_name || 'Staff'),
      escapeCsv(t.created_at),
    ].join(','));
  });
  lines.push('');

  // 3. Credit Customer Balances
  lines.push('--- CREDIT CUSTOMER BALANCES ---');
  lines.push('ID,Name,Phone,Status,Outstanding Due (INR),Total Drawn (INR),Total Repaid (INR)');
  creditData.customers.forEach((c) => {
    lines.push([
      escapeCsv(c.id),
      escapeCsv(c.name),
      escapeCsv(c.phone || ''),
      escapeCsv(c.status),
      c.outstanding_balance,
      c.total_credit_given,
      c.total_repayments,
    ].join(','));
  });
  lines.push('');

  // 4. Operating Expenses
  lines.push('--- OPERATING EXPENSES ---');
  lines.push('ID,Category,Description,Amount (INR),Expense Date,Logged By');
  expenseData.expenses.forEach((x) => {
    lines.push([
      escapeCsv(x.id),
      escapeCsv(x.category),
      escapeCsv(x.description),
      x.amount,
      escapeCsv(x.expense_date),
      escapeCsv(x.creator_name || 'Staff'),
    ].join(','));
  });
  lines.push('');

  // 5. Shift & Nozzle Operations
  lines.push('--- SHIFT & NOZZLE READINGS ---');
  lines.push('Shift ID,Date,Operator,Shift Type,Nozzle,Fuel,Opening Meter,Closing Meter,Litres Sold,Rate (INR),Fuel Sales (INR),Expected Total (INR),Cash (INR),Digital (INR),Credit (INR),Repay Cash (INR),Repay Digital (INR),Total Cash Drawer (INR),Variance (INR)');
  const csvShifts = await getShifts();
  csvShifts.forEach((s) => {
    if (s.nozzle_readings && s.nozzle_readings.length > 0) {
      s.nozzle_readings.forEach((nr) => {
        lines.push([
          escapeCsv(s.id),
          escapeCsv(s.shift_date),
          escapeCsv(s.employee_name),
          escapeCsv(s.shift_type),
          escapeCsv(nr.nozzle_name),
          escapeCsv(nr.fuel_type),
          nr.opening_reading,
          nr.closing_reading,
          nr.litres_sold,
          nr.price_per_litre,
          nr.sales_amount,
          s.total_sales,
          s.cash_amount,
          s.digital_amount,
          s.credit_amount,
          s.credit_repayments_cash ?? 0,
          s.credit_repayments_digital ?? 0,
          s.total_physical_cash ?? s.cash_amount,
          s.reconciliation_variance ?? 0,
        ].join(','));
      });
    } else {
      lines.push([
        escapeCsv(s.id),
        escapeCsv(s.shift_date),
        escapeCsv(s.employee_name),
        escapeCsv(s.shift_type),
        escapeCsv('N/A (Legacy)'),
        escapeCsv('N/A'),
        '""',
        '""',
        s.total_fuel_litres || 0,
        '""',
        s.calculated_fuel_sales || 0,
        s.total_sales,
        s.cash_amount,
        s.digital_amount,
        s.credit_amount,
        s.credit_repayments_cash ?? 0,
        s.credit_repayments_digital ?? 0,
        s.total_physical_cash ?? s.cash_amount,
        s.reconciliation_variance ?? 0,
      ].join(','));
    }
  });

  return lines.join('\r\n');
}

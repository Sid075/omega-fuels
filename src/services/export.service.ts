import ExcelJS from 'exceljs';
import { getCashLedger } from './cash.service';
import { getFuelStockOverview, getFuelPriceHistory } from './fuel.service';
import { getCreditCustomers } from './credit.service';
import { getExpenses } from './expense.service';
import { getEmployees } from './employee.service';

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

  // Generate buffer
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

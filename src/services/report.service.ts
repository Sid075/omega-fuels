import { getShifts } from './shift.service';
import { getExpenses } from './expense.service';
import { getCashLedger } from './cash.service';
import { getCreditCustomers, getCreditTransactions } from './credit.service';
import { safeRound } from '@/lib/calculations/cash';

export interface ReportFilter {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  scope: string;     // 'ALL' | 'FINANCIAL' | 'FUEL' | 'CREDIT'
  period?: string;   // 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'LAST_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR' | 'CUSTOM'
}

export interface ReportKPIs {
  totalSales: number;
  cashReceived: number;
  upiReceived: number;
  cardReceived: number;
  creditIssued: number;
  creditRepaymentsTotal: number;
  creditRepaymentsCash: number;
  creditRepaymentsDigital: number;
  totalPhysicalCashInflow: number;
  operatingExpenses: number;
  totalFuelLitres: number;
  petrolLitres: number;
  dieselLitres: number;
  petrolSales: number;
  dieselSales: number;
  totalFuelSales: number;
  otherSales: number;
  outstandingCredit: number;
  shiftCount: number;
  ownerCashCollected: number;
  netCashBalance: number;
}

export interface PaymentChannelTrendItem {
  date: string;
  day: string;
  Cash: number;
  UPI: number;
  Card: number;
  Credit: number;
  Total: number;
}

export interface ExpenseCategoryItem {
  name: string;
  value: number;
  color: string;
}

export interface SheetManifestModule {
  name: string;
  description: string;
  sheets: number;
}

export interface ReportData {
  filter: ReportFilter;
  kpis: ReportKPIs;
  paymentChannelTrend: PaymentChannelTrendItem[];
  expenseCategories: ExpenseCategoryItem[];
  manifest: {
    totalSheets: number;
    modules: SheetManifestModule[];
  };
}

const CATEGORY_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#64748B', // Slate
];

export function getDateRangeForPeriod(
  period: string,
  customStart?: string,
  customEnd?: string
): { startDate: string; endDate: string } {
  const now = new Date();
  const formatYmd = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = formatYmd(now);

  switch (period) {
    case 'TODAY':
      return { startDate: todayStr, endDate: todayStr };

    case 'YESTERDAY': {
      const yest = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const yestStr = formatYmd(yest);
      return { startDate: yestStr, endDate: yestStr };
    }

    case 'THIS_WEEK': {
      const day = now.getDay();
      const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.getFullYear(), now.getMonth(), diffToMonday);
      const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
      return { startDate: formatYmd(monday), endDate: formatYmd(sunday) };
    }

    case 'LAST_WEEK': {
      const day = now.getDay();
      const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1) - 7;
      const lastMonday = new Date(now.getFullYear(), now.getMonth(), diffToMonday);
      const lastSunday = new Date(lastMonday.getFullYear(), lastMonday.getMonth(), lastMonday.getDate() + 6);
      return { startDate: formatYmd(lastMonday), endDate: formatYmd(lastSunday) };
    }

    case 'THIS_MONTH': {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate: formatYmd(firstDay), endDate: formatYmd(lastDay) };
    }

    case 'LAST_MONTH': {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: formatYmd(firstDay), endDate: formatYmd(lastDay) };
    }

    case 'THIS_YEAR': {
      const firstDay = new Date(now.getFullYear(), 0, 1);
      const lastDay = new Date(now.getFullYear(), 11, 31);
      return { startDate: formatYmd(firstDay), endDate: formatYmd(lastDay) };
    }

    case 'CUSTOM':
      return {
        startDate: customStart || todayStr,
        endDate: customEnd || todayStr,
      };

    default:
      return { startDate: todayStr, endDate: todayStr };
  }
}

export function getManifestForScope(scope: string): { totalSheets: number; modules: SheetManifestModule[] } {
  switch (scope) {
    case 'FINANCIAL': {
      const modules: SheetManifestModule[] = [
        { name: 'Executive Summary', description: 'Total revenue, gross margin, cash vs digital distribution', sheets: 1 },
        { name: 'Central Cash Ledger', description: 'Chronological cash inflows, shift drops and owner collections', sheets: 1 },
        { name: 'Operating Expenses', description: 'Itemized expense list categorized by utility and repairs', sheets: 1 },
        { name: 'Shift Financial Collections', description: 'Employee-wise cash, UPI, card, and credit payment breakdown', sheets: 1 },
      ];
      return { totalSheets: 4, modules };
    }
    case 'FUEL': {
      const modules: SheetManifestModule[] = [
        { name: 'Fuel Tanks Overview', description: 'Tank capacities, current dip levels and stock valuations', sheets: 1 },
        { name: 'Fuel Stock Movements', description: 'Tanker deliveries, pump dispenser sales and generator consumption', sheets: 1 },
        { name: 'Fuel Price Timeline', description: 'Historical retail price revision logs for Petrol & Diesel', sheets: 1 },
        { name: 'Shift & Nozzle Operations', description: 'Dispenser counter opening/closing readings and litres dispensed', sheets: 1 },
      ];
      return { totalSheets: 4, modules };
    }
    case 'CREDIT': {
      const modules: SheetManifestModule[] = [
        { name: 'Credit Customer Accounts', description: 'Customer master accounts, credit limits and outstanding balances', sheets: 1 },
        { name: 'Credit Transactions & Chits', description: 'Itemized chits issued and repayments recorded during shifts', sheets: 1 },
      ];
      return { totalSheets: 2, modules };
    }
    case 'ALL':
    default: {
      const modules: SheetManifestModule[] = [
        { name: 'Executive Summary', description: 'Key performance indicators and station-wide financial summary', sheets: 1 },
        { name: 'Central Cash Ledger', description: 'Complete chronological physical cash inflow and owner withdrawals', sheets: 1 },
        { name: 'Fuel Tanks Overview', description: 'Active tank stock levels, percentages and current stock valuations', sheets: 1 },
        { name: 'Fuel Stock Movements', description: 'Delivery challans, dispenser sales and generator log records', sheets: 1 },
        { name: 'Fuel Price Timeline', description: 'Effective rate history for MS Petrol and HSD Diesel', sheets: 1 },
        { name: 'Credit Customer Accounts', description: 'Registered fleet credit accounts, credit terms and total drawn/repaid', sheets: 1 },
        { name: 'Operating Expenses', description: 'Categorized station maintenance, utility bills and consumable receipts', sheets: 1 },
        { name: 'Employee Staff Master', description: 'Registered nozzle operators, shifts attendants and duty rosters', sheets: 1 },
        { name: 'Shift & Nozzle Operations', description: 'Opening/closing mechanical meter counters, fuel litres and collections', sheets: 1 },
      ];
      return { totalSheets: 9, modules };
    }
  }
}

export async function getReportData(filter: ReportFilter): Promise<ReportData> {
  const { startDate, endDate, scope } = filter;

  // 1. Fetch domain datasets for date range
  const shifts = await getShifts(undefined, undefined, startDate, endDate);
  const expenseResult = await getExpenses(undefined, startDate, endDate);
  const cashResult = await getCashLedger(undefined, undefined, startDate, endDate);
  const creditCustomersResult = await getCreditCustomers();
  const creditTransactions = await getCreditTransactions(startDate, endDate);

  // 2. Aggregate Shift Metrics
  let totalSales = 0;
  let cashReceived = 0;
  let upiReceived = 0;
  let cardReceived = 0;
  let creditIssued = 0;
  let creditRepaymentsCash = 0;
  let creditRepaymentsDigital = 0;
  let totalFuelLitres = 0;
  let petrolLitres = 0;
  let dieselLitres = 0;
  let petrolSales = 0;
  let dieselSales = 0;
  let totalFuelSales = 0;
  let otherSales = 0;

  shifts.forEach((s) => {
    totalSales = safeRound(totalSales + s.total_sales);
    cashReceived = safeRound(cashReceived + s.cash_amount);

    (s.payments || []).forEach((p) => {
      const amt = Number(p.amount) || 0;
      if (p.payment_method === 'UPI') upiReceived = safeRound(upiReceived + amt);
      else if (p.payment_method === 'CARD') cardReceived = safeRound(cardReceived + amt);
      else if (p.payment_method === 'CREDIT') creditIssued = safeRound(creditIssued + amt);
    });

    (s.other_sales || []).forEach((os) => {
      otherSales = safeRound(otherSales + (Number(os.amount) || 0));
    });

    creditRepaymentsCash = safeRound(creditRepaymentsCash + (s.credit_repayments_cash || 0));
    creditRepaymentsDigital = safeRound(creditRepaymentsDigital + (s.credit_repayments_digital || 0));

    if (s.nozzle_readings && s.nozzle_readings.length > 0) {
      s.nozzle_readings.forEach((nr) => {
        const litres = Number(nr.litres_sold) || 0;
        const amount = Number(nr.sales_amount) || 0;
        if (nr.fuel_type === 'PETROL') {
          petrolLitres = safeRound(petrolLitres + litres);
          petrolSales = safeRound(petrolSales + amount);
        } else {
          dieselLitres = safeRound(dieselLitres + litres);
          dieselSales = safeRound(dieselSales + amount);
        }
      });
    } else {
      totalFuelLitres = safeRound(totalFuelLitres + (s.total_fuel_litres || 0));
      totalFuelSales = safeRound(totalFuelSales + (s.calculated_fuel_sales || 0));
    }
  });

  if (petrolLitres > 0 || dieselLitres > 0) {
    totalFuelLitres = safeRound(petrolLitres + dieselLitres);
    totalFuelSales = safeRound(petrolSales + dieselSales);
  }

  // Account for any standalone counter credit repayments during this period
  creditTransactions.forEach((ct) => {
    // Only count if not already embedded in shifts to prevent double counting
    const isShiftTx = shifts.some((s) => s.id === ct.shift_id);
    if (!isShiftTx && ct.transaction_type === 'PAYMENT_RECEIVED') {
      if (ct.payment_method === 'CASH') {
        creditRepaymentsCash = safeRound(creditRepaymentsCash + ct.amount);
      } else {
        creditRepaymentsDigital = safeRound(creditRepaymentsDigital + ct.amount);
      }
    }
    if (!isShiftTx && ct.transaction_type === 'CREDIT_GIVEN') {
      creditIssued = safeRound(creditIssued + ct.amount);
    }
  });

  const creditRepaymentsTotal = safeRound(creditRepaymentsCash + creditRepaymentsDigital);
  const totalPhysicalCashInflow = safeRound(cashReceived + creditRepaymentsCash);
  const operatingExpenses = safeRound(expenseResult.totalAmount);

  // 3. Cash Ledger Calculations
  let ownerCashCollected = 0;
  cashResult.entries.forEach((e) => {
    if (e.entry_type === 'OWNER_COLLECTION') {
      ownerCashCollected = safeRound(ownerCashCollected + Math.abs(e.amount));
    }
  });

  const kpis: ReportKPIs = {
    totalSales,
    cashReceived,
    upiReceived,
    cardReceived,
    creditIssued,
    creditRepaymentsTotal,
    creditRepaymentsCash,
    creditRepaymentsDigital,
    totalPhysicalCashInflow,
    operatingExpenses,
    totalFuelLitres,
    petrolLitres,
    dieselLitres,
    petrolSales,
    dieselSales,
    totalFuelSales,
    otherSales,
    outstandingCredit: safeRound(creditCustomersResult.totalOutstanding),
    shiftCount: shifts.length,
    ownerCashCollected,
    netCashBalance: safeRound(cashResult.summary.netBalance),
  };

  // 4. Payment Channel Trend Data (Daily breakdown across the selected period)
  const paymentChannelTrend: PaymentChannelTrendItem[] = [];

  const startD = new Date(startDate + 'T00:00:00');
  const endD = new Date(endDate + 'T00:00:00');
  const dayDiff = Math.round((endD.getTime() - startD.getTime()) / (1000 * 3600 * 24));

  if (dayDiff <= 31 && dayDiff >= 0) {
    // Generate daily points
    const iter = new Date(startD);
    while (iter <= endD) {
      const y = iter.getFullYear();
      const m = String(iter.getMonth() + 1).padStart(2, '0');
      const d = String(iter.getDate()).padStart(2, '0');
      const dStr = `${y}-${m}-${d}`;

      const dateShifts = shifts.filter((s) => s.shift_date === dStr);
      let dayCash = 0;
      let dayUpi = 0;
      let dayCard = 0;
      let dayCredit = 0;

      dateShifts.forEach((s) => {
        dayCash = safeRound(dayCash + s.cash_amount);
        (s.payments || []).forEach((p) => {
          const amt = Number(p.amount) || 0;
          if (p.payment_method === 'UPI') dayUpi = safeRound(dayUpi + amt);
          else if (p.payment_method === 'CARD') dayCard = safeRound(dayCard + amt);
          else if (p.payment_method === 'CREDIT') dayCredit = safeRound(dayCredit + amt);
        });
      });

      const dayLabel = iter.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

      paymentChannelTrend.push({
        date: dStr,
        day: dayLabel,
        Cash: dayCash,
        UPI: dayUpi,
        Card: dayCard,
        Credit: dayCredit,
        Total: safeRound(dayCash + dayUpi + dayCard + dayCredit),
      });

      iter.setDate(iter.getDate() + 1);
    }
  } else {
    // Group by month for longer periods (e.g. This Year)
    const monthMap: Record<string, PaymentChannelTrendItem> = {};
    shifts.forEach((s) => {
      const monthKey = s.shift_date.slice(0, 7); // YYYY-MM
      const monthDate = new Date(monthKey + '-01T00:00:00');
      const label = monthDate.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });

      if (!monthMap[monthKey]) {
        monthMap[monthKey] = {
          date: monthKey,
          day: label,
          Cash: 0,
          UPI: 0,
          Card: 0,
          Credit: 0,
          Total: 0,
        };
      }

      monthMap[monthKey].Cash = safeRound(monthMap[monthKey].Cash + s.cash_amount);
      (s.payments || []).forEach((p) => {
        const amt = Number(p.amount) || 0;
        if (p.payment_method === 'UPI') monthMap[monthKey].UPI = safeRound(monthMap[monthKey].UPI + amt);
        else if (p.payment_method === 'CARD') monthMap[monthKey].Card = safeRound(monthMap[monthKey].Card + amt);
        else if (p.payment_method === 'CREDIT') monthMap[monthKey].Credit = safeRound(monthMap[monthKey].Credit + amt);
      });
      monthMap[monthKey].Total = safeRound(
        monthMap[monthKey].Cash + monthMap[monthKey].UPI + monthMap[monthKey].Card + monthMap[monthKey].Credit
      );
    });

    Object.keys(monthMap)
      .sort()
      .forEach((k) => paymentChannelTrend.push(monthMap[k]));
  }

  // 5. Operating Expenses Category Breakdown
  const catMap: Record<string, number> = {};
  expenseResult.expenses.forEach((e) => {
    catMap[e.category] = safeRound((catMap[e.category] || 0) + e.amount);
  });

  const expenseCategories: ExpenseCategoryItem[] = Object.entries(catMap).map(([name, value], idx) => ({
    name,
    value,
    color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
  }));

  // 6. Manifest
  const manifest = getManifestForScope(scope);

  return {
    filter,
    kpis,
    paymentChannelTrend,
    expenseCategories,
    manifest,
  };
}

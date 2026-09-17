import { CashLedgerEntry } from '@/types';

/**
 * Safely round numbers to 2 decimal places to prevent IEEE 754 floating point drift
 */
export function safeRound(value: number, decimals: number = 2): number {
  if (isNaN(value)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Calculate expected available cash and owner collections strictly from the ledger event stream.
 *
 * Formula:
 * - Positive inflows: SHIFT_CASH, CREDIT_CASH_PAYMENT
 * - Negative outflows: OWNER_COLLECTION (recorded as negative amount)
 * - Adjustments: Signed amount
 *
 * Remaining Cash = Total Cash Inflows - Total Owner Collections ± Adjustments
 *
 * This mathematically guarantees ZERO DOUBLE-COUNTING when an owner collects cash mid-shift.
 */
export function calculateCashLedgerSummary(entries: CashLedgerEntry[]) {
  let totalShiftCash = 0;
  let totalCreditCashRepayments = 0;
  let totalOwnerCollected = 0;
  let totalAdjustments = 0;

  for (const entry of entries) {
    const amt = Number(entry.amount) || 0;
    if (entry.entry_type === 'SHIFT_CASH') {
      totalShiftCash += amt;
    } else if (entry.entry_type === 'CREDIT_CASH_PAYMENT') {
      totalCreditCashRepayments += amt;
    } else if (entry.entry_type === 'OWNER_COLLECTION') {
      totalOwnerCollected += Math.abs(amt);
    } else if (entry.entry_type === 'ADJUSTMENT') {
      totalAdjustments += amt;
    }
  }

  const totalInflows = safeRound(totalShiftCash + totalCreditCashRepayments);
  totalShiftCash = safeRound(totalShiftCash);
  totalCreditCashRepayments = safeRound(totalCreditCashRepayments);
  totalOwnerCollected = safeRound(totalOwnerCollected);
  totalAdjustments = safeRound(totalAdjustments);

  const runningExpectedCash = safeRound(totalInflows - totalOwnerCollected + totalAdjustments);

  return {
    totalInflows,
    totalShiftCash,
    totalCreditCashRepayments,
    totalOwnerCollected,
    totalAdjustments,
    remainingExpectedCash: Math.max(0, runningExpectedCash),
    netBalance: runningExpectedCash,
  };
}

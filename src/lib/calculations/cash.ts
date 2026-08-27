import { CashLedgerEntry } from '@/types';

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
    if (entry.entry_type === 'SHIFT_CASH') {
      totalShiftCash += entry.amount;
    } else if (entry.entry_type === 'CREDIT_CASH_PAYMENT') {
      totalCreditCashRepayments += entry.amount;
    } else if (entry.entry_type === 'OWNER_COLLECTION') {
      // Stored as negative number or absolute collection value
      totalOwnerCollected += Math.abs(entry.amount);
    } else if (entry.entry_type === 'ADJUSTMENT') {
      totalAdjustments += entry.amount;
    }
  }

  const totalInflows = totalShiftCash + totalCreditCashRepayments;
  const runningExpectedCash = totalInflows - totalOwnerCollected + totalAdjustments;

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

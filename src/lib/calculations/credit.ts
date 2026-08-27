import { CreditTransaction } from '@/types';

/**
 * Calculate customer outstanding balance strictly from credit transaction ledger.
 *
 * Outstanding Balance = SUM(CREDIT_GIVEN) - SUM(PAYMENT_RECEIVED) ± Adjustments
 */
export function calculateCreditBalance(transactions: CreditTransaction[], customerId?: string) {
  const filtered = customerId ? transactions.filter((t) => t.customer_id === customerId) : transactions;

  let totalCreditGiven = 0;
  let totalPaymentsReceived = 0;
  let totalCashRepayments = 0;
  let totalDigitalRepayments = 0;
  let totalAdjustments = 0;

  for (const tx of filtered) {
    if (tx.transaction_type === 'CREDIT_GIVEN') {
      totalCreditGiven += tx.amount;
    } else if (tx.transaction_type === 'PAYMENT_RECEIVED') {
      totalPaymentsReceived += tx.amount;
      if (tx.payment_method === 'CASH') {
        totalCashRepayments += tx.amount;
      } else {
        totalDigitalRepayments += tx.amount;
      }
    } else if (tx.transaction_type === 'ADJUSTMENT') {
      totalAdjustments += tx.amount;
    }
  }

  const outstandingBalance = totalCreditGiven - totalPaymentsReceived + totalAdjustments;

  return {
    totalCreditGiven,
    totalPaymentsReceived,
    totalCashRepayments,
    totalDigitalRepayments,
    totalAdjustments,
    outstandingBalance: Math.max(0, outstandingBalance),
  };
}

import { CreditTransaction } from '@/types';
import { safeRound } from './cash';

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
    const amt = Number(tx.amount) || 0;
    if (tx.transaction_type === 'CREDIT_GIVEN') {
      totalCreditGiven += amt;
    } else if (tx.transaction_type === 'PAYMENT_RECEIVED') {
      totalPaymentsReceived += amt;
      if (tx.payment_method === 'CASH') {
        totalCashRepayments += amt;
      } else {
        totalDigitalRepayments += amt;
      }
    } else if (tx.transaction_type === 'ADJUSTMENT') {
      totalAdjustments += amt;
    }
  }

  totalCreditGiven = safeRound(totalCreditGiven);
  totalPaymentsReceived = safeRound(totalPaymentsReceived);
  totalCashRepayments = safeRound(totalCashRepayments);
  totalDigitalRepayments = safeRound(totalDigitalRepayments);
  totalAdjustments = safeRound(totalAdjustments);

  const outstandingBalance = safeRound(totalCreditGiven - totalPaymentsReceived + totalAdjustments);

  return {
    totalCreditGiven,
    totalPaymentsReceived,
    totalCashRepayments,
    totalDigitalRepayments,
    totalAdjustments,
    outstandingBalance: Math.max(0, outstandingBalance),
  };
}

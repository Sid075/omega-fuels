/**
 * Format currency with Indian rupee symbol and standard commas (e.g. ₹45,200.00)
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format litres with decimal precision (e.g. 14,500.000 L)
 */
export function formatLitres(litres: number | null | undefined, decimals = 2): string {
  if (litres === null || litres === undefined || isNaN(litres)) return `0.00 L`;
  return `${new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(litres)} L`;
}

/**
 * Format ISO date string to user-friendly Indian format (e.g. 27 Aug 2026)
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Format ISO date string to user-friendly Time (e.g. 02:45 PM)
 */
export function formatTime(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

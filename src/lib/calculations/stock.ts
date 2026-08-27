import { FuelStockTransaction, FuelType } from '@/types';

/**
 * Calculate current fuel stock strictly from transaction history.
 *
 * Current Stock = Opening Stock + Deliveries - Fuel Sold - Test Usage - Generator Usage ± Adjustments
 */
export function calculateFuelStock(transactions: FuelStockTransaction[], fuelType?: FuelType) {
  const filtered = fuelType ? transactions.filter((t) => t.fuel_type === fuelType) : transactions;

  let petrolStock = 0;
  let dieselStock = 0;

  for (const tx of filtered) {
    let sign = 1;
    switch (tx.transaction_type) {
      case 'OPENING':
      case 'DELIVERY':
        sign = 1;
        break;
      case 'SALE':
      case 'TEST_USAGE':
      case 'GENERATOR_USAGE':
        sign = -1;
        break;
      case 'ADJUSTMENT':
        sign = tx.quantity_litres < 0 ? -1 : 1;
        break;
    }

    const volume = Math.abs(tx.quantity_litres) * sign;

    if (tx.fuel_type === 'PETROL') {
      petrolStock += volume;
    } else if (tx.fuel_type === 'DIESEL') {
      dieselStock += volume;
    }
  }

  return {
    petrolStock: Math.max(0, petrolStock),
    dieselStock: Math.max(0, dieselStock),
    totalStock: Math.max(0, petrolStock + dieselStock),
  };
}

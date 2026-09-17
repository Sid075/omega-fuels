import { FuelType, ShiftNozzleReading } from '@/types';
import { safeRound } from './cash';

export interface NozzleInputItem {
  id?: string;
  machine_id?: string;
  machine_name?: string;
  nozzle_name: string;
  fuel_type: FuelType;
  opening_reading: number | string;
  closing_reading: number | string;
}

export interface CalculatedNozzleReading {
  id: string;
  machine_id?: string;
  machine_name?: string;
  nozzle_name: string;
  fuel_type: FuelType;
  opening_reading: number;
  closing_reading: number;
  litres_sold: number;
  price_per_litre: number;
  sales_amount: number;
  isValid: boolean;
  errorMessage?: string;
}

export interface ShiftNozzleCalculationSummary {
  readings: CalculatedNozzleReading[];
  petrolLitres: number;
  dieselLitres: number;
  totalLitres: number;
  petrolSales: number;
  dieselSales: number;
  totalFuelSales: number;
  isValid: boolean;
  firstError?: string;
}

/**
 * Calculate single nozzle meter reading litres and sales amount with strict validation.
 */
export function calculateNozzleReading(
  input: NozzleInputItem,
  prices: { PETROL: number; DIESEL: number }
): CalculatedNozzleReading {
  const opening = input.opening_reading === '' ? NaN : Number(input.opening_reading);
  const closing = input.closing_reading === '' ? NaN : Number(input.closing_reading);
  const fuelType = input.fuel_type === 'DIESEL' ? 'DIESEL' : 'PETROL';
  const price = prices[fuelType] || 0;
  const id = input.id || `nozzle_${Math.random().toString(36).substring(2, 7)}`;
  const nozzleName = input.nozzle_name?.trim() || 'Nozzle';

  // 0. Handle untouched / empty reading gracefully (unoperated machine or nozzle)
  if (input.opening_reading === '' && input.closing_reading === '') {
    return {
      id,
      machine_id: input.machine_id,
      machine_name: input.machine_name,
      nozzle_name: nozzleName,
      fuel_type: fuelType,
      opening_reading: 0,
      closing_reading: 0,
      litres_sold: 0,
      price_per_litre: price,
      sales_amount: 0,
      isValid: true,
    };
  }

  // 1. Check for NaN / invalid numbers
  if (isNaN(opening) || isNaN(closing)) {
    return {
      id,
      machine_id: input.machine_id,
      machine_name: input.machine_name,
      nozzle_name: nozzleName,
      fuel_type: fuelType,
      opening_reading: isNaN(opening) ? 0 : opening,
      closing_reading: isNaN(closing) ? 0 : closing,
      litres_sold: 0,
      price_per_litre: price,
      sales_amount: 0,
      isValid: false,
      errorMessage: input.opening_reading === '' || input.closing_reading === ''
        ? 'Both opening and closing meter readings are required'
        : 'Meter readings must be valid numbers',
    };
  }

  // 2. Check for negative readings
  if (opening < 0 || closing < 0) {
    return {
      id,
      machine_id: input.machine_id,
      machine_name: input.machine_name,
      nozzle_name: nozzleName,
      fuel_type: fuelType,
      opening_reading: opening,
      closing_reading: closing,
      litres_sold: 0,
      price_per_litre: price,
      sales_amount: 0,
      isValid: false,
      errorMessage: 'Meter readings cannot be negative',
    };
  }

  // 3. Check that closing is not less than opening
  if (closing < opening) {
    return {
      id,
      machine_id: input.machine_id,
      machine_name: input.machine_name,
      nozzle_name: nozzleName,
      fuel_type: fuelType,
      opening_reading: opening,
      closing_reading: closing,
      litres_sold: 0,
      price_per_litre: price,
      sales_amount: 0,
      isValid: false,
      errorMessage: 'Closing reading cannot be less than opening reading',
    };
  }

  // 4. Calculate safe decimal litres and currency sales
  const litresSold = safeRound(closing - opening, 3);
  const salesAmount = safeRound(litresSold * price, 2);

  return {
    id,
    machine_id: input.machine_id,
    machine_name: input.machine_name,
    nozzle_name: nozzleName,
    fuel_type: fuelType,
    opening_reading: opening,
    closing_reading: closing,
    litres_sold: litresSold,
    price_per_litre: price,
    sales_amount: salesAmount,
    isValid: true,
  };
}

/**
 * Calculate multi-nozzle summary with Petrol & Diesel subtotals and overall totals.
 */
export function calculateShiftNozzlesSummary(
  inputs: NozzleInputItem[],
  prices: { PETROL: number; DIESEL: number }
): ShiftNozzleCalculationSummary {
  const readings = inputs.map((item) => calculateNozzleReading(item, prices));
  let petrolLitres = 0;
  let dieselLitres = 0;
  let petrolSales = 0;
  let dieselSales = 0;
  let isValid = true;
  let firstError: string | undefined;

  for (const r of readings) {
    if (!r.isValid) {
      isValid = false;
      if (!firstError) {
        firstError = `${r.nozzle_name}: ${r.errorMessage}`;
      }
    }
    if (r.fuel_type === 'PETROL') {
      petrolLitres += r.litres_sold;
      petrolSales += r.sales_amount;
    } else {
      dieselLitres += r.litres_sold;
      dieselSales += r.sales_amount;
    }
  }

  petrolLitres = safeRound(petrolLitres, 3);
  dieselLitres = safeRound(dieselLitres, 3);
  const totalLitres = safeRound(petrolLitres + dieselLitres, 3);

  petrolSales = safeRound(petrolSales, 2);
  dieselSales = safeRound(dieselSales, 2);
  const totalFuelSales = safeRound(petrolSales + dieselSales, 2);

  return {
    readings,
    petrolLitres,
    dieselLitres,
    totalLitres,
    petrolSales,
    dieselSales,
    totalFuelSales,
    isValid,
    firstError,
  };
}

/**
 * Reconcile authoritative expected sales against actual payment collections.
 */
export function calculateShiftReconciliation(
  fuelSales: number,
  otherSalesTotal: number,
  collections: {
    cash: number;
    upi: number;
    card: number;
    credit: number;
  }
) {
  const expectedFuelSales = safeRound(Number(fuelSales) || 0, 2);
  const otherSales = safeRound(Number(otherSalesTotal) || 0, 2);
  const expectedTotalSales = safeRound(expectedFuelSales + otherSales, 2);

  const numCash = safeRound(Number(collections.cash) || 0, 2);
  const numUpi = safeRound(Number(collections.upi) || 0, 2);
  const numCard = safeRound(Number(collections.card) || 0, 2);
  const numCredit = safeRound(Number(collections.credit) || 0, 2);

  const actualCollections = safeRound(numCash + numUpi + numCard + numCredit, 2);
  const variance = safeRound(actualCollections - expectedTotalSales, 2);

  return {
    expectedFuelSales,
    otherSales,
    expectedTotalSales,
    actualCollections,
    variance,
    isBalanced: Math.abs(variance) < 0.01,
    isSurplus: variance >= 0.01,
    isShortage: variance <= -0.01,
  };
}

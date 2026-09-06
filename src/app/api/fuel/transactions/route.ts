import { NextRequest, NextResponse } from 'next/server';
import { getFuelStockOverview } from '@/services/fuel.service';
import { FuelType, FuelTransactionType } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fuelTypeParam = searchParams.get('fuel_type');
    const typeParam = searchParams.get('type');

    const fuelTypeFilter = fuelTypeParam && (fuelTypeParam === 'PETROL' || fuelTypeParam === 'DIESEL') ? (fuelTypeParam as FuelType) : undefined;
    const typeFilter = typeParam ? (typeParam as FuelTransactionType) : undefined;

    const overview = await getFuelStockOverview(fuelTypeFilter, typeFilter);
    return NextResponse.json({ success: true, data: overview });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to fetch fuel transactions.' }, { status: 500 });
  }
}

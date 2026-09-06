import { NextRequest, NextResponse } from 'next/server';
import { getLatestFuelPrices, getFuelPriceHistory, updateFuelPrice } from '@/services/fuel.service';
import { FuelType } from '@/types';

export async function GET() {
  try {
    const latestPrices = await getLatestFuelPrices();
    const history = await getFuelPriceHistory();
    return NextResponse.json({ success: true, data: { latest: latestPrices, history } });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to fetch fuel prices.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fuel_type, price_per_litre, effective_at } = body;

    if (!fuel_type || (fuel_type !== 'PETROL' && fuel_type !== 'DIESEL')) {
      return NextResponse.json({ success: false, error: 'Valid fuel_type (PETROL or DIESEL) is required.' }, { status: 400 });
    }

    const numPrice = Number(price_per_litre);
    if (isNaN(numPrice) || numPrice <= 0) {
      return NextResponse.json({ success: false, error: 'Price per litre must be a positive number.' }, { status: 400 });
    }

    const priceRecord = await updateFuelPrice(fuel_type as FuelType, numPrice, effective_at);
    return NextResponse.json({ success: true, data: priceRecord }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to update fuel price.' }, { status: 500 });
  }
}

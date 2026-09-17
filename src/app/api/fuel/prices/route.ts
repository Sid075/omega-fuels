import { NextRequest, NextResponse } from 'next/server';
import { getLatestFuelPrices, getFuelPriceHistory, updateFuelPrice, getFuelPricesForDate } from '@/services/fuel.service';
import { getCurrentUser } from '@/services/auth.service';
import { FuelType } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');

    const latestPrices = await getLatestFuelPrices();
    const history = await getFuelPriceHistory();
    const forDate = dateParam ? await getFuelPricesForDate(dateParam) : latestPrices;

    return NextResponse.json({
      success: true,
      data: {
        latest: latestPrices,
        history,
        forDate,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to fetch fuel prices.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden. Admin privileges required to update fuel prices.' }, { status: 403 });
    }

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

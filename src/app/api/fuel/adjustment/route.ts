import { NextRequest, NextResponse } from 'next/server';
import { recordStockAdjustment } from '@/services/fuel.service';
import { getCurrentUser } from '@/services/auth.service';
import { FuelType } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const body = await req.json();
    const { fuel_type, quantity_litres, reason } = body;

    if (!fuel_type || (fuel_type !== 'PETROL' && fuel_type !== 'DIESEL')) {
      return NextResponse.json({ success: false, error: 'Valid fuel_type (PETROL or DIESEL) is required.' }, { status: 400 });
    }

    const litres = Number(quantity_litres);
    if (isNaN(litres) || litres === 0) {
      return NextResponse.json({ success: false, error: 'Valid non-zero quantity in litres is required.' }, { status: 400 });
    }

    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return NextResponse.json({ success: false, error: 'Mandatory audit reason is required for stock adjustments.' }, { status: 400 });
    }

    const record = await recordStockAdjustment(fuel_type as FuelType, litres, reason.trim());
    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to record stock adjustment.' }, { status: 500 });
  }
}

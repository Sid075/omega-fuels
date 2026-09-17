import { NextRequest, NextResponse } from 'next/server';
import { recordTestFuelUsage, recordGeneratorFuelUsage } from '@/services/fuel.service';
import { getCurrentUser } from '@/services/auth.service';
import { FuelType } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const body = await req.json();
    const { usage_type, fuel_type, quantity_litres, notes } = body;

    const litres = Number(quantity_litres);
    if (isNaN(litres) || litres <= 0) {
      return NextResponse.json({ success: false, error: 'Quantity in litres must be a positive number.' }, { status: 400 });
    }

    if (usage_type === 'TEST_USAGE') {
      if (!fuel_type || (fuel_type !== 'PETROL' && fuel_type !== 'DIESEL')) {
        return NextResponse.json({ success: false, error: 'Valid fuel_type (PETROL or DIESEL) is required for test usage.' }, { status: 400 });
      }
      const record = await recordTestFuelUsage(fuel_type as FuelType, litres, notes);
      return NextResponse.json({ success: true, data: record }, { status: 201 });
    } else if (usage_type === 'GENERATOR_USAGE') {
      const record = await recordGeneratorFuelUsage(litres, notes);
      return NextResponse.json({ success: true, data: record }, { status: 201 });
    } else {
      return NextResponse.json({ success: false, error: 'Valid usage_type (TEST_USAGE or GENERATOR_USAGE) is required.' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to record fuel usage.' }, { status: 500 });
  }
}

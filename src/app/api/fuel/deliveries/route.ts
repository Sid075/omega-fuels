import { NextRequest, NextResponse } from 'next/server';
import { recordFuelDelivery } from '@/services/fuel.service';
import { FuelType } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      fuel_type,
      tank_id,
      quantity_litres,
      buying_price_per_litre,
      supplier_name,
      invoice_number,
      tanker_truck_number,
      density_at_15c,
      delivery_date,
      notes,
    } = body;

    if (!fuel_type || (fuel_type !== 'PETROL' && fuel_type !== 'DIESEL')) {
      return NextResponse.json({ success: false, error: 'Valid fuel_type (PETROL or DIESEL) is required.' }, { status: 400 });
    }

    const litres = Number(quantity_litres);
    if (isNaN(litres) || litres <= 0) {
      return NextResponse.json({ success: false, error: 'Quantity in litres must be a positive number.' }, { status: 400 });
    }

    const record = await recordFuelDelivery({
      fuel_type: fuel_type as FuelType,
      tank_id,
      quantity_litres: litres,
      buying_price_per_litre: buying_price_per_litre ? Number(buying_price_per_litre) : undefined,
      supplier_name,
      invoice_number,
      tanker_truck_number,
      density_at_15c: density_at_15c ? Number(density_at_15c) : undefined,
      delivery_date,
      notes,
    });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to record fuel delivery.' }, { status: 500 });
  }
}

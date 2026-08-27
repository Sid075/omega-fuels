import { NextResponse } from 'next/server';
import { getShifts, createShift } from '@/services/shift.service';
import { getCurrentUser } from '@/services/auth.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || undefined;
    const employeeId = searchParams.get('employee_id') || undefined;

    const shifts = await getShifts(date, employeeId);
    return NextResponse.json({ success: true, data: shifts });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch shifts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.employee_id) {
      return NextResponse.json({ error: 'Employee selection is required' }, { status: 400 });
    }
    if (!body.shift_date) {
      return NextResponse.json({ error: 'Shift date is required' }, { status: 400 });
    }
    if (!body.shift_type) {
      return NextResponse.json({ error: 'Shift type is required' }, { status: 400 });
    }

    const newShift = await createShift({
      employee_id: body.employee_id,
      shift_date: body.shift_date,
      shift_type: body.shift_type,
      custom_shift_name: body.custom_shift_name,
      notes: body.notes,
      payments: body.payments || [],
      other_sales: body.other_sales || [],
    });

    return NextResponse.json({ success: true, data: newShift });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to create shift' }, { status: 500 });
  }
}

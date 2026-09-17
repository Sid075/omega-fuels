import { NextRequest, NextResponse } from 'next/server';
import { getCreditCustomers, saveCreditCustomer } from '@/services/credit.service';
import { getCurrentUser } from '@/services/auth.service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;

    const data = await getCreditCustomers(search);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to fetch credit customers.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, phone, notes, status } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Customer name is required.' }, { status: 400 });
    }

    const customer = await saveCreditCustomer({
      id,
      name: name.trim(),
      phone: phone?.trim() || undefined,
      notes: notes?.trim() || undefined,
      status: status || 'ACTIVE',
    });

    return NextResponse.json({ success: true, data: customer }, { status: id ? 200 : 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to save customer.' }, { status: 500 });
  }
}

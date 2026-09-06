import { NextResponse } from 'next/server';
import { recordOwnerCashCollection } from '@/services/cash.service';
import { getCurrentUser } from '@/services/auth.service';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const amount = parseFloat(body.amount);

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Valid collection amount greater than 0 is required' }, { status: 400 });
    }

    const record = await recordOwnerCashCollection({
      amount,
      notes: body.notes,
      collected_at: body.collected_at,
    });

    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to record owner collection' }, { status: 500 });
  }
}

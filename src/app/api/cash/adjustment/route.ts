import { NextResponse } from 'next/server';
import { recordCashAdjustment } from '@/services/cash.service';
import { getCurrentUser } from '@/services/auth.service';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const amount = parseFloat(body.amount);

    if (isNaN(amount) || amount === 0) {
      return NextResponse.json({ error: 'Adjustment amount cannot be zero' }, { status: 400 });
    }

    if (!body.reason || !body.reason.trim()) {
      return NextResponse.json({ error: 'Mandatory adjustment reason is required' }, { status: 400 });
    }

    const record = await recordCashAdjustment({
      amount,
      reason: body.reason,
    });

    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to record cash adjustment' }, { status: 500 });
  }
}

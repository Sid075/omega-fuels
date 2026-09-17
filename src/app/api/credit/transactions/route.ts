import { NextRequest, NextResponse } from 'next/server';
import { recordCreditTransaction } from '@/services/credit.service';
import { getCurrentUser } from '@/services/auth.service';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const body = await req.json();
    const { customer_id, transaction_type, amount, payment_method, description, transaction_at } = body;

    if (!customer_id) {
      return NextResponse.json({ success: false, error: 'Customer ID is required.' }, { status: 400 });
    }

    if (!transaction_type || (transaction_type !== 'CREDIT_GIVEN' && transaction_type !== 'PAYMENT_RECEIVED' && transaction_type !== 'ADJUSTMENT')) {
      return NextResponse.json({ success: false, error: 'Valid transaction_type is required.' }, { status: 400 });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Amount must be a positive number.' }, { status: 400 });
    }

    const tx = await recordCreditTransaction({
      customer_id,
      transaction_type,
      amount: numAmount,
      payment_method,
      description,
      transaction_at,
    });

    return NextResponse.json({ success: true, data: tx }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to record credit transaction.' }, { status: 500 });
  }
}

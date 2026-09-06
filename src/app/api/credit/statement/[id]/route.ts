import { NextRequest, NextResponse } from 'next/server';
import { getCustomerStatement } from '@/services/credit.service';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Customer ID is required.' }, { status: 400 });
    }

    const statement = await getCustomerStatement(id);
    return NextResponse.json({ success: true, data: statement });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to fetch customer statement.' }, { status: 500 });
  }
}

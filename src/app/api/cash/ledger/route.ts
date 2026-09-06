import { NextResponse } from 'next/server';
import { getCashLedger } from '@/services/cash.service';
import { CashLedgerEntryType } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || undefined;
    const type = (searchParams.get('type') as CashLedgerEntryType) || undefined;

    const data = await getCashLedger(date, type);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch cash ledger' }, { status: 500 });
  }
}

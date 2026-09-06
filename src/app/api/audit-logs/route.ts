import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogs } from '@/services/audit.service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const module = searchParams.get('module') || undefined;

    const data = await getAuditLogs(module);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to fetch audit logs.' }, { status: 500 });
  }
}

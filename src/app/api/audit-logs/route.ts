import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogs } from '@/services/audit.service';
import { getCurrentUser } from '@/services/auth.service';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden. Admin privileges required to view audit logs.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const module = searchParams.get('module') || undefined;

    const data = await getAuditLogs(module);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to fetch audit logs.' }, { status: 500 });
  }
}

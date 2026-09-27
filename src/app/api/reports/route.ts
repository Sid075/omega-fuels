import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/services/auth.service';
import { getReportData, getDateRangeForPeriod } from '@/services/report.service';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden. Admin privileges required to view reports & analytics.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'THIS_MONTH';
    const customStart = searchParams.get('startDate') || undefined;
    const customEnd = searchParams.get('endDate') || undefined;
    const scope = searchParams.get('scope') || 'ALL';

    const { startDate, endDate } = getDateRangeForPeriod(period, customStart, customEnd);

    const reportData = await getReportData({
      startDate,
      endDate,
      scope,
      period,
    });

    return NextResponse.json({ success: true, data: reportData });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to generate report analytics.' },
      { status: 500 }
    );
  }
}

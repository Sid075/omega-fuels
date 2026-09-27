import { NextRequest, NextResponse } from 'next/server';
import { generateMultiSheetExcelWorkbook, generateCsvExport } from '@/services/export.service';
import { getCurrentUser } from '@/services/auth.service';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden. Admin privileges required to export financial reports.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'xlsx';
    const scope = searchParams.get('scope') || 'ALL';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const dateStr = new Date().toISOString().split('T')[0];

    const exportOptions = {
      startDate,
      endDate,
      scope,
    };

    if (format.toLowerCase() === 'csv') {
      const csvString = await generateCsvExport(exportOptions);
      const filename = `OMEGA_FUELS_REPORT_${scope}_${startDate || dateStr}_${endDate || dateStr}.csv`;
      return new NextResponse(csvString, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    const buffer = await generateMultiSheetExcelWorkbook(exportOptions);
    const filename = `OMEGA_FUELS_REPORT_${scope}_${startDate || dateStr}_${endDate || dateStr}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to generate export file.' }, { status: 500 });
  }
}

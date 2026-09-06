import { NextRequest, NextResponse } from 'next/server';
import { generateMultiSheetExcelWorkbook } from '@/services/export.service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'xlsx';

    const buffer = await generateMultiSheetExcelWorkbook();
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `OMEGA_FUELS_MASTER_REPORT_${dateStr}.${format === 'csv' ? 'csv' : 'xlsx'}`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type':
          format === 'csv'
            ? 'text/csv; charset=utf-8'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to generate export file.' }, { status: 500 });
  }
}

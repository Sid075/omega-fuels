import { NextRequest, NextResponse } from 'next/server';
import { deleteExpense } from '@/services/expense.service';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Expense ID is required.' }, { status: 400 });
    }

    await deleteExpense(id);
    return NextResponse.json({ success: true, message: 'Expense record deleted.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to delete expense.' }, { status: 500 });
  }
}

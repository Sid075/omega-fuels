import { NextRequest, NextResponse } from 'next/server';
import { deleteExpense } from '@/services/expense.service';
import { getCurrentUser } from '@/services/auth.service';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden. Admin privileges required to delete expense records.' }, { status: 403 });
    }

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

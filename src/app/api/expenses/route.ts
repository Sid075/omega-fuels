import { NextRequest, NextResponse } from 'next/server';
import { getExpenses, recordExpense } from '@/services/expense.service';
import { getCurrentUser } from '@/services/auth.service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const data = await getExpenses(category, startDate, endDate);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to fetch expenses.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const body = await req.json();
    const { category, description, amount, expense_date } = body;

    if (!category || typeof category !== 'string' || !category.trim()) {
      return NextResponse.json({ success: false, error: 'Expense category is required.' }, { status: 400 });
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
      return NextResponse.json({ success: false, error: 'Expense description is required.' }, { status: 400 });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Expense amount must be a positive number.' }, { status: 400 });
    }

    const record = await recordExpense({
      category: category.trim(),
      description: description.trim(),
      amount: numAmount,
      expense_date,
    });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to record expense.' }, { status: 500 });
  }
}

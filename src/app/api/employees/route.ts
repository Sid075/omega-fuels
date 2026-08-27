import { NextResponse } from 'next/server';
import { getEmployees, createEmployee } from '@/services/employee.service';
import { getCurrentUser } from '@/services/auth.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as any;

    const employees = await getEmployees(status || undefined);
    return NextResponse.json({ success: true, data: employees });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch employees' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Employee name is required' }, { status: 400 });
    }

    const employee = await createEmployee({
      name: body.name,
      phone: body.phone,
      notes: body.notes,
      status: body.status || 'ACTIVE',
    });

    return NextResponse.json({ success: true, data: employee });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to create employee' }, { status: 500 });
  }
}

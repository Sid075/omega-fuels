import { NextResponse } from 'next/server';
import { updateEmployee, getEmployeeById } from '@/services/employee.service';
import { getCurrentUser } from '@/services/auth.service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const employee = await getEmployeeById(id);
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: employee });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch employee' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const updated = await updateEmployee(id, {
      name: body.name,
      phone: body.phone,
      notes: body.notes,
      status: body.status,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update employee' }, { status: 500 });
  }
}

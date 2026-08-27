import { createClient } from '@/lib/supabase/server';
import { Employee, EmployeeStatus } from '@/types';
import { logAuditAction } from './audit.service';
import { getCurrentUser } from './auth.service';

// In-memory fallback persistent store for local/demo environment
let localEmployees: Employee[] = [
  {
    id: 'emp_01',
    name: 'Ramesh Kumar',
    phone: '+91 98765 43210',
    status: 'ACTIVE',
    notes: 'Senior Nozzle Operator - Dispenser 1 & 2 (Petrol / Diesel)',
    created_by: 'usr_admin_001',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'emp_02',
    name: 'Suresh Verma',
    phone: '+91 98765 43211',
    status: 'ACTIVE',
    notes: 'Shift Attendant - Dispenser 3 & 4 (High Speed Diesel)',
    created_by: 'usr_admin_001',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'emp_03',
    name: 'Vikram Singh',
    phone: '+91 98765 43212',
    status: 'ACTIVE',
    notes: 'Night Shift Attendant - All Dispensers',
    created_by: 'usr_admin_001',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export async function getEmployees(statusFilter?: EmployeeStatus): Promise<Employee[]> {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    try {
      const supabase = await createClient();
      let query = supabase.from('employees').select('*').order('created_at', { ascending: true });
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }
      const { data, error } = await query;
      if (!error && data) {
        return data as Employee[];
      }
    } catch {
      // Fallback to local store
    }
  }

  if (statusFilter) {
    return localEmployees.filter((e) => e.status === statusFilter);
  }
  return [...localEmployees];
}

export async function getEmployeeById(id: string): Promise<Employee | null> {
  const employees = await getEmployees();
  return employees.find((e) => e.id === id) || null;
}

export interface CreateEmployeeInput {
  name: string;
  phone?: string;
  notes?: string;
  status?: EmployeeStatus;
}

export async function createEmployee(input: CreateEmployeeInput): Promise<Employee> {
  const currentUser = await getCurrentUser();
  const userId = currentUser?.id || 'usr_manager_001';
  const userRole = currentUser?.role || 'MANAGER';

  const newEmp: Employee = {
    id: `emp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: input.name.trim(),
    phone: input.phone?.trim() || null,
    notes: input.notes?.trim() || null,
    status: input.status || 'ACTIVE',
    created_by: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.from('employees').insert(newEmp).select().single();
      if (!error && data) {
        await logAuditAction({
          actorUserId: userId,
          actorRole: userRole,
          action: 'EMPLOYEE_CREATED',
          module: 'EMPLOYEES',
          entityType: 'EMPLOYEE',
          entityId: data.id,
          newValues: data,
          reason: `Added new employee: ${data.name}`,
        });
        return data as Employee;
      }
    } catch {
      // Fallback
    }
  }

  localEmployees.push(newEmp);
  await logAuditAction({
    actorUserId: userId,
    actorRole: userRole,
    action: 'EMPLOYEE_CREATED',
    module: 'EMPLOYEES',
    entityType: 'EMPLOYEE',
    entityId: newEmp.id,
    newValues: newEmp,
    reason: `Added new employee: ${newEmp.name}`,
  });

  return newEmp;
}

export interface UpdateEmployeeInput {
  name?: string;
  phone?: string;
  notes?: string;
  status?: EmployeeStatus;
}

export async function updateEmployee(id: string, input: UpdateEmployeeInput): Promise<Employee | null> {
  const currentUser = await getCurrentUser();
  const userId = currentUser?.id || 'usr_manager_001';
  const userRole = currentUser?.role || 'MANAGER';

  const existing = await getEmployeeById(id);
  if (!existing) return null;

  const updated: Employee = {
    ...existing,
    ...(input.name !== undefined && { name: input.name.trim() }),
    ...(input.phone !== undefined && { phone: input.phone.trim() || null }),
    ...(input.notes !== undefined && { notes: input.notes.trim() || null }),
    ...(input.status !== undefined && { status: input.status }),
    updated_at: new Date().toISOString(),
  };

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('employees')
        .update({
          name: updated.name,
          phone: updated.phone,
          notes: updated.notes,
          status: updated.status,
          updated_at: updated.updated_at,
        })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        await logAuditAction({
          actorUserId: userId,
          actorRole: userRole,
          action: 'EMPLOYEE_UPDATED',
          module: 'EMPLOYEES',
          entityType: 'EMPLOYEE',
          entityId: id,
          oldValues: existing,
          newValues: data,
          reason: `Updated employee: ${data.name} (Status: ${data.status})`,
        });
        return data as Employee;
      }
    } catch {
      // Fallback
    }
  }

  const idx = localEmployees.findIndex((e) => e.id === id);
  if (idx !== -1) {
    localEmployees[idx] = updated;
  }

  await logAuditAction({
    actorUserId: userId,
    actorRole: userRole,
    action: 'EMPLOYEE_UPDATED',
    module: 'EMPLOYEES',
    entityType: 'EMPLOYEE',
    entityId: id,
    oldValues: existing,
    newValues: updated,
    reason: `Updated employee: ${updated.name} (Status: ${updated.status})`,
  });

  return updated;
}

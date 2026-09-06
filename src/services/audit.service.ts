import { createAdminClient } from '@/lib/supabase/admin';
import { UserRole, AuditLog } from '@/types';

export interface LogAuditParams {
  actorUserId?: string | null;
  actorRole: UserRole;
  action: string;
  module: string;
  entityType: string;
  entityId?: string | null;
  oldValues?: Record<string, any> | null;
  newValues?: Record<string, any> | null;
  reason?: string | null;
}

let localAuditLogs: AuditLog[] = [
  {
    id: 'audit_01',
    actor_user_id: 'usr_admin_001',
    actor_name: 'Station Admin',
    actor_role: 'ADMIN',
    action: 'SYSTEM_INITIALIZATION',
    module: 'SYSTEM',
    entity_type: 'DATABASE',
    reason: 'Initial database calibration & fuel tank opening stock calibration',
    created_at: new Date(Date.now() - 7 * 86400 * 1000).toISOString(),
  },
  {
    id: 'audit_02',
    actor_user_id: 'usr_manager_001',
    actor_name: 'Station Manager',
    actor_role: 'MANAGER',
    action: 'OWNER_CASH_COLLECTED',
    module: 'CASH_LEDGER',
    entity_type: 'OWNER_COLLECTION',
    entity_id: 'occ_01',
    reason: 'Owner collected ₹25,000 for mid-day bank deposit',
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 'audit_03',
    actor_user_id: 'usr_manager_001',
    actor_name: 'Station Manager',
    actor_role: 'MANAGER',
    action: 'FUEL_PRICE_UPDATED',
    module: 'FUEL_INVENTORY',
    entity_type: 'FUEL_PRICE',
    reason: 'Petrol (MS) retail rate updated to ₹102.50/L',
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
  },
];

export async function logAuditAction(params: LogAuditParams) {
  const newLog: AuditLog = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    actor_user_id: params.actorUserId || null,
    actor_name: params.actorRole === 'ADMIN' ? 'Station Admin' : 'Station Manager',
    actor_role: params.actorRole,
    action: params.action,
    module: params.module,
    entity_type: params.entityType,
    entity_id: params.entityId || null,
    old_values: params.oldValues || null,
    new_values: params.newValues || null,
    reason: params.reason || null,
    created_at: new Date().toISOString(),
  };

  localAuditLogs.unshift(newLog);

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    try {
      const supabase = createAdminClient();
      await supabase.from('audit_logs').insert({
        actor_user_id: params.actorUserId || null,
        actor_role: params.actorRole,
        action: params.action,
        module: params.module,
        entity_type: params.entityType,
        entity_id: params.entityId || null,
        old_values: params.oldValues || null,
        new_values: params.newValues || null,
        reason: params.reason || null,
      });
    } catch (error) {
      console.error('[Audit Log Failure]:', error);
    }
  }
}

export async function getAuditLogs(moduleFilter?: string): Promise<AuditLog[]> {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    try {
      const supabase = createAdminClient();
      let query = supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
      if (moduleFilter) query = query.eq('module', moduleFilter);
      const { data, error } = await query;
      if (!error && data) return data;
    } catch {
      // Fallback
    }
  }

  let filtered = [...localAuditLogs];
  if (moduleFilter) filtered = filtered.filter((l) => l.module === moduleFilter);
  return filtered;
}

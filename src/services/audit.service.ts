import { createAdminClient } from '@/lib/supabase/admin';
import { UserRole } from '@/types';

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

export async function logAuditAction(params: LogAuditParams) {
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

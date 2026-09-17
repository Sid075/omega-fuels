import { createClient } from '@/lib/supabase/server';
import { UserProfile, UserRole } from '@/types';
import { cookies } from 'next/headers';

export const DEMO_ACCOUNTS = {
  admin: {
    id: 'usr_admin_001',
    name: 'Admin Owner',
    email: 'admin@omegafuels.com',
    role: 'ADMIN' as UserRole,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  manager: {
    id: 'usr_manager_001',
    name: 'Station Manager',
    email: 'manager@omegafuels.com',
    role: 'MANAGER' as UserRole,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

export async function getCurrentUser(): Promise<UserProfile | null> {
  let cookieStore: any;
  try {
    cookieStore = await cookies();
    const demoRole = cookieStore.get('omega_demo_role')?.value;

    if (demoRole === 'ADMIN') {
      return DEMO_ACCOUNTS.admin;
    }
    if (demoRole === 'MANAGER') {
      return DEMO_ACCOUNTS.manager;
    }
  } catch {
    // Outside request context (e.g. background job or test runner) -> fallback to manager
    return DEMO_ACCOUNTS.manager;
  }

  // If Supabase environment is configured, attempt Supabase Auth check
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        return profile as UserProfile;
      }
    } catch {
      return null;
    }
  }

  // Default to Manager for local review if demo cookie exists
  if (cookieStore) {
    const demoUser = cookieStore.get('omega_user_session')?.value;
    if (demoUser) {
      try {
        return JSON.parse(demoUser);
      } catch {
        return null;
      }
    }
  }

  return null;
}

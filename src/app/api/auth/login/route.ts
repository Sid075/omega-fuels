import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { DEMO_ACCOUNTS } from '@/services/auth.service';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const cookieStore = await cookies();

    // 1. Check Demo Accounts First (Zero-friction local dev and evaluation)
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === 'admin@omegafuels.com' && password === 'Admin@12345') {
      cookieStore.set('omega_demo_role', 'ADMIN', { path: '/', httpOnly: true, sameSite: 'lax' });
      cookieStore.set('omega_user_session', JSON.stringify(DEMO_ACCOUNTS.admin), { path: '/', httpOnly: true, sameSite: 'lax' });

      return NextResponse.json({
        success: true,
        user: DEMO_ACCOUNTS.admin,
        redirectTo: '/admin/dashboard',
      });
    }

    if (cleanEmail === 'manager@omegafuels.com' && password === 'Manager@12345') {
      cookieStore.set('omega_demo_role', 'MANAGER', { path: '/', httpOnly: true, sameSite: 'lax' });
      cookieStore.set('omega_user_session', JSON.stringify(DEMO_ACCOUNTS.manager), { path: '/', httpOnly: true, sameSite: 'lax' });

      return NextResponse.json({
        success: true,
        user: DEMO_ACCOUNTS.manager,
        redirectTo: '/dashboard',
      });
    }

    // 2. Try Supabase Auth if configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        const role = profile?.role || 'MANAGER';
        return NextResponse.json({
          success: true,
          user: profile || { id: data.user.id, email: data.user.email, role },
          redirectTo: role === 'ADMIN' ? '/admin/dashboard' : '/dashboard',
        });
      }
    }

    return NextResponse.json(
      { error: 'Invalid credentials. Use demo credentials or verify Supabase setup.' },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Login failed' }, { status: 500 });
  }
}

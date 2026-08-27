import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  const cookieStore = await cookies();

  // Clear demo cookies
  cookieStore.delete('omega_demo_role');
  cookieStore.delete('omega_user_session');

  // Clear Supabase session if configured
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore
    }
  }

  return NextResponse.json({ success: true });
}

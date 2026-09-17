import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets and API auth exceptions
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const demoRole = request.cookies.get('omega_demo_role')?.value;
  const userSession = request.cookies.get('omega_user_session')?.value;

  let userRole = demoRole;
  if (!userRole && userSession) {
    try {
      const parsed = JSON.parse(userSession);
      userRole = parsed?.role;
    } catch {
      // Invalid session cookie
    }
  }

  const isAuth = !!(userRole || userSession);

  // 1. Unauthenticated requests
  if (!isAuth && pathname !== '/login') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Authenticated users visiting /login -> redirect to dashboard
  if (isAuth && pathname === '/login') {
    const target = userRole === 'ADMIN' ? '/admin/dashboard' : '/dashboard';
    return NextResponse.redirect(new URL(target, request.url));
  }

  // 3. Non-admin trying to access /admin/* -> redirect to /dashboard
  if (isAuth && pathname.startsWith('/admin') && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 4. Root / -> redirect to appropriate dashboard
  if (pathname === '/') {
    if (isAuth) {
      const target = userRole === 'ADMIN' ? '/admin/dashboard' : '/dashboard';
      return NextResponse.redirect(new URL(target, request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

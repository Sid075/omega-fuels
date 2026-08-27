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
  const isAuth = !!(demoRole || userSession);

  // 1. Unauthenticated users trying to access protected routes -> /login
  if (!isAuth && pathname !== '/login') {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Authenticated users visiting /login -> redirect to dashboard
  if (isAuth && pathname === '/login') {
    const target = demoRole === 'ADMIN' ? '/admin/dashboard' : '/dashboard';
    return NextResponse.redirect(new URL(target, request.url));
  }

  // 3. Manager trying to access /admin/* -> redirect to /dashboard
  if (isAuth && demoRole === 'MANAGER' && pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 4. Root / -> redirect to appropriate dashboard
  if (pathname === '/') {
    if (isAuth) {
      const target = demoRole === 'ADMIN' ? '/admin/dashboard' : '/dashboard';
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

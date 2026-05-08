import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth-edge';

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip static assets and NextAuth API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next();
  }

  // Use auth() from auth-edge — consistent with the rest of the app, no cookie name drift
  let session = null;
  try {
    session = await auth();
  } catch (err) {
    console.warn('[middleware] Auth session error (likely old cookie)', err);
  }
  const isAuth = !!session;
  const role = session?.user?.role as string | undefined;

  // Unauthenticated → redirect to login (except public pages)
  const publicPaths = ['/', '/login', '/register', '/api/setup-superadmin'];
  if (!isAuth && !publicPaths.includes(pathname)) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Already authenticated on login → redirect to role portal
  if (isAuth && pathname === '/login') {
    const dest = role === 'superadmin'
      ? '/superadmin/dashboard'
      : role === 'admin'
        ? '/admin/dashboard'
        : role === 'teacher'
          ? '/teacher/dashboard'
          : '/student/dashboard';
    return NextResponse.redirect(new URL(dest, req.url));
  }

  // Role-based access guards
  if (isAuth) {
    if (pathname.startsWith('/superadmin') && role !== 'superadmin') return NextResponse.redirect(new URL('/', req.url));
    if (pathname.startsWith('/admin') && role !== 'admin') return NextResponse.redirect(new URL('/', req.url));
    if (pathname.startsWith('/teacher') && role !== 'teacher') return NextResponse.redirect(new URL('/', req.url));
    if (pathname.startsWith('/student') && role !== 'student') return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

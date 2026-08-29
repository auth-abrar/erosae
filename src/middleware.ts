import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Admin & ERP Routes Protection (except login)
  if ((pathname.startsWith('/admin') || pathname.startsWith('/erp')) && pathname !== '/admin/login' && pathname !== '/erp/login') {
    const adminCookie = request.cookies.get('erosae_admin_session')?.value;
    if (!adminCookie) {
      const loginUrl = new URL(pathname.startsWith('/erp') ? '/erp/login' : '/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Customer Account Portal Protection
  if (pathname.startsWith('/account')) {
    const userCookie = request.cookies.get('erosae_user_session')?.value;
    if (!userCookie) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Security Headers
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), browsing-topics=()'
  );

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/erp/:path*', '/account/:path*'],
};

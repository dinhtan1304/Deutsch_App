import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Server-side middleware to protect admin routes.
 *
 * Because the JWT access token is stored in memory (not a cookie),
 * we cannot fully validate it at the edge. Instead we check for the
 * presence of the httpOnly refresh-token cookie as a proxy signal
 * that the user has an active session.
 *
 * The actual admin role check is still enforced by:
 *   1. The client-side guard in admin/layout.tsx
 *   2. The backend @Roles('admin') guard on every admin API endpoint
 *
 * This middleware adds an extra layer: unauthenticated visitors
 * (no cookie at all) are redirected immediately at the edge,
 * before any client JS loads.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes
  if (pathname.startsWith('/admin')) {
    const refreshToken = request.cookies.get('refreshToken');

    if (!refreshToken?.value) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};

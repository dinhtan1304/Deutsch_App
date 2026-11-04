import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { isBlockedBot } from './lib/seo/bots';

const handleI18n = createMiddleware(routing);

const WORD_PAGE = /^(?:\/(en|de))?\/words\/[^/]+\/[^/]+\/?$/;

export default function proxy(request: NextRequest) {
  // Refuse before anything renders, so a blocked crawler costs one regex test.
  if (isBlockedBot(request.headers.get('user-agent'))) {
    return new NextResponse(null, { status: 403 });
  }

  // Word pages skip next-intl: its NEXT_LOCALE cookie would stop the CDN caching
  // them, and its Link header would advertise the en/de copies to every crawler.
  const wordPage = WORD_PAGE.exec(request.nextUrl.pathname);
  if (wordPage) {
    if (wordPage[1]) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = `/${routing.defaultLocale}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return handleI18n(request);
}

export const config = {
  // Skip API routes, Next internals, the share image (which has no dot, and 404s
  // once rewritten under a locale), and any path containing a dot (static assets
  // like /favicon.ico, /logo-64.png, /robots.txt).
  matcher: ['/((?!api|_next|_vercel|opengraph-image|.*\\..*).*)'],
};

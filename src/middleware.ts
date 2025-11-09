import createMiddleware from 'next-intl/middleware';
import type {NextRequest} from 'next/server';

const locales = ['zh', 'en', 'ja'];
const defaultLocale = 'zh';

// Create the next-intl middleware with 'as-needed' prefix
// This means default locale (zh) won't appear in URL
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed' // Show locale in URL only when needed
});

export function middleware(request: NextRequest) {
  // Skip middleware for API routes and static files
  if (
    request.nextUrl.pathname.startsWith('/api/') ||
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return;
  }

  // Let next-intl middleware handle all routing logic
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except static files and API routes
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};
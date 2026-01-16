import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { allowedOrigins } from '@/lib/allowedOrigins';

/**
 * APIs that REQUIRE authentication
 */
export const PROTECTED_PATHS: string[] = [
  '/api/admin/*',
];

/**
 * APIs that DO NOT require authentication
 * (even if they fall under protected paths)
 */
export const UNPROTECTED_PATHS: string[] = [
  '/api/admin/marg',
  '/api/admin/marg/cron',
];

/**
 * Helper to match exact and wildcard paths
 */
function matchPath(pathname: string, paths: string[]) {
  return paths.some((p) => {
    if (p.endsWith('/*')) {
      const prefix = p.slice(0, -1); // remove *
      return pathname.startsWith(prefix);
    }
    return pathname === p;
  });
}

export async function proxy(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  const pathname = request.nextUrl.pathname;

  const response = NextResponse.next();

  /* -------------------- CORS -------------------- */

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Vary', 'Origin');
  }

  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET,POST,PUT,DELETE,OPTIONS'
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, accessToken, refreshToken'
  );

  // Preflight request
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: response.headers,
    });
  }

  /* -------------------- AUTH LOGIC -------------------- */

  const isProtected = matchPath(pathname, PROTECTED_PATHS);
  const isUnprotected = matchPath(pathname, UNPROTECTED_PATHS);

  const shouldProtect = isProtected && !isUnprotected;

  if (shouldProtect) {
    const verifyUrl = `${request.nextUrl.origin}/api/internal/verify`;

    // Forward original headers (including cookies)
    const forwardedHeaders = new Headers();
    for (const [key, value] of request.headers.entries()) {
      if (value !== null) forwardedHeaders.set(key, value);
    }

    // Forward body (safe for GET/POST)
    let body: BodyInit | undefined;
    try {
      body = await request.text();
    } catch {
      body = undefined;
    }

    const verifyResp = await fetch(verifyUrl, {
      method: 'POST',
      headers: forwardedHeaders,
      body,
    });

    if (!verifyResp.ok) {
      const text = await verifyResp.text();
      return new NextResponse(text, {
        status: verifyResp.status,
        headers: verifyResp.headers,
      });
    }
  }

  return response;
}

/**
 * Apply to all API routes
 */
export const config = {
  matcher: ['/api/:path*'],
};

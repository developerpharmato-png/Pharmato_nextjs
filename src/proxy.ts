import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { allowedOrigins } from '@/lib/allowedOrigins';

// Proxy entry used by Next.js in place of middleware. This applies CORS headers
// for API routes except when explicitly skipped (e.g. /api/customer/*).
export function proxy(request: NextRequest) {
    const origin = request.headers.get('origin') || '';
    const pathname = request.nextUrl.pathname;

    // NOTE: we no longer skip `/api/customer` routes — allow CORS headers
    // to be injected for customer APIs as well (so web clients from allowed
    // origins can call login/verify endpoints). If you want to restrict
    // access, remove the origin from `src/lib/allowedOrigins.ts`.

    const response = NextResponse.next();

    // Only set CORS headers if origin is in the allowed list
    if (origin && allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Vary', 'Origin');
        // If you need cookies/credentials across origins, enable the next line and
        // ensure clients use `fetch(..., credentials: 'include')` and allowedOrigins
        // are exact origins (not '*').
        // response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight OPTIONS requests
    if (request.method === 'OPTIONS') {
        return new NextResponse(null, { status: 204, headers: response.headers });
    }

    return response;
}

export const config = {
    matcher: ['/api/:path*'],
};

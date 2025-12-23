import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { allowedOrigins } from '@/lib/allowedOrigins';

// Proxy entry used by Next.js in place of middleware. This applies CORS headers
// for API routes except when explicitly skipped (e.g. /api/customer/*).


export const PROTECTED_PATHS: string[] = ['/api/admin/*'];

export async function proxy(request: NextRequest) {
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
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, accessToken, refreshToken , accessToken');

    // Handle preflight OPTIONS requests
    if (request.method === 'OPTIONS') {
        return new NextResponse(null, { status: 204, headers: response.headers });
    }

    // Decide whether to protect this path
    const shouldProtect = PROTECTED_PATHS.some((p) => {
        if (p.endsWith('/*')) {
            const prefix = p.slice(0, -1); // keep trailing '/'
            return pathname.startsWith(prefix);
        }
        return pathname === p;
    });

    if (shouldProtect) {
        // Call internal verify route which can safely use DB/jwt libs
        const verifyUrl = `${request.nextUrl.origin}/api/internal/verify`;

        // Forward the original request headers and body to the internal verify
        // endpoint so it receives the request "as-is".
        const forwardedHeaders = new Headers();
        for (const [k, v] of request.headers) {
            // copy all headers (including cookie)
            if (v !== null) forwardedHeaders.set(k, v);
        }

        // Read original body (works for text/json; empty string for GET)
        let body: BodyInit | undefined;
        try {
            body = await request.text();
        } catch {
            body = undefined;
        }

        const resp = await fetch(verifyUrl, { method: 'POST', headers: forwardedHeaders, body });
        if (!resp.ok) {
            const text = await resp.text();
            // Forward verification failure as-is (don't inject headers)
            return new NextResponse(text, { status: resp.status, headers: resp.headers });
        }
    }

    return response;
}

export const config = {
    matcher: ['/api/:path*'],
};

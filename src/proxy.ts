import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { allowedOrigins } from '@/lib/allowedOrigins';

export function proxy(request: NextRequest) {
    const origin = request.headers.get('origin');
    const response = NextResponse.next();

    if (origin && allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Vary', 'Origin');
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

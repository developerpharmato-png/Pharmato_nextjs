import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Admin from '@/models/Admin';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export async function authorize(request: NextRequest) {
    // Prefer camelCase headers `accessToken` and `refreshToken`
    const accessTokenHeader = request.headers.get('accessToken');

    // Read refresh token from header or cookie (if provided)
    const refreshFromHeader = request.headers.get('refreshToken');

    // Prefer header value; if not present, fallback to cookie with same name
    let token: string | undefined = accessTokenHeader || undefined;
    if (!token) {
        try {
            token = (request as any).cookies?.get?.('accessToken')?.value;
        } catch {
            token = undefined;
        }
    }

    let refreshTokenValue: string | undefined = refreshFromHeader || undefined;
    if (!refreshTokenValue) {
        try {
            refreshTokenValue = (request as any).cookies?.get?.('refreshToken')?.value || (request as any).cookies?.get?.('refresh_token')?.value;
        } catch {
            refreshTokenValue = undefined;
        }
    }

    if (!token) {
        return NextResponse.json({ success: false, error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    // Inline JWT verification (no external helper)
    try {
        const payload = jwt.verify(token as string, JWT_SECRET as string) as any;

        // console.log('###########payload##########', payload);

        // If token role is customer, ensure user exists in DB and refreshToken/session are valid
        if (payload && payload.role === 'customer') {
            await connectDB();
            const dbUser = await User.findById(payload.userId).lean() as any;
            if (!dbUser) {
                return NextResponse.json({ success: false, error: 'Unauthorized: User not found' }, { status: 401 });
            }
            // If DB cleared session identifiers (sessionId/sessionToken/refreshToken) treat as invalidated
            if (!dbUser.sessionId && !dbUser.refreshToken && !dbUser.sessionToken) {
                return NextResponse.json({ success: false, error: 'Auth error: Session invalidated' }, { status: 401 });
            }

            // Prefer sessionId check (invalidates old access tokens immediately)
            if (dbUser.sessionId) {
                if (!payload.sessionId || payload.sessionId !== dbUser.sessionId) {
                    return NextResponse.json({ success: false, error: 'Auth error: Session expired or logged in elsewhere' }, { status: 401 });
                }
            } else if (dbUser.refreshToken) {
                // Fallback: if DB has a refreshToken, ensure provided refresh token matches
                if (!refreshTokenValue || dbUser.refreshToken !== refreshTokenValue) {
                    return NextResponse.json({ success: false, error: 'Auth error: Session expired or logged in elsewhere' }, { status: 401 });
                }
            } else if (dbUser.sessionToken) {
                // Fallback to matching sessionToken (access token) if present
                if (token !== dbUser.sessionToken) {
                    return NextResponse.json({ success: false, error: 'Auth error: Session expired or logged in elsewhere' }, { status: 401 });
                }
            }
        } else if (payload && payload.role === 'admin') {
            // Verify admin in DB and session
            await connectDB();
            const dbAdmin = await Admin.findById(payload.adminId).lean() as any;
            if (!dbAdmin) {
                return NextResponse.json({ success: false, error: 'Unauthorized: Admin not found' }, { status: 401 });
            }
            // If DB cleared session identifiers (sessionId/sessionToken/refreshToken) treat as invalidated
            if (!dbAdmin.sessionId && !dbAdmin.refreshToken && !dbAdmin.sessionToken) {
                return NextResponse.json({ success: false, error: 'Auth error: Session invalidated' }, { status: 401 });
            }

            // Prefer sessionId check (invalidates old access tokens immediately)
            if (dbAdmin.sessionId) {
                if (!payload.sessionId || payload.sessionId !== dbAdmin.sessionId) {
                    return NextResponse.json({ success: false, error: 'Auth error: Session expired or logged in elsewhere' }, { status: 401 });
                }
            } else if (dbAdmin.refreshToken) {
                // If DB has a refreshToken, ensure provided refresh token matches
                if (!refreshTokenValue || dbAdmin.refreshToken !== refreshTokenValue) {
                    return NextResponse.json({ success: false, error: 'Auth error: Session expired or logged in elsewhere' }, { status: 401 });
                }
            } else if (dbAdmin.sessionToken) {
                // Fallback to matching sessionToken (access token) if present
                if (token !== dbAdmin.sessionToken) {
                    return NextResponse.json({ success: false, error: 'Auth error: Session expired or logged in elsewhere' }, { status: 401 });
                }
            }
            // Optional: check admin active flags
            if (dbAdmin.isActive === false) {
                return NextResponse.json({ success: false, error: 'Account disabled' }, { status: 401 });
            }
        }

        // ###########payload########## {
        //     userId: '692fd7b1809907e87c5304c8',
        //         mobile: '7470376772',
        //             role: 'customer',
        //                 iat: 1766137871,
        //                     exp: 1766224271
        // }

        return null; // authorized
    } catch (err: any) {
        if (err && err.name === 'TokenExpiredError') {
            return NextResponse.json({ success: false, error: 'Unauthorized: Token expired' }, { status: 401 });
        }
        return NextResponse.json({ success: false, error: 'Unauthorized: Invalid token' }, { status: 401 });
    }
}

export default authorize;

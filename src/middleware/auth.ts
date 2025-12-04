import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export async function authMiddleware(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ success: false, error: 'Unauthorized: No token provided' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        // Attach user info to request (for use in API handlers)
        if (typeof payload === 'object' && payload !== null && 'userId' in payload && 'role' in payload) {
            (request as any).user = {
                userId: (payload as any).userId,
                role: (payload as any).role,
            };
            // Continue to API handler
        } else {
            // Handle invalid payload
            return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 });
        }
        return null;
    } catch (err) {
        return NextResponse.json({ success: false, error: 'Unauthorized: Invalid token' }, { status: 401 });
    }
}

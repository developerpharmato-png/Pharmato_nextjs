import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import User from '@/models/User';
import { verifyJwt } from '@/utils/jwt';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token =
      request.cookies.get('accessToken')?.value ||
      request.cookies.get('access_token')?.value ||
      (request.headers && request.headers.get && request.headers.get('authorization')?.replace('Bearer ', '')) ||
      null;

    if (!token) {
      // Nothing to clear on server, still clear cookies on client
      const resp = NextResponse.json({ success: true, message: 'Logged out' });
      resp.cookies.set('accessToken', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
      resp.cookies.set('refreshToken', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
      resp.cookies.set('access_token', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
      resp.cookies.set('refresh_token', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
      return resp;
    }

    const decoded: any = verifyJwt(token);
    // Clear session fields for admin or user if token valid
    if (decoded && (decoded.adminId || decoded._id) && decoded.role === 'admin') {
      const adminId = decoded.adminId || decoded._id;
      await Admin.findByIdAndUpdate(adminId, { refreshToken: null, sessionId: null, sessionToken: null , deviceToken: null});
    } else if (decoded && (decoded.userId || decoded._id) && decoded.role === 'customer') {
      const userId = decoded.userId || decoded._id;
      await User.findByIdAndUpdate(userId, { refreshToken: null, sessionId: null, sessionToken: null });
    }

    const response = NextResponse.json({ success: true, message: 'Logged out' });
    // Clear cookies on client
    response.cookies.set('accessToken', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
    response.cookies.set('refreshToken', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
    response.cookies.set('access_token', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
    response.cookies.set('refresh_token', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
    return response;
  } catch (err) {
    console.error('Logout error:', err);
    return NextResponse.json({ success: false, error: 'Logout failed' }, { status: 500 });
  }
}


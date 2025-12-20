import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { verifyJwt } from "@/utils/jwt";
import Admin from '@/models/Admin';

export async function requireAdminAuth(request: any) {
  // Support different cookie/header names and payload shapes
  const token =
    request.cookies.get('access_token')?.value ||
    request.cookies.get('accessToken')?.value ||
    (request.headers && request.headers.get && request.headers.get('authorization')?.replace('Bearer ', '')) ||
    null;

  if (!token) {
    return NextResponse.json({ success: false, error: 'Auth error: No token' }, { status: 401 });
  }

  const decoded: any = verifyJwt(token);
  if (!decoded) {
    return NextResponse.json({ success: false, error: 'Auth error: Invalid token' }, { status: 401 });
  }

  // Tokens may contain `_id` or `adminId` depending on where they were issued
  const adminId = decoded._id || decoded.adminId;
  if (!adminId) {
    return NextResponse.json({ success: false, error: 'Auth error: Invalid token payload' }, { status: 401 });
  }

  const admin = await Admin.findById(adminId).lean() as any;
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Auth error: Admin not found' }, { status: 401 });
  }

  // If DB stores the full session token, compare directly.
  if (admin.sessionToken && admin.sessionToken === token) {
    return admin;
  }

  // Fallback: if DB doesn't store sessionToken but stores sessionId,
  // allow if the token's payload contains matching sessionId.
  if (admin.sessionId && decoded && decoded.sessionId && admin.sessionId === decoded.sessionId) {
    return admin;
  }

  return NextResponse.json({ success: false, error: 'Auth error: Session expired or logged in elsewhere' }, { status: 401 });
}

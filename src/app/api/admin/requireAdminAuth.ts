import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { verifyJwt } from "@/utils/jwt";
import Admin from '@/models/Admin';

export async function requireAdminAuth(request: any) {
  const token = request.cookies.get('access_token')?.value;
  if (!token) {
    return NextResponse.json({ success: false, error: 'Auth error: No token' }, { status: 401 });
  }
  const decoded: any = verifyJwt(token);
  if (!decoded || !decoded._id) {
    return NextResponse.json({ success: false, error: 'Auth error: Invalid token' }, { status: 401 });
  }
  const admin = await Admin.findById(decoded._id).lean() as any;
  if (!admin || admin.sessionToken !== token) {
    return NextResponse.json({ success: false, error: 'Auth error: Session expired or logged in elsewhere' }, { status: 401 });
  }
  return admin;
}

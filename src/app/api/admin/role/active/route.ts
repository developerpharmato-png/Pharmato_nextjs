import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Role from '@/models/Role';

export async function GET() {
  await dbConnect();
  const roles = await Role.find({ isActive: true, name: { $ne: 'SuperAdmin' } }).lean();
  return NextResponse.json({ success: true, data: roles });
}

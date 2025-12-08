import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Role from '@/models/Role';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await context.params;
  if (!id) return NextResponse.json({ success: false, message: 'Role id is required' }, { status: 400 });
  const role = await Role.findById(id).lean();
  if (!role) return NextResponse.json({ success: false, message: 'Role not found' }, { status: 404 });
  return NextResponse.json({ success: true, data: role });
}

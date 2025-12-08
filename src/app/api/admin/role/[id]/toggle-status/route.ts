import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Role from '@/models/Role';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const role = await Role.findById(id);
    if (!role) return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 });
    role.isActive = !role.isActive;
    await role.save();
    return NextResponse.json({ success: true, data: role, message: `Role ${role.isActive ? 'activated' : 'deactivated'} successfully` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

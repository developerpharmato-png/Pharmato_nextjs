import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Admin from '@/models/Admin';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;
  if (!id) return NextResponse.json({ success: false, message: 'id required' }, { status: 400 });
  try {
    const body = await req.json();
    const allowed: any = {};
    if (body.name !== undefined) allowed.name = body.name;
    if (body.roleId !== undefined) allowed.roleId = body.roleId;
    if (body.mobile !== undefined) allowed.mobile = body.mobile;
    const admin = await Admin.findByIdAndUpdate(id, { $set: allowed }, { new: true }).select('-password').populate({ path: 'roleId', select: 'name', strictPopulate: false });
    if (!admin) return NextResponse.json({ success: false, message: 'Admin not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: admin });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Failed to update admin' }, { status: 500 });
  }
}

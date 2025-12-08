import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Admin from '@/models/Admin';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;
  if (!id) return NextResponse.json({ success: false, message: 'id required' }, { status: 400 });
  const admin = await Admin.findById(id);
  if (!admin) return NextResponse.json({ success: false, message: 'Admin not found' }, { status: 404 });
  admin.isActive = !admin.isActive;
  await admin.save();
  return NextResponse.json({ success: true, data: admin, message: `Admin ${admin.isActive ? 'activated' : 'deactivated'}` });
}

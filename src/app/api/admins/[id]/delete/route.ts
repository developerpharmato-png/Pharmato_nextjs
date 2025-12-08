import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Admin from '@/models/Admin';

export async function DELETE(req: NextRequest, context: { params?: any } = {}) {
  await dbConnect();
  // The App Router may provide params as a Promise or as an object depending on runtime.
  // Normalize to an object and safely extract `id`.
  const rawParams = context?.params;
  const params = rawParams && typeof (rawParams as any).then === 'function' ? await rawParams : rawParams;
  let id = params?.id as string | undefined;

  // Fallback: extract id from the request URL path if not present
  if (!id) {
    try {
      const url = new URL(req.url);
      const parts = url.pathname.split('/').filter(Boolean);
      // expect path like /api/admins/<id>/delete
      const adminsIndex = parts.findIndex(p => p === 'admins');
      if (adminsIndex >= 0 && parts.length > adminsIndex + 1) {
        id = parts[adminsIndex + 1];
      }
    } catch (e) {
      // ignore and handle below
    }
  }

  if (!id) return NextResponse.json({ success: false, message: 'id required' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const deletedById = body?.deletedById;

  const adminToDelete = await Admin.findById(id);
  if (!adminToDelete) return NextResponse.json({ success: false, message: 'Admin not found' }, { status: 404 });

  let deletedBy: any = null;
  if (deletedById) {
    const deleter = await Admin.findById(deletedById).select('name email');
    if (deleter) deletedBy = { id: String(deleter._id), name: deleter.name, email: deleter.email };
  }

  await Admin.findByIdAndDelete(id);

  return NextResponse.json({ success: true, message: 'Admin deleted', data: { deletedBy } });
}

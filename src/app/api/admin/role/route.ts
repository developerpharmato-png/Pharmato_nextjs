import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Role from '@/models/Role';

// GET: list roles
export async function GET(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '0', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const name = searchParams.get('name') || '';

  const filter: any = {};
  if (name) filter.name = { $regex: name, $options: 'i' };

  const total = await Role.countDocuments(filter);
  const query = Role.find(filter).sort({ createdAt: -1 });
  if (limit > 0) query.skip(offset).limit(limit);
  const data = await query.lean();

  return NextResponse.json({ success: true, total, data });
}

// POST: add role
export async function POST(req: NextRequest) {
  await dbConnect();
  const { name, permissions = [], isActive = true } = await req.json();
  if (!name || typeof name !== 'string') {
    return NextResponse.json({ success: false, message: 'Role name is required' }, { status: 400 });
  }
  const exists = await Role.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
  if (exists) {
    return NextResponse.json({ success: false, message: 'Role already exists' }, { status: 409 });
  }
  const role = await Role.create({ name, permissions, isActive });
  return NextResponse.json({ success: true, message: 'Role added', data: role });
}

// PUT: update role by id via query param
export async function PUT(req: NextRequest) {
  await dbConnect();
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, message: 'Role id is required' }, { status: 400 });

  const { name, permissions = [], isActive } = await req.json();
  const updated = await Role.findByIdAndUpdate(id, { name, permissions, isActive }, { new: true });
  if (!updated) return NextResponse.json({ success: false, message: 'Role not found' }, { status: 404 });
  return NextResponse.json({ success: true, message: 'Role updated', data: updated });
}

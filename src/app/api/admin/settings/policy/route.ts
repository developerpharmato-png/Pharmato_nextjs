import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Setting from '@/models/Setting';

export async function GET(req: NextRequest) {
  await dbConnect();
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type');
    if (!type) return NextResponse.json({ success: false, error: 'Missing type query param' }, { status: 400 });

    const setting = await Setting.findOne({ type }).lean();
    if (!setting) return NextResponse.json({ success: true, data: null });

    return NextResponse.json({ success: true, data: setting.data || null });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch policy' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    const body = await req.json();
    const { type, content } = body;
    if (!type || typeof content !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing type or content' }, { status: 400 });
    }

    // Only allow known types optionally
    const allowed = ['termcondition', 'policy', 'privacy'];
    if (!allowed.includes(type)) {
      // still allow, but warn
    }

    const existing = await Setting.findOne({ type });
    if (existing) {
      existing.data = content;
      existing.is_admin_list = 0;
      await existing.save();
      return NextResponse.json({ success: true, data: content });
    }

    const created = await Setting.create({ type, data: content, is_admin_list: 0, is_active: 1 });
    return NextResponse.json({ success: true, data: created.data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to save policy' }, { status: 500 });
  }
}

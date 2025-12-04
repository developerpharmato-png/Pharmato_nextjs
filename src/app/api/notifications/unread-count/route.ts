import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';

// GET /api/notifications/unread-count?userId=...&role=...
export async function GET(request: NextRequest) {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');
    if (!userId || !role) {
        return NextResponse.json({ success: false, error: 'userId and role required' }, { status: 400 });
    }
    const count = await Notification.countDocuments({ userId, role, isRead: false });
    return NextResponse.json({ success: true, count });
}

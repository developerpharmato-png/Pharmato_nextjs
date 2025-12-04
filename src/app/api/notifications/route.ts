import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';

// GET /api/notifications?userId=...&role=...
export async function GET(request: NextRequest) {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');
    if (!userId || !role) {
        return NextResponse.json({ success: false, error: 'userId and role required' }, { status: 400 });
    }
    const notifications = await Notification.find({ userId, role }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: notifications });
}

// POST /api/notifications/read
export async function POST(request: NextRequest) {
    await connectDB();
    const { id } = await request.json();
    if (!id) {
        return NextResponse.json({ success: false, error: 'Notification id required' }, { status: 400 });
    }
    const notification = await Notification.findById(id);
    if (!notification) {
        return NextResponse.json({ success: false, error: 'Notification not found' }, { status: 404 });
    }
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
    return NextResponse.json({ success: true, message: 'Notification marked as read' });
}

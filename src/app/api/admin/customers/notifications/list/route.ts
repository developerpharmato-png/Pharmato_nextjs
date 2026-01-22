import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AdminCustomerNotification from '@/models/AdminCustomerNotification';

export async function GET(request: NextRequest) {
    await dbConnect();
    try {
        const notifications = await AdminCustomerNotification.find().sort({ createdAt: -1 });
        return NextResponse.json({ status: true, data: notifications });
    } catch (err) {
        console.error('Failed to fetch admin customer notifications:', err);
        return NextResponse.json({ status: false, message: 'Failed to fetch notifications' }, { status: 500 });
    }
}

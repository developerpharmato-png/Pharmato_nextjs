import { NextResponse } from 'next/server';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await context.params;
    try {
        const user = await User.findById(id);
        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }
        user.isDelete = !user.isDelete;
        await user.save();
        return NextResponse.json({ success: true, data: user });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || 'Failed to toggle delete status' }, { status: 500 });
    }
}

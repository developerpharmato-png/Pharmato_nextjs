import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

export async function POST(req: NextRequest) {
    await dbConnect();
    try {
        const { orderId, status } = await req.json();
        if (!orderId || !status) {
            return NextResponse.json({ success: false, message: 'orderId and status are required' }, { status: 400 });
        }
        const order = await Order.findOne({ _id: orderId });
        if (!order) {
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
        }
        order.order_status = status;
        await order.save();
        return NextResponse.json({ success: true, message: 'Order status updated', data: order });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Failed to update order status', error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import Order from '@/models/Order';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  await mongoose.connect(process.env.MONGODB_URI!);
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const totalOrders = await Order.countDocuments({});
  const totalRevenueAgg = await Order.aggregate([
    { $group: { _id: null, total: { $sum: "$total_order_amount" } } }
  ]);
  const totalRevenue = totalRevenueAgg[0]?.total || 0;
  const avgOrderValue = totalOrders ? (totalRevenue / totalOrders).toFixed(2) : 0;
  const ordersToday = await Order.countDocuments({ createdAt: { $gte: startOfDay } });
  const cancelledOrders = await Order.countDocuments({ order_status: 'cancelled' });
  const failedOrders = await Order.countDocuments({ payment_status: 'failed' });
  const refundAmountAgg = await Order.aggregate([
    { $match: { order_status: 'refunded' } },
    { $group: { _id: null, total: { $sum: "$total_order_amount" } } }
  ]);
  const refundAmount = refundAmountAgg[0]?.total || 0;
  const prescriptionOrders = await Order.countDocuments({ isPrescriptionRequired: true });
  const otcOrders = await Order.countDocuments({ isPrescriptionRequired: false });

  return NextResponse.json({
    kpis: [
      { label: 'Total Orders', value: totalOrders },
      { label: 'Total Revenue', value: totalRevenue },
      { label: 'Average Order Value (AOV)', value: avgOrderValue },
      { label: 'Orders Today', value: ordersToday },
      { label: 'Cancelled Orders', value: cancelledOrders },
      { label: 'Failed Orders', value: failedOrders },
      { label: 'Refund Amount', value: refundAmount },
      { label: 'Prescription Orders', value: prescriptionOrders },
      { label: 'OTC Orders', value: otcOrders },
    ],
    statusGraph: {
      labels: ['Completed', 'Cancelled', 'Failed', 'Refunded'],
      datasets: [{
        data: [
          await Order.countDocuments({ order_status: 'completed' }),
          cancelledOrders,
          failedOrders,
          await Order.countDocuments({ order_status: 'refunded' })
        ],
        backgroundColor: ['#4ade80', '#f87171', '#fbbf24', '#60a5fa'],
      }],
    },
    prescriptionVsOtcGraph: {
      labels: ['Prescription', 'OTC'],
      datasets: [{
        label: 'Orders',
        data: [prescriptionOrders, otcOrders],
        backgroundColor: ['#818cf8', '#f472b6'],
      }],
    },
  });
}

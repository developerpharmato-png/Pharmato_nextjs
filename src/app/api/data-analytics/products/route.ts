import { NextRequest, NextResponse } from 'next/server';
import Medicine from '@/models/Medicine';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  await mongoose.connect(process.env.MONGODB_URI!);
  const now = new Date();
  const soon30 = new Date(now); soon30.setDate(now.getDate() + 30);
  const soon60 = new Date(now); soon60.setDate(now.getDate() + 60);
  const soon90 = new Date(now); soon90.setDate(now.getDate() + 90);

  const total = await Medicine.countDocuments({});
  const active = await Medicine.countDocuments({ isActive: true, isDeleted: false });
  const outOfStock = await Medicine.countDocuments({ stock: 0, isDeleted: false });
  const lowStock = await Medicine.countDocuments({ stock: { $gt: 0, $lte: 10 }, isDeleted: false });
  const exp30 = await Medicine.countDocuments({ expiryDate: { $lte: soon30, $gte: now }, isDeleted: false });
  const exp60 = await Medicine.countDocuments({ expiryDate: { $lte: soon60, $gte: now }, isDeleted: false });
  const exp90 = await Medicine.countDocuments({ expiryDate: { $lte: soon90, $gte: now }, isDeleted: false });

  // Top/Least selling: Placeholder, replace with real sales data if available
  const topSelling = await Medicine.find({ isDeleted: false }).sort({ stock: 1 }).limit(5).select('name stock');
  const leastSelling = await Medicine.find({ isDeleted: false }).sort({ stock: -1 }).limit(5).select('name stock');

  return NextResponse.json({
    kpis: [
      { label: 'Total Products', value: total },
      { label: 'Active Products', value: active },
      { label: 'Out of Stock Products', value: outOfStock },
      { label: 'Low Stock Products', value: lowStock },
      { label: 'Expiring in 30 Days', value: exp30 },
      { label: 'Expiring in 60 Days', value: exp60 },
      { label: 'Expiring in 90 Days', value: exp90 },
    ],
    topSellingGraph: {
      labels: topSelling.map((m) => m.name),
      datasets: [{ label: 'Stock (Low = High Sales)', data: topSelling.map((m) => m.stock), backgroundColor: '#4ade80' }],
    },
    leastSellingGraph: {
      labels: leastSelling.map((m) => m.name),
      datasets: [{ label: 'Stock (High = Low Sales)', data: leastSelling.map((m) => m.stock), backgroundColor: '#f87171' }],
    },
  });
}

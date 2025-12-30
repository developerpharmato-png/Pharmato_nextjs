import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Setting from '@/models/Setting';

// Type used in Setting.type for payment settings
const PAYMENT_TYPE = 'payment_settings';

export async function GET(req: NextRequest) {
  await dbConnect();
  try {
    const setting = await Setting.findOne({ type: PAYMENT_TYPE }).lean();
    if (!setting) {
      return NextResponse.json({ success: true, data: null });
    }
    let data: any = null;
    try {
      data = setting.data ? JSON.parse(setting.data) : null;
    } catch (e) {
      data = setting.data;
    }
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch payment settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    const body = await req.json();
    // Required numeric fields
    const {
      deliveryAmount,
      deliveryAmountThreshold,
      paymentGatewayFeesPercent,
      paymentGatewayFeesGSTPercent,
    } = body;

    const toNumber = (v: any) => (v === '' || v === null || v === undefined ? NaN : Number(v));
    const dAmt = toNumber(deliveryAmount);
    const dThresh = toNumber(deliveryAmountThreshold);
    const pgFees = toNumber(paymentGatewayFeesPercent);
    const pgGst = toNumber(paymentGatewayFeesGSTPercent);

    // Validation
    if ([dAmt, dThresh, pgFees, pgGst].some((n) => Number.isNaN(n))) {
      return NextResponse.json({ success: false, error: 'All fields are required and must be numeric' }, { status: 400 });
    }
    if (dAmt < 0 || dThresh < 0 || pgFees < 0 || pgGst < 0) {
      return NextResponse.json({ success: false, error: 'Values cannot be negative' }, { status: 400 });
    }
    if (dThresh < dAmt) {
      return NextResponse.json({ success: false, error: 'Threshold amount cannot be less than delivery amount' }, { status: 400 });
    }

    const payload = {
      deliveryAmount: dAmt,
      deliveryAmountThreshold: dThresh,
      paymentGatewayFeesPercent: pgFees,
      paymentGatewayFeesGSTPercent: pgGst,
      updatedAt: new Date(),
    };

    const existing = await Setting.findOne({ type: PAYMENT_TYPE });
    if (existing) {
      existing.data = JSON.stringify(payload);
      existing.is_admin_list = 1;
      await existing.save();
      return NextResponse.json({ success: true, data: payload });
    }

    const created = await Setting.create({ type: PAYMENT_TYPE, data: JSON.stringify(payload), is_admin_list: 1, is_active: 1 });
    let parsed: any = null;
    try { parsed = JSON.parse(created.data); } catch { parsed = created.data; }
    return NextResponse.json({ success: true, data: parsed }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to save payment settings' }, { status: 500 });
  }
}



import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import UserAddress from '@/models/UserAddress';
import dbConnect from '@/lib/mongodb';


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ success: false, message: 'Invalid user ID' }, { status: 400 });
    }

    await dbConnect();

    // Find all addresses for the user
    const addresses = await UserAddress.find({ userId }).lean();
    if (!addresses || addresses.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }
    return NextResponse.json({ success: true, data: addresses });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Server error' }, { status: 500 });
  }
}

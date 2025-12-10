import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Pincode from '@/models/Pincode';

export async function GET(req: NextRequest) {
    console.log('Connecting to database...');
    await dbConnect();
    console.log('Database connected.');

    const pincodes = await Pincode.find({}).lean();
    console.log('Pincodes fetched:', pincodes);

    return NextResponse.json({ success: true, data: pincodes });
}
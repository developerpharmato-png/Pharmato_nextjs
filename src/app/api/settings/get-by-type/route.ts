import { NextResponse } from 'next/server';
import Setting from '@/models/Setting';
import dbConnect from '@/lib/mongodb';

export async function POST(request: Request) {
    await dbConnect();
    const body = await request.json();
    const { type } = body;
    try {
        const settingCheck = await Setting.findOne({ type }).select('_id data');
        if (settingCheck) {
            return NextResponse.json({ status: true, data: settingCheck });
        } else {
            return NextResponse.json({ status: false, message: 'No data found' });
        }
    } catch (error: any) {
        return NextResponse.json({ status: false, message: error.message || 'Error fetching data' }, { status: 500 });
    }
}

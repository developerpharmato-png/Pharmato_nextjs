
import { NextResponse } from 'next/server';
import Setting from '@/models/Setting';
import dbConnect from '@/lib/mongodb';
import Medicine from '@/models/Medicine';

export async function POST(request: Request) {
    await dbConnect();
    const body = await request.json();
    const { type } = body;
    try {
        const settingCheck = await Setting.findOne({ type }).select('_id data');
        if (settingCheck) {
            let dataToSend: any = settingCheck.data;
            if (type === 'medicinePriceRange') {
                // If data is a string like '0,5000', convert to array of numbers
                if (typeof dataToSend === 'string' && dataToSend.includes(',')) {
                    dataToSend = dataToSend.split(',').map((v: string) => Number(v.trim()));
                }
                // Find max MRP from Medicine table
                const maxMrpDoc = await Medicine.findOne({}, { mrp: 1 }).sort({ mrp: -1 });
                if (maxMrpDoc && typeof maxMrpDoc.mrp === 'number') {
                    // Replace 5000 with max MRP in data (assuming data is an array like [0, 5000])
                    if (Array.isArray(dataToSend) && dataToSend.length === 2 && dataToSend[1] === 5000) {
                        dataToSend = [dataToSend[0], maxMrpDoc.mrp];
                    }
                }
            }
            // Always return as string '0,maxValue'
            let dataString = dataToSend;
            if (Array.isArray(dataToSend) && dataToSend.length === 2) {
                dataString = `${dataToSend[0]},${dataToSend[1]}`;
            }
            return NextResponse.json({ status: true, data: { ...settingCheck.toObject(), data: dataString } });
        } else {
            return NextResponse.json({ status: false, message: 'No data found' });
        }
    } catch (error: any) {
        return NextResponse.json({ status: false, message: error.message || 'Error fetching data' }, { status: 500 });
    }
}

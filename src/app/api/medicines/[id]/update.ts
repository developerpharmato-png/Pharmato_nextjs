import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import Medicine from '../../../../models/Medicine';

import type { NextRequest } from 'next/server';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    await dbConnect();
    const { id } = params;
    try {
        const body = await req.json();
        const update = { ...body };
        // Remove fields that should not be updated directly
        delete update._id;
        delete update.createdAt;
        delete update.updatedAt;
        // Allow updating crossSellProducts
        const result = await Medicine.findByIdAndUpdate(id, update, { new: true });
        if (!result) {
            return NextResponse.json({ success: false, error: 'Medicine not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        let errorMsg = 'Unknown error';
        if (error instanceof Error) {
            errorMsg = error.message;
        } else if (typeof error === 'string') {
            errorMsg = error;
        }
        return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
    }
}

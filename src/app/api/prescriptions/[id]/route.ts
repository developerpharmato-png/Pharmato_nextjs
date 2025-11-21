import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Prescription from '@/models/Prescription';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();
        const prescription = await Prescription.findById(params.id);
        if (!prescription) {
            return NextResponse.json(
                { success: false, error: 'Prescription not found' },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true, data: prescription });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Failed to fetch prescription' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();
        const body = await request.json();
        const prescription = await Prescription.findByIdAndUpdate(
            params.id,
            body,
            { new: true, runValidators: true }
        );
        if (!prescription) {
            return NextResponse.json(
                { success: false, error: 'Prescription not found' },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true, data: prescription });
    } catch (error: any) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((val: any) => val.message);
            return NextResponse.json(
                { success: false, error: messages },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { success: false, error: 'Failed to update prescription' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();
        const prescription = await Prescription.findByIdAndDelete(params.id);
        if (!prescription) {
            return NextResponse.json(
                { success: false, error: 'Prescription not found' },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true, data: prescription });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Failed to delete prescription' },
            { status: 500 }
        );
    }
}
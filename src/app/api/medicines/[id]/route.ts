import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Medicine from '@/models/Medicine';

/**
 * @swagger
 * /api/medicines/{id}:
 *   get:
 *     summary: Get medicine by ID
 *     tags:
 *       - Medicine
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Medicine ID
 *     responses:
 *       200:
 *         description: Medicine details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Medicine'
 *   put:
 *     summary: Update medicine by ID
 *     tags:
 *       - Medicine
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Medicine ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Medicine'
 *     responses:
 *       200:
 *         description: Medicine updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Medicine'
 *   delete:
 *     summary: Delete medicine by ID
 *     tags:
 *       - Medicine
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Medicine ID
 *     responses:
 *       200:
 *         description: Medicine deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 */

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const params = await context.params;
        const id = params?.id;
        if (!id || id === 'undefined' || !mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, error: 'Invalid medicine id', details: process.env.NODE_ENV === 'production' ? undefined : `id: ${String(id)}` },
                { status: 400 }
            );
        }
        const medicine = await Medicine.findById(params.id)
            .populate({
                path: 'relatedProducts',
                select: '_id name manufacturer mrp price images discount'
            })
            .populate({
                path: 'crossSellProducts',
                select: '_id name manufacturer mrp price images discount'
            });
        if (!medicine) {
            return NextResponse.json(
                { success: false, error: 'Medicine not found' },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true, data: medicine });
    } catch (error) {
        console.error('Error in GET /api/medicines/[id]:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch medicine', details: process.env.NODE_ENV === 'production' ? undefined : (error instanceof Error ? error.message : String(error)) },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const params = await context.params;
        const id = params?.id;
        if (!id || id === 'undefined' || !mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, error: 'Invalid medicine id', details: process.env.NODE_ENV === 'production' ? undefined : `id: ${String(id)}` },
                { status: 400 }
            );
        }
        const body = await request.json();
        // Always set unit from body (if present)
        const update = { ...body, unit: body.unit || "" };
            // Allow updating crossSellProducts
        delete update._id;
        delete update.createdAt;
        delete update.updatedAt;
        const result = await Medicine.findByIdAndUpdate(id, update, { new: true });
        if (!result) {
            return NextResponse.json({ success: false, error: 'Medicine not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Failed to update medicine', details: process.env.NODE_ENV === 'production' ? undefined : (error instanceof Error ? error.message : String(error)) },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const params = await context.params;
        const medicine = await Medicine.findByIdAndUpdate(
            params.id,
            { isActive: false },
            { new: true }
        );
        if (!medicine) {
            return NextResponse.json(
                { success: false, error: 'Medicine not found' },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true, data: medicine });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Failed to delete medicine' },
            { status: 500 }
        );
    }
}
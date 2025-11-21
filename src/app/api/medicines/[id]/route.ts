import { NextRequest, NextResponse } from 'next/server';
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
    context: { params: { id: string } }
) {
    try {
        await connectDB();
        // Next.js 13+ app router: params may be a Promise
        const params = context.params instanceof Promise ? await context.params : context.params;
        const medicine = await Medicine.findById(params.id);
        if (!medicine) {
            return NextResponse.json(
                { success: false, error: 'Medicine not found' },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true, data: medicine });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Failed to fetch medicine' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    context: { params: { id: string } }
) {
    try {
        await connectDB();
        const params = context.params instanceof Promise ? await context.params : context.params;
        const body = await request.json();
        const medicine = await Medicine.findByIdAndUpdate(
            params.id,
            body,
            { new: true, runValidators: true }
        );
        if (!medicine) {
            return NextResponse.json(
                { success: false, error: 'Medicine not found' },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true, data: medicine });
    } catch (error: any) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((val: any) => val.message);
            return NextResponse.json(
                { success: false, error: messages },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { success: false, error: 'Failed to update medicine' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: { id: string } }
) {
    try {
        await connectDB();
        const params = context.params instanceof Promise ? await context.params : context.params;
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
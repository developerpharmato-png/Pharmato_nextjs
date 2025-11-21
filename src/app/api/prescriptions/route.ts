import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Prescription from '@/models/Prescription';

/**
 * @swagger
 * /api/prescriptions:
 *   get:
 *     summary: Get all prescriptions
 *     tags:
 *       - Prescription
 *     responses:
 *       200:
 *         description: List of prescriptions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Prescription'
 *   post:
 *     summary: Create a new prescription
 *     tags:
 *       - Prescription
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Prescription'
 *     responses:
 *       201:
 *         description: Prescription created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Prescription'
 */

export async function GET() {
    try {
        await connectDB();
        const prescriptions = await Prescription.find().sort({ createdAt: -1 });
        return NextResponse.json({ success: true, data: prescriptions });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Failed to fetch prescriptions' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const body = await request.json();
        const prescription = await Prescription.create(body);
        return NextResponse.json({ success: true, data: prescription }, { status: 201 });
    } catch (error: any) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((val: any) => val.message);
            return NextResponse.json(
                { success: false, error: messages },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { success: false, error: 'Failed to create prescription' },
            { status: 500 }
        );
    }
}
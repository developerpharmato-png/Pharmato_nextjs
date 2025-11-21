import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import bcrypt from 'bcryptjs';

/**
 * @swagger
 * /api/admins:
 *   get:
 *     summary: Get all admins
 *     tags:
 *       - Admin
 *     responses:
 *       200:
 *         description: List of admins
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
 *                     $ref: '#/components/schemas/Admin'
 *   post:
 *     summary: Create a new admin
 *     tags:
 *       - Admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Admin'
 *     responses:
 *       201:
 *         description: Admin created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Admin'
 */

export async function GET() {
    try {
        await connectDB();
        const admins = await Admin.find().sort({ createdAt: -1 }).select('-password');
        return NextResponse.json({ success: true, data: admins });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Failed to fetch admins' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const body = await request.json();
        const existing = await Admin.findOne({ email: body.email.toLowerCase() });
        if (existing) {
            return NextResponse.json(
                { success: false, error: 'Email already registered' },
                { status: 400 }
            );
        }
        const hashed = await bcrypt.hash(body.password, 10);
        const admin = await Admin.create({ ...body, password: hashed });
        const adminObj = admin.toObject();
        delete (adminObj as any).password;
        return NextResponse.json({ success: true, data: adminObj }, { status: 201 });
    } catch (error: any) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((val: any) => val.message);
            return NextResponse.json(
                { success: false, error: messages },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { success: false, error: 'Failed to create admin' },
            { status: 500 }
        );
    }
}

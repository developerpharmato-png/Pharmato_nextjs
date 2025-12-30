/**
 * @swagger
 * /api/admin/settings/admin-list:
 *   get:
 *     summary: Get admin settings list
 *     tags:
 *       - Admin
 *     description: Returns a list of settings where is_admin_list is 1.
 *     responses:
 *       200:
 *         description: List of admin settings
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
 *                     $ref: '#/components/schemas/Setting'
 *       500:
 *         description: Failed to fetch admin settings
 */
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Setting from '@/models/Setting';

export async function GET(req: NextRequest) {
    await dbConnect();
    try {
        const adminSettings = await Setting.find({ is_admin_list: 1 }).lean();
        return NextResponse.json({ success: true, data: adminSettings });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Failed to fetch admin settings', error: (error as Error).message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    await dbConnect();
    try {
        const body = await req.json();
        // Expect body.updates = [{ _id?, type, data, data_value_in?, description?, is_active? }, ...]
        const updates: any[] = Array.isArray(body.updates) ? body.updates : [];

        const results: any[] = [];
        for (const u of updates) {
            const payload: any = {};
            if (u.type) payload.type = u.type;
            if (u.data !== undefined) payload.data = String(u.data);
            if (u.data_value_in !== undefined) payload.data_value_in = u.data_value_in;
            if (u.description !== undefined) payload.description = u.description;
            if (u.is_active !== undefined) payload.is_active = u.is_active;
            payload.is_admin_list = 1;

            if (u._id) {
                const updated = await Setting.findByIdAndUpdate(u._id, { $set: payload }, { new: true, upsert: true }).lean();
                results.push(updated);
            } else if (u.type) {
                // try update by type or create
                const updated = await Setting.findOneAndUpdate({ type: u.type }, { $set: payload }, { new: true, upsert: true }).lean();
                results.push(updated);
            }
        }

        const adminSettings = await Setting.find({ is_admin_list: 1 }).lean();
        return NextResponse.json({ success: true, data: adminSettings });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Failed to update admin settings', error: (error as Error).message }, { status: 500 });
    }
}

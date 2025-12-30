import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Setting from '@/models/Setting';
import Medicine from '@/models/Medicine';

/**
 * @swagger
 * /api/admin/settings/get-by-type:
 *   post:
 *     summary: Get admin settings by type
 *     tags:
 *       - Admin
 *     description: Returns a list of admin settings filtered by type (where is_admin_list is 1).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 description: The type of setting to filter by
 *             required:
 *               - type
 *     responses:
 *       200:
 *         description: List of admin settings by type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     data:
 *                       type: string
 *                     # Add other fields as needed from the Setting schema
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to fetch admin settings
 */

export async function POST(request: Request) {
    await dbConnect();
    const body = await request.json();
    const { type, data } = body;
    if (!type) return NextResponse.json({ status: false, message: 'Missing type' }, { status: 400 });

    try {
        // If `data` is provided, treat this as an update/upsert request
        if (typeof data !== 'undefined') {
            // For medicinePriceRange, allow array or comma string; store as string for backward compatibility
            let storeValue: any = data;
            if (type === 'medicinePriceRange' && Array.isArray(data) && data.length === 2) {
                storeValue = `${data[0]},${data[1]}`;
            }

            const updated = await Setting.findOneAndUpdate(
                { type },
                { $set: { data: storeValue, is_admin_list: 1, is_active: 1 } },
                { new: true, upsert: true }
            ).select('_id data');

            // Normalize medicinePriceRange output if needed
            let outData: any = updated.data;
            if (type === 'medicinePriceRange' && typeof outData === 'string' && outData.includes(',')) {
                outData = outData;
            }

            return NextResponse.json({ status: true, data: { _id: String(updated._id), data: outData } });
        }

        // Otherwise, treat as read
        const settingCheck = await Setting.findOne({ type }).select('_id data');
        if (!settingCheck) {
            return NextResponse.json({ status: false, message: 'No data found' });
        }

        let dataToSend: any = settingCheck.data;
        if (type === 'medicinePriceRange') {
            if (typeof dataToSend === 'string' && dataToSend.includes(',')) {
                dataToSend = dataToSend;
            }
            const maxMrpDoc = await Medicine.findOne({}, { mrp: 1 }).sort({ mrp: -1 });
            if (maxMrpDoc && typeof maxMrpDoc.mrp === 'number') {
                if (typeof dataToSend === 'string' && dataToSend.includes(',')) {
                    const parts = dataToSend.split(',').map((v: string) => Number(v.trim()));
                    if (parts.length === 2 && parts[1] === 5000) {
                        dataToSend = `${parts[0]},${maxMrpDoc.mrp}`;
                    }
                }
            }
        }

        return NextResponse.json({ status: true, data: { _id: String(settingCheck._id), data: dataToSend } });
    } catch (error: any) {
        return NextResponse.json({ status: false, message: error.message || 'Error processing request' }, { status: 500 });
    }
}

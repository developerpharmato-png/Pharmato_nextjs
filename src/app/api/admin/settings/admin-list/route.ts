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
        const adminSettings = await Setting.find({ is_admin_list: 1 });
        return NextResponse.json({ success: true, data: adminSettings });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Failed to fetch admin settings', error: (error as Error).message }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import Role from '@/models/Role';

/**
 * @swagger
 * /api/admins/store-managers:
 *   get:
 *     summary: Get all Store Manager admins
 *     tags:
 *       - Admin
 *     responses:
 *       200:
 *         description: List of Store Manager admins
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
 */

export async function GET(request: NextRequest) {
    try {
        await connectDB();
        
        // Find the Store Manager role
        const storeManagerRole = await Role.findOne({ name: 'Store Manager' }).select('_id');
        
        if (!storeManagerRole) {
            return NextResponse.json({ 
                success: true, 
                data: [],
                message: 'Store Manager role not found' 
            });
        }

        // Find all active admins with Store Manager role
        const admins = await Admin.find({ roleId: storeManagerRole._id, isActive: true })
            .sort({ createdAt: -1 })
            .select('-password')
            .populate({ path: 'roleId', select: 'name', strictPopulate: false });

        // Normalize admins to always include roleId (string|null) and roleName (string|null)
        const normalized = (admins || []).map((a: any) => {
            const plain = a && a.toObject ? a.toObject() : a;
            const roleObj = plain.roleId;
            return {
                ...plain,
                roleId: roleObj ? String(roleObj._id || roleObj) : null,
                roleName: roleObj && roleObj.name ? roleObj.name : null,
            };
        });

        return NextResponse.json({ success: true, data: normalized });
    } catch (error: any) {
        console.error('GET /api/admins/store-managers error:', error);
        return NextResponse.json(
            { success: false, error: error?.message || 'Failed to fetch Store Manager admins' },
            { status: 500 }
        );
    }
}

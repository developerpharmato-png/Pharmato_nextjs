import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';
import { requireAdminAuth } from '../../requireAdminAuth';

/**
 * @swagger
 * /api/admin/customers/dropdown:
 *   get:
 *     summary: Get active customers for dropdown (admin)
 *     tags:
 *       - Admin-Customer
 *     parameters:
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *         description: Search by email or mobile
 *     responses:
 *       200:
 *         description: Active customer dropdown list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       mobile:
 *                         type: string
 *                       email:
 *                         type: string
 */
export async function GET(req: NextRequest) {
    // const adminOrError = await requireAdminAuth(req);
    // if (adminOrError instanceof NextResponse) return adminOrError;

    await dbConnect();

    try {
        // Extract query parameters
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || "";

        // Build the query object - only active users
        const query: any = {
            isActive: true,
            $or: [
                { isDelete: { $exists: false } },
                { isDelete: false }
            ]
        };

        // Add search criteria if provided
        if (search) {
            query.$and = [
                {
                    $or: [
                        { email: { $regex: search, $options: "i" } },
                        { mobile: { $regex: search, $options: "i" } }
                    ]
                }
            ];
        }

        console.log('Dropdown Query:', query);

        // Fetch active customers with only required fields
        const customers = await User.find(query)
            .select('_id mobile email')
            .sort({ mobile: 1 })
            .limit(1000)
            .lean();

        return NextResponse.json({
            success: true,
            message: 'Customer dropdown list fetched successfully',
            data: customers,
        });
    } catch (error) {
        console.error('Error fetching customer dropdown:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch customer dropdown',
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}

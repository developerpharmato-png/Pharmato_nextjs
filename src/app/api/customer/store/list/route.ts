import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Store from '@/models/Store';

/**
 * @swagger
 * /api/customer/store/list:
 *   post:
 *     summary: Get customer store list (POST)
 *     description: Returns a paginated list of active stores, with optional search by name. Accepts limit, offset, and search in request body.
 *     tags:
 *       - Customer Store
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               limit:
 *                 type: integer
 *                 default: 10
 *               offset:
 *                 type: integer
 *                 default: 0
 *               search:
 *                 type: string
 *                 default: ""
 *     responses:
 *       200:
 *         description: Store list fetched successfully
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
 *                     $ref: '#/components/schemas/Store'
 *                 total:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */

export async function POST(req: NextRequest) {
    await dbConnect();
    const { limit = 10, offset = 0, search = "" } = await req.json();
    const query = search
        ? { name: { $regex: search, $options: 'i' }, status: 1 }
        : { status: 1 };
    const stores = await Store.find(query)
        .skip(offset)
        .limit(limit)
        .lean();
    const total = await Store.countDocuments(query);
    return NextResponse.json({
        success: true,
        message: 'Store list fetched successfully',
        data: stores,
        total,
        limit,
        offset
    });
}

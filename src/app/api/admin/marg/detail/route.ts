import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Marg from '@/models/Marg';

/**
 * @swagger
 * /api/admin/marg/detail:
 *   post:
 *     summary: Get detailed margInsertData for a Marg document
 *     tags:
 *       - Admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: Marg document ID
 *               limit:
 *                 type: integer
 *                 description: Number of items to return
 *                 default: 10
 *               offset:
 *                 type: integer
 *                 description: Number of items to skip
 *                 default: 1
 *               search:
 *                 type: string
 *                 description: Search string (optional)
 *     responses:
 *       200:
 *         description: Marg detail data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 totalCount:
 *                   type: integer
 *                 message:
 *                   type: string
 *       400:
 *         description: Missing or invalid input
 */
export async function POST(req: NextRequest) {
    await dbConnect();
    const body = await req.json();
    const { id, limit = 10, offset = 1, search = '' } = body;
    if (!id) {
        return NextResponse.json({ status: false, message: 'id is required' }, { status: 400 });
    }
    const marg = await Marg.findById(id)
        .select('_id uniqueCode margGetDataCount margInsertDataCount margUpdateDataCount dateTime status type margInsertData createdAt updatedAt')
        .lean();
    if (!marg) {
        return NextResponse.json({ status: false, message: 'Marg not found' }, { status: 404 });
    }
    let data: any = Array.isArray(marg.margInsertData) ? marg.margInsertData : [];
    // Search: filter items where any value contains the search string (case-insensitive)
    if (search) {
        const searchLower = search.toLowerCase();
        data = data.filter((item: any) =>
            Object.values(item).some((val: any) =>
                typeof val === 'string' && val.toLowerCase().includes(searchLower)
            )
        );
    }
    const totalCount = data.length;
    // Pagination
    const start = (offset - 1) * limit;
    const paginated = data.slice(start, start + limit);
    marg.margInsertData = paginated;
    return NextResponse.json({
        status: true,
        data: marg,
        totalCount,
        message: 'Marg detail fetched successfully',
    });
}

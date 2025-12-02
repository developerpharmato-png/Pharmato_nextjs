/**
 * @swagger
 * /api/cloudinary/delete-image:
 *   post:
 *     summary: Delete an image from Cloudinary
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imageUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 result:
 *                   type: object
 */
import { NextRequest, NextResponse } from 'next/server';
import { deleteImageFromCloudinary } from '@/lib/cloudinaryUtils';

export async function POST(request: NextRequest) {
    try {
        const { imageUrl } = await request.json();
        if (!imageUrl) {
            return NextResponse.json({ success: false, message: 'No imageUrl provided' }, { status: 400 });
        }
        const result = await deleteImageFromCloudinary(imageUrl);
        return NextResponse.json({ success: true, result });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import BannerImage from '@/models/BannerImage';

/**
 * @swagger
 * /api/customer/banner-images:
 *   get:
 *     summary: Get banner images for customer
 *     tags:
 *       - Customer
 *     responses:
 *       200:
 *         description: Banner images fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 images:
 *                   type: array
 *                   items:
 *                     type: string
 */

export async function GET() {
    await dbConnect();
    const doc = await BannerImage.findOne().lean();
    let images: string[] = [];
    if (doc && !Array.isArray(doc) && 'images' in doc && Array.isArray(doc.images)) {
        images = doc.images;
    }
    return NextResponse.json({
        success: true,
        message: 'Banner images fetched successfully',
        images
    });
}

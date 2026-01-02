/**
 * @swagger
 * /api/cloudinary/upload-image:
 *   post:
 *     summary: Upload an image to Cloudinary
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 url:
 *                   type: string
 */
import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinaryUtils';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        if (!file || !(file instanceof File)) {
            return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
        }

        const mimeType = file.type;

        let resourceType: 'image' | 'raw';

        if (mimeType === 'application/pdf') {
            resourceType = 'raw';
        } else if (mimeType.startsWith('image/')) {
            resourceType = 'image';
        } else {
            return NextResponse.json(
                { success: false, message: 'Unsupported file type' },
                { status: 400 }
            );
        }

        // console.log("$$$$$$$$$resourceType$$$$$$$$$", resourceType);
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const publicId = `admin_${Date.now()}`;
        // const result = await uploadToCloudinary(buffer, publicId);
        const result = await uploadToCloudinary(
            buffer,
            publicId,
            resourceType
        );
        return NextResponse.json({ success: true, url: (result as any).secure_url });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

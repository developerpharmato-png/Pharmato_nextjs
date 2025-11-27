import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Medicine from '@/models/Medicine';

/**
 * @swagger
 * /api/medicines/{id}:
 *   get:
 *     summary: Get medicine by ID
 *     tags:
 *       - Medicine
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Medicine ID
 *     responses:
 *       200:
 *         description: Medicine details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Medicine'
 *   put:
 *     summary: Update medicine by ID
 *     tags:
 *       - Medicine
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Medicine ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Medicine'
 *     responses:
 *       200:
 *         description: Medicine updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Medicine'
 *   delete:
 *     summary: Delete medicine by ID
 *     tags:
 *       - Medicine
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Medicine ID
 *     responses:
 *       200:
 *         description: Medicine deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 */

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const params = await context.params;
        const medicine = await Medicine.findById(params.id)
            .populate({
                path: 'relatedProducts',
                select: '_id name manufacturer mrp price images discount'
            });
        if (!medicine) {
            return NextResponse.json(
                { success: false, error: 'Medicine not found' },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true, data: medicine });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Failed to fetch medicine' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const params = await context.params;
        let updateData: any = {};
        if (request.headers.get('content-type')?.includes('multipart/form-data')) {
            const formData = await request.formData();
            for (const [key, value] of formData.entries()) {
                if (key === 'images') {
                    if (!updateData.images) updateData.images = [];
                    if (typeof value === 'string') updateData.images.push(value);
                    else if (value instanceof File) updateData.images.push(`/uploads/${value.name}`); // Placeholder path
                } else if (key === 'highlights') {
                    updateData.highlights = typeof value === 'string' ? value.split(',').map(v => v.trim()) : [];
                } else if (key === 'composition') {
                    // If composition is sent as a string, convert to array of objects
                    if (typeof value === 'string') {
                        updateData.composition = value.split(',').map(pair => {
                            const [name, val] = pair.split(':');
                            return { name: name?.trim() || '', value: val?.trim() || '' };
                        });
                    }
                } else if (key === 'relatedProducts') {
                    updateData.relatedProducts = typeof value === 'string' ? value.split(',').map(v => v.trim()) : [];
                } else {
                    updateData[key] = value;
                }
            }
        } else {
            updateData = await request.json();
        }
        // Sanitize and convert fields
        if (updateData.highlights && typeof updateData.highlights === 'string') {
            updateData.highlights = updateData.highlights.split(',').map((v: string) => v.trim());
        }
        if (updateData.composition && typeof updateData.composition === 'string') {
            // Try to parse as JSON array, else fallback to comma split
            try {
                updateData.composition = JSON.parse(updateData.composition);
            } catch {
                updateData.composition = updateData.composition.split(',').map((pair: string) => {
                    const [name, val] = pair.split(':');
                    return { name: name?.trim() || '', value: val?.trim() || '' };
                });
            }
        }
        if (updateData.relatedProducts && typeof updateData.relatedProducts === 'string') {
            updateData.relatedProducts = updateData.relatedProducts.split(',').map((v: string) => v.trim());
        }
        if (updateData.rating && typeof updateData.rating === 'string') {
            try {
                updateData.rating = JSON.parse(updateData.rating);
            } catch {
                updateData.rating = undefined;
            }
        }
        console.log('updateData:', updateData);
        const medicine = await Medicine.findByIdAndUpdate(
            params.id,
            updateData,
            { new: true, runValidators: true }
        );
        if (!medicine) {
            return NextResponse.json(
                { success: false, error: 'Medicine not found' },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true, data: medicine });
    } catch (error: any) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((val: any) => val.message);
            return NextResponse.json(
                { success: false, error: messages },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { success: false, error: 'Failed to update medicine' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const params = await context.params;
        const medicine = await Medicine.findByIdAndUpdate(
            params.id,
            { isActive: false },
            { new: true }
        );
        if (!medicine) {
            return NextResponse.json(
                { success: false, error: 'Medicine not found' },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true, data: medicine });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Failed to delete medicine' },
            { status: 500 }
        );
    }
}
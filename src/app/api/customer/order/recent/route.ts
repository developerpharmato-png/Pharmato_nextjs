import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Medicine from '@/models/Medicine';
import mongoose from 'mongoose';
import Cart from '@/models/Cart';
import moment from 'moment-timezone';

/**
 * @swagger
 * /api/customer/order/recent:
 *   post:
 *     summary: Get the most recent order for a user
 *     tags:
 *       - Customer Orders
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User's ObjectId
 *                 required: true
 *               storeId:
 *                 type: string
 *                 description: Store's ObjectId (optional, filters by store)
 *     responses:
 *       200:
 *         description: Most recent order for the user
 *       400:
 *         description: Missing or invalid input
 *       404:
 *         description: No order found
 */

export async function POST(req: NextRequest) {
    await dbConnect();
    try {

        const { userId, storeId } = await req.json();

        if (!userId) {
            return NextResponse.json({ success: false, message: 'userId is required' }, { status: 400 });
        }
        
        if (!storeId) {
            return NextResponse.json({ success: false, message: 'storeId is required' }, { status: 400 });
        }

        const query: any = { userId, storeId }
        const order = await Order.findOne(query).sort({ createdAt: -1 });

        if (!order) {
            return NextResponse.json({ success: false, message: 'No order found for this user' }, { status: 404 });
        }

        if (order.createdAt) {
            order.createdAt = moment(order.createdAt)
                .tz('Asia/Kolkata')
                .format('MMM D, YYYY');
        }

        let medicines: any[] = [];
        if (order.medicineId && Array.isArray(order.medicineId) && order.medicineId.length > 0) {
            // medicines = await Medicine.find({ _id: { $in: order.medicineId } });
            medicines = await Medicine.find({
                _id: { $in: order.medicineId }
            })
                .select('_id name categoryId subCategoryId manufacturer isPrescription mrp price discount images stock coverImage')
                .lean();

        }

        // Get user's cart or guest cart
        let cartItems: any[] = [];
        if (userId && typeof userId === 'string' && userId.trim() !== "") {
            const cart = await Cart.findOne({ userId }).lean();
            cartItems = cart && typeof cart === 'object' && 'items' in cart && Array.isArray((cart as any).items) ? (cart as any).items : [];
        }

        for (const med of medicines) {

            let category = null;
            let subcategory = null;
            if (med.categoryId) {
                const cat = await import('@/models/Category').then(m => m.default.findById(med.categoryId).lean());
                category = cat || null;
            }
            if (med.subCategoryId) {
                const subcat = await import('@/models/SubCategory').then(m => m.default.findById(med.subCategoryId).lean());
                subcategory = subcat || null;
            }
            // Cart info
            med.cartItem = cartItems.find((item: any) => item.medicineId?.toString() === med._id?.toString());
            med.isInCart = !!med.cartItem;
            med.cartQuantity = med.cartItem ? med.cartItem.quantity : 0;
            med.category = category;
            med.subcategory = subcategory;

        }

        const finalMedicines = medicines.filter(med => {
            // Exclude if category is inactive
            if (med.categoryId && (!med.category || med.category.isActive === false)) return false;
            // Exclude if subcategory is inactive
            // if (med.subCategoryId && (!med.subcategory || med.subcategory.isActive === false)) return false;
            return true;
        });

        // Filter medicineQuantity so only items matching medicineId in finalMedicines (where medicineId matches _id) are included
        order.medicineQuantity = order.medicineQuantity.filter((item: any) => {
            return finalMedicines.some((med: any) => {
                // item.medicineId matches med._id
                return item.medicineId?.toString() === med._id?.toString();
            });
        });

        // Determine if any item requires a prescription
        const isPrescriptionRequired = finalMedicines.some((item: any) => item.isPrescription === true);

        return NextResponse.json(
            {
                success: true,
                message: 'Medicines fetched successfully',
                medicines: finalMedicines,
                medicineQuantity: order.medicineQuantity,
                isPrescriptionRequired: isPrescriptionRequired ? true : false,
                prescription_url: isPrescriptionRequired ? order?.prescription_url : [],
                orderCreatedAt: moment(order.createdAt)
                    .tz('Asia/Kolkata')
                    .format('MMM D, YYYY')
            },
            {
                status: 200,
            }
        );

    } catch (error) {
        return NextResponse.json({ success: false, message: 'Failed to fetch recent order', error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}

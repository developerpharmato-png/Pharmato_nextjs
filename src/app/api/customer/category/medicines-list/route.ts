import { NextRequest, NextResponse } from 'next/server';
import Medicine from '@/models/Medicine';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';
import Cart from '@/models/Cart';

/**
 * @swagger
 * /api/customer/category/medicines-list:
 *   post:
 *     summary: Get medicines by category/subcategory with cart info
 *     description: Returns medicines filtered by category, subcategory, price, manufacturer, etc. Adds isInCart and cartQuantity for the given userId.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId:
 *                 type: string
 *               subCategoryId:
 *                 type: string
 *               limit:
 *                 type: integer
 *                 default: 10
 *               offset:
 *                 type: integer
 *                 default: 0
 *               manufacturer:
 *                 type: string
 *               minPrice:
 *                 type: number
 *                 default: 0
 *               maxPrice:
 *                 type: number
 *               search:
 *                 type: string
 *               sortBy:
 *                 type: string
 *               columnName:
 *                 type: string
 *               userId:
 *                 type: string
 *                 description: User's ObjectId (can be empty)
 *     responses:
 *       200:
 *         description: Medicines list with cart info
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
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       manufacturer:
 *                         type: string
 *                       images:
 *                         type: array
 *                         items:
 *                           type: string
 *                       price:
 *                         type: number
 *                       mrp:
 *                         type: number
 *                       discount:
 *                         type: number
 *                       description:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 *                       categoryId:
 *                         type: string
 *                       subCategoryId:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                       updatedAt:
 *                         type: string
 *                       isInCart:
 *                         type: boolean
 *                         description: true if medicine is in user's cart
 *                       cartQuantity:
 *                         type: integer
 *                         description: quantity in cart if in cart, else 0
 *                 manufacturerList:
 *                   type: array
 *                   items:
 *                     type: string
 */

export async function POST(req: NextRequest) {
    await dbConnect();
    const {
        categoryId,
        subCategoryId,
        limit = 10,
        offset = 0,
        manufacturer,
        minPrice = 0,
        maxPrice,
        search,
        sortBy,
        columnName,
        userId = ""
    } = await req.json();

    // Set defaults if empty or invalid
    const sortField = columnName && columnName.trim() !== '' ? columnName : 'createdAt';
    const sortOrder = sortBy && sortBy.trim().toUpperCase() === 'ASC' ? 1 : -1;

    const matchStage: any = {
        isActive: true
    };

    if (categoryId) {
        matchStage.categoryId = new mongoose.Types.ObjectId(categoryId);
    }
    if (subCategoryId) {
        matchStage.subCategoryId = new mongoose.Types.ObjectId(subCategoryId);
    }
    if (manufacturer && manufacturer.trim() !== '') {
        matchStage.manufacturer = { $regex: manufacturer, $options: 'i' };
    }
    matchStage.price = {
        $gte: Number(minPrice),
        $lte: maxPrice ? Number(maxPrice) : Number.MAX_SAFE_INTEGER
    };
    if (search && search.trim() !== '') {
        matchStage.name = { $regex: search, $options: 'i' };
    }

    const skip = Number(offset);
    const lim = Number(limit);

    const pipeline: any[] = [
        { $match: matchStage },
        {
            $project: {
                _id: 1,
                name: 1,
                manufacturer: 1,
                images: 1,
                price: 1,
                mrp: 1,
                discount: 1,
                description: 1,
                isActive: 1,
                categoryId: 1,
                subCategoryId: 1,
                createdAt: 1,
                updatedAt: 1
            }
        },
        { $sort: { [sortField]: sortOrder } },
        { $skip: skip }
    ];
    if (lim > 0) {
        pipeline.push({ $limit: lim });
    }
    const medicines = await Medicine.aggregate(pipeline);

    // Get user's cart only if userId is not empty
    let cartItems: any[] = [];
    if (userId && typeof userId === 'string' && userId.trim() !== "") {
        const cart = await Cart.findOne({ userId }).lean();
        cartItems = cart && typeof cart === 'object' && 'items' in cart && Array.isArray((cart as any).items) ? (cart as any).items : [];
    }

    // Add isInCart and cartQuantity to each medicine
    const medicinesWithCart = medicines.map((med: any) => {
        const cartItem = cartItems.find((item: any) => item.medicineId?.toString() === med._id?.toString());
        const isInCart = !!cartItem;
        const cartQuantity = cartItem ? cartItem.quantity : 0;
        return {
            ...med,
            isInCart,
            cartQuantity,
        };
    });

    const manufacturerList = [...new Set(medicines.map(item => item.manufacturer))];

    return NextResponse.json({
        status: true,
        data: medicinesWithCart,
        manufacturerList
    });
}

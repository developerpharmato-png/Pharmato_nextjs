
import { NextRequest, NextResponse } from 'next/server';
import Medicine from '@/models/Medicine';
import Category from '@/models/Category';
import SubCategory from '@/models/SubCategory';
import Cart from '@/models/Cart';
import GuestCart from '@/models/GuestCart';
import dbConnect from '@/lib/mongodb';

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await context.params;
    const body = await req.json();
    const { userId, guestId } = body;
    if (!id) {
        return NextResponse.json({ success: false, message: 'Medicine id is required', data: null }, { status: 400 });
    }

    let medicine = await Medicine.findById(id)
        .populate({
            path: 'relatedProducts',
            select: '_id name manufacturer mrp price images discount'
        })
        .populate({
            path: 'crossSellProducts',
            select: '_id name manufacturer mrp price images discount'
        })
        .lean();
    if (Array.isArray(medicine)) {
        medicine = medicine[0];
    }
    if (!medicine) {
        return NextResponse.json({ success: false, message: 'Medicine not found', data: null }, { status: 404 });
    }

    let category = null;
    let subcategory = null;
    if (medicine && medicine.categoryId) {
        category = await Category.findById(medicine.categoryId).lean();
    }
    if (medicine && medicine.subCategoryId) {
        subcategory = await SubCategory.findById(medicine.subCategoryId).lean();
    }

    // Cart/GuestCart info
    let isInCart = false;
    let cartQuantity = 0;
    let cartItems: any[] = [];
    if (userId && typeof userId === 'string' && userId.trim() !== "") {
        const cart = await Cart.findOne({ userId }).lean();
        cartItems = cart && typeof cart === 'object' && 'items' in cart && Array.isArray((cart as any).items) ? (cart as any).items : [];
    } else if (guestId && typeof guestId === 'string' && guestId.trim() !== "") {
        const guestCart = await GuestCart.findOne({ guestId }).lean();
        cartItems = guestCart && typeof guestCart === 'object' && 'items' in guestCart && Array.isArray((guestCart as any).items) ? (guestCart as any).items : [];
    }
    const cartItem = cartItems.find((item: any) => item.medicineId?.toString() === medicine._id?.toString());
    isInCart = !!cartItem;
    cartQuantity = cartItem ? cartItem.quantity : 0;

    // Add isInCart and cartQuantity to each relatedProduct (find separately for each)
    let relatedProductsWithCart = [];
    if (medicine.relatedProducts && Array.isArray(medicine.relatedProducts)) {
        relatedProductsWithCart = medicine.relatedProducts.map((prod: any) => {
            let isInCart = false;
            let cartQuantity = 0;
            if (userId && typeof userId === 'string' && userId.trim() !== "") {
                const cart = cartItems && Array.isArray(cartItems) ? cartItems : [];
                const cartItem = cart.find((item: any) => item.medicineId?.toString() === prod._id?.toString());
                isInCart = !!cartItem;
                cartQuantity = cartItem ? cartItem.quantity : 0;
            } else if (guestId && typeof guestId === 'string' && guestId.trim() !== "") {
                const guestCart = cartItems && Array.isArray(cartItems) ? cartItems : [];
                const cartItem = guestCart.find((item: any) => item.medicineId?.toString() === prod._id?.toString());
                isInCart = !!cartItem;
                cartQuantity = cartItem ? cartItem.quantity : 0;
            }
            return {
                ...prod,
                isInCart,
                cartQuantity
            };
        });
    }
    if (medicine && Array.isArray(relatedProductsWithCart)) {
        medicine.relatedProducts = relatedProductsWithCart;
    }

    // Add isInCart and cartQuantity to each crossSellProduct (find separately for each)
    let crossSellProductsWithCart = [];
    if (medicine.crossSellProducts && Array.isArray(medicine.crossSellProducts)) {
        crossSellProductsWithCart = medicine.crossSellProducts.map((prod: any) => {
            let isInCart = false;
            let cartQuantity = 0;
            if (userId && typeof userId === 'string' && userId.trim() !== "") {
                const cart = cartItems && Array.isArray(cartItems) ? cartItems : [];
                const cartItem = cart.find((item: any) => item.medicineId?.toString() === prod._id?.toString());
                isInCart = !!cartItem;
                cartQuantity = cartItem ? cartItem.quantity : 0;
            } else if (guestId && typeof guestId === 'string' && guestId.trim() !== "") {
                const guestCart = cartItems && Array.isArray(cartItems) ? cartItems : [];
                const cartItem = guestCart.find((item: any) => item.medicineId?.toString() === prod._id?.toString());
                isInCart = !!cartItem;
                cartQuantity = cartItem ? cartItem.quantity : 0;
            }
            return {
                ...prod,
                isInCart,
                cartQuantity
            };
        });
    }
    if (medicine && Array.isArray(crossSellProductsWithCart)) {
        medicine.crossSellProducts = crossSellProductsWithCart;
    }
    return NextResponse.json({
        success: true,
        message: 'Medicine details fetched successfully',
        data: {
            ...medicine,
            category,
            subcategory,
            isInCart,
            cartQuantity
        }
    });
}

/**
 * @swagger
 * /api/customer/medicines/detail/{id}:
 *   post:
 *     summary: Get medicine details by ID and user cart info
 *     tags:
 *       - Medicine
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Medicine MongoDB ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User MongoDB ID (for logged-in users)
 *               guestId:
 *                 type: string
 *                 description: Guest ID (for guest users)
 *     responses:
 *       200:
 *         description: Medicine details with cart info
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
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     category:
 *                       type: object
 *                     subcategory:
 *                       type: object
 *                     isInCart:
 *                       type: boolean
 *                       description: true if medicine is in user's cart
 *                     cartQuantity:
 *                       type: integer
 *                       description: quantity in cart if in cart, else 0
 *       400:
 *         description: Medicine id is required
 *       404:
 *         description: Medicine not found
 */

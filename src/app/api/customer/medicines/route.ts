
/**
 * @swagger
 * /api/customer/medicines:
 *   post:
 *     summary: Get paginated medicines with cart info for a user
 *     description: Returns medicines with category, subcategory, and cart status/quantity for the given userId.
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
 *               userId:
 *                 type: string
 *                 description: User's ObjectId (for logged-in users)
 *               guestId:
 *                 type: string
 *                 description: Guest ID (for guest users)
 *               storeId:
 *                 type: string
 *                 description: Filter medicines by storeId
 *     responses:
 *       200:
 *         description: Medicines list with cart info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 medicines:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       price:
 *                         type: number
 *                       category:
 *                         type: object
 *                       subcategory:
 *                         type: object
 *                       isInCart:
 *                         type: boolean
 *                         description: true if medicine is in user's cart
 *                       cartQuantity:
 *                         type: integer
 *                         description: quantity in cart if in cart, else 0
 *                 total:
 *                   type: integer
 *       400:
 *         description: userId is required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
import { NextRequest, NextResponse } from 'next/server';
import Medicine from '@/models/Medicine';
import Cart from '@/models/Cart';
import GuestCart from '@/models/GuestCart';
import { allowedOrigins } from '@/lib/allowedOrigins';
import dbConnect from '@/lib/mongodb';

// export async function POST(req: NextRequest) {
//     await dbConnect();
//     const { limit = 10, offset = 0, search = "", userId, guestId, storeId } = await req.json();

//     // Build filter for search
//     const filter: Record<string, any> = { isActive: true };
//     if (search && search.trim() !== "") {
//         filter.name = { $regex: search, $options: "i" };
//     }
//     // Optional store filter
//     if (storeId && typeof storeId === 'string' && storeId.trim() !== '') {
//         filter.storeId = storeId.trim();
//     }

//     // Fetch medicines with pagination
//     const medicines = await Medicine.find(filter)
//         .skip(offset)
//         .limit(limit)
//         .lean();

//     // Get user's cart or guest cart
//     let cartItems: any[] = [];
//     if (userId && typeof userId === 'string' && userId.trim() !== "") {
//         const cart = await Cart.findOne({ userId }).lean();
//         cartItems = cart && typeof cart === 'object' && 'items' in cart && Array.isArray((cart as any).items) ? (cart as any).items : [];
//     } else if (guestId && typeof guestId === 'string' && guestId.trim() !== "") {
//         const guestCart = await GuestCart.findOne({ guestId }).lean();
//         cartItems = guestCart && typeof guestCart === 'object' && 'items' in guestCart && Array.isArray((guestCart as any).items) ? (guestCart as any).items : [];
//     }

//     // Loop and populate category, subcategory, and cart info
//     const populatedMedicines = (
//         await Promise.all(
//             medicines.map(async (med: any) => {
//                 let category = null;
//                 let subcategory = null;
//                 if (med.categoryId) {
//                     const cat = await import('@/models/Category').then(m => m.default.findById(med.categoryId).lean());
//                     category = cat || null;
//                 }
//                 if (med.subCategoryId) {
//                     const subcat = await import('@/models/SubCategory').then(m => m.default.findById(med.subCategoryId).lean());
//                     subcategory = subcat || null;
//                 }
//                 // Cart info
//                 const cartItem = cartItems.find((item: any) => item.medicineId?.toString() === med._id?.toString());
//                 const isInCart = !!cartItem;
//                 const cartQuantity = cartItem ? cartItem.quantity : 0;
//                 return {
//                     ...med,
//                     category,
//                     subcategory,
//                     isInCart,
//                     cartQuantity,
//                 };
//             })
//         )
//     ).filter(med => {
//         // Exclude if category is inactive
//         if (med.categoryId && (!med.category || med.category.isActive === false)) return false;
//         return true;
//     });

//     // Get total count for pagination info
//     const total = await Medicine.countDocuments(filter);

//     return NextResponse.json(
//         {
//             success: true,
//             message: 'Medicines fetched successfully',
//             medicines: populatedMedicines,
//             total
//         },
//         {
//             status: 200,
//         }
//     );

// }

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const {
      limit = 10,
      offset = 0,
      search = "",
      userId,
      guestId,
      storeId,
    } = await req.json();

    const parsedLimit = Number(limit) || 10;
    const parsedOffset = Number(offset) || 0;

    // -----------------------------
    // Build Filter
    // -----------------------------
    const filter: any = { isActive: true };

    if (search && search.trim() !== "") {
      filter.name = {
        $regex: search.trim(),
        $options: "i",
      };
    }

    if (storeId && storeId.trim() !== "") {
      filter.storeId = storeId.trim();
    }

    // -----------------------------
    // Fetch medicines & total count
    // -----------------------------
    const [medicines] = await Promise.all([
      Medicine.find(filter)
        .skip(parsedOffset)
        .limit(parsedLimit)
        .populate({
          path: "categoryId",
          match: { isActive: true }, // Only active category
        })
        .populate("subCategoryId")
        .lean()
    ]);

    // console.log("Fetched medicines:", medicines);

    // -----------------------------
    // Get Cart Items
    // -----------------------------
    let cartItems: any[] = [];

    if (userId && userId.trim() !== "") {
      const cart : any = await Cart.findOne({ userId }).lean();
      cartItems = cart?.items || [];
    } else if (guestId && guestId.trim() !== "") {
      const guestCart : any = await GuestCart.findOne({ guestId }).lean();
      cartItems = guestCart?.items || [];
    }

    // Convert cart to Map (O(1) lookup)
    const cartMap = new Map(
      cartItems.map((item: any) => [
        item.medicineId?.toString(),
        item.quantity,
      ])
    );

    // -----------------------------
    // Final Formatting
    // -----------------------------
    const formattedMedicines = medicines
      .filter((med: any) => med.categoryId !== null) // Remove inactive category medicines
      .map((med: any) => {
        const quantity = cartMap.get(med._id.toString()) || 0;

        return {
          _id: med._id,
          name: med.name,
          price: med.price,
          mrp: med.mrp,          
          discount: med.discount,          
          stock: med.stock,          
          images: med.images,
          coverImage: med.coverImage,
          description: med.description,
          manufacturer: med.manufacturer,
          category: med.categoryId || null,
          subcategory: med.subCategoryId || null,
          isInCart: quantity > 0,
          cartQuantity: quantity,
        };
      });



    return NextResponse.json(
      {
        success: true,
        message: "Medicines fetched successfully",
        medicines: formattedMedicines,
        total : formattedMedicines.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Medicines API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
import Coupon, { ICoupon } from './Coupon';
import mongoose from 'mongoose';

interface CartItem {
    medicineId: string;
    categoryId?: string;
    price: number;
    quantity: number;
}

interface Cart {
    items: CartItem[];
    total: number;
}

interface CouponResult {
    discount: number;
    eligibleAmount: number;
    reason?: string;
    coupon?: ICoupon;
}


export async function validateAndApplyCoupon(
    couponCode: string,
    cartFromApi: any
): Promise<CouponResult> {
    // Extract userId and guestId from cartFromApi
    const userId = cartFromApi.userId;
    const guestId = cartFromApi.guestId;
    // Transform cartFromApi to Cart format
    const cart: Cart = {
        items: (cartFromApi.items || []).map((item: any) => ({
            medicineId: item.medicineId._id,
            categoryId: item.medicineId.categoryId,
            price: item.medicineId.price,
            quantity: item.quantity
        })),
        total: (cartFromApi.items || []).reduce(
            (sum: number, item: any) => sum + item.medicineId.price * item.quantity,
            0
        )
    };

    // 1. Check if coupon exists
    const coupon = await Coupon.findOne({ code: couponCode.trim().toUpperCase() });
    if (!coupon) return { discount: 0, eligibleAmount: 0, reason: 'Coupon not found' };

    // 2. Check active, startAt, endAt
    const now = new Date();
    if (!coupon.isActive) return { discount: 0, eligibleAmount: 0, reason: 'Coupon is not active' };
    if (now < coupon.startAt) return { discount: 0, eligibleAmount: 0, reason: 'Coupon not started yet' };
    if (now > coupon.endAt) return { discount: 0, eligibleAmount: 0, reason: 'Coupon expired' };

    // 3. Check totalUses and perUserLimit
    if (coupon.totalUses !== null && coupon.usedCount >= coupon.totalUses) {
        return { discount: 0, eligibleAmount: 0, reason: 'Coupon usage limit reached' };
    }
    // Find usage for either user or guest
    const userOrGuestUsage = (coupon.usersOrGuestsUsed || []).find((u: { userId?: any; guestId?: string; uses: number }) =>
        (userId && u.userId && u.userId.toString() === userId) ||
        (guestId && u.guestId === guestId)
    );
    if (coupon.perUserLimit != null && userOrGuestUsage && userOrGuestUsage.uses >= coupon.perUserLimit) {
        return { discount: 0, eligibleAmount: 0, reason: 'You have used this coupon maximum allowed times' };
    }

    // 4. Check minOrderValue
    if (cart.total < coupon.minOrderValue) {
        return { discount: 0, eligibleAmount: 0, reason: `Minimum order value is ${coupon.minOrderValue}` };
    }

    // 5. Scope-based filtering
    let eligibleItems: CartItem[] = [];
    if (coupon.scope === 'global') {
        eligibleItems = cart.items;
    } else if (coupon.scope === 'category') {
        eligibleItems = cart.items.filter(item =>
            (coupon.includedCategoryIds || []).includes(item.categoryId || '')
        );
    } else if (coupon.scope === 'product') {
        eligibleItems = cart.items.filter(item =>
            (coupon.includedProductIds || []).includes(item.medicineId)
        );
    }

    // 6. Exclude products if listed
    eligibleItems = eligibleItems.filter(item =>
        !(coupon.excludedProductIds || []).includes(item.medicineId)
    );

    // 7. Calculate eligible amount
    const eligibleAmount = eligibleItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );
    if (eligibleAmount === 0) {
        return { discount: 0, eligibleAmount: 0, reason: 'No eligible items for coupon' };
    }

    // 8. Calculate discount
    let discount = 0;
    if (coupon.type === 'percentage') {
        discount = (eligibleAmount * coupon.value) / 100;
        if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
            discount = coupon.maxDiscountAmount;
        }
    } else if (coupon.type === 'fixed') {
        discount = coupon.value;
        if (discount > eligibleAmount) discount = eligibleAmount;
    }

    return { discount, eligibleAmount, coupon };
}

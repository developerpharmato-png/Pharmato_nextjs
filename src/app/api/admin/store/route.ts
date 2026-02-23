import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Store from '@/models/Store';
import Pincode from '@/models/Pincode';
import Admin from '@/models/Admin';
import Notification from '@/models/Notification';
import { sendPushNotificationWithData } from '@/utils/firebase.helper';

// POST: List all stores (with search and filters in body)
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();
        const { search = '', isListRequest = false } = body;

        // If this is a list request (not a create request)
        if (isListRequest) {
            const searchTrim = search.trim();
            let query: any = {};
            if (searchTrim) {
                const regex = { $regex: searchTrim, $options: 'i' };
                query = { $or: [{ name: regex }, { servicePinCodes: regex }] };
            }

            const stores = await Store.find(query)
                .populate('adminManagerId', 'email firstName lastName')
                .lean()
                .exec();
            return NextResponse.json({ success: true, message: 'Stores fetched successfully', data: stores });
        }

        // Otherwise, create a new store
        const { name, servicePinCodes, address, GoogleAddress, status, adminManagerId } = body;
        if (!name || typeof name !== 'string') {
            return NextResponse.json({ success: false, message: 'Store name is required' }, { status: 400 });
        }

        // Generate uniqueCode
        const count = await Store.countDocuments({ uniqueCode: { $exists: true } });
        const uniqueCode = `STO-${String(count + 1).padStart(3, '0')}`;

        const store = await Store.create({ name, uniqueCode, servicePinCodes, address, GoogleAddress, status, adminManagerId });

        // If adminManagerId provided, link store to admin.managedStores
        if (adminManagerId) {
            await Admin.updateOne(
                { _id: adminManagerId },
                {
                    $addToSet: {
                        managedStores: { storeId: store._id, storeName: name },
                    },
                }
            );
        }
        const populatedStore = await Store.findById(store._id).populate('adminManagerId', 'email firstName lastName');   

        const admin = await Admin.findById(adminManagerId).lean();

        if (admin && typeof admin === 'object' && !Array.isArray(admin)) {

            // Notify store admin
            await Notification.create({
                userId: adminManagerId.toString(),
                role: 'admin',
                title: 'New Store Assigned',
                message: `Store Assigned : You have been assigned as the Store Manager for ${name}. You can now manage orders for this store.`,
                type: 'store',
                targetScreen: 'stores/detail',
                targetId: store._id.toString(),
                meta: { storeName: name }
            });

            try {
                const adminToken = (admin as any).deviceToken;
                if (adminToken) {
                    await sendPushNotificationWithData({
                        token: adminToken,
                        title: 'Pharmato',
                        body: `Store Assigned : You have been assigned as the Store Manager for ${name}. You can now manage orders for this store.`,
                        data: { storeName: name }
                    });
                }
            } catch (err) {
                console.error('Failed to send push notification to admin:', err);
            }

        }

        return NextResponse.json({ success: true, message: 'Store added successfully', data: populatedStore }, { status: 201 });
    } catch (error: any) {
        console.error('POST /api/admin/store error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to process request', error: error?.message },
            { status: 500 }
        );
    }
}

// PUT: Update a store by ID
export async function PUT(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ success: false, message: 'Store ID is required' }, { status: 400 });
        }
        const { name, servicePinCodes, address, GoogleAddress, status, adminManagerId } = await req.json();

        const existing = await Store.findById(id);
        if (!existing) {
            return NextResponse.json({ success: false, message: 'Store not found' }, { status: 404 });
        }

        const prevAdminId = existing.adminManagerId?.toString();

        // Ensure uniqueCode exists for old stores
        let uniqueCode = existing.uniqueCode;
        if (!uniqueCode) {
            const count = await Store.countDocuments({ uniqueCode: { $exists: true } });
            uniqueCode = `STO-${String(count + 1).padStart(3, '0')}`;
        }

        const updated = await Store.findByIdAndUpdate(
            id,
            { name, uniqueCode, servicePinCodes, address, GoogleAddress, status, adminManagerId },
            { new: true }
        ).populate('adminManagerId', 'email firstName lastName');
        if (!updated) {
            return NextResponse.json({ success: false, message: 'Store not found' }, { status: 404 });
        }

        const newAdminId = adminManagerId ? adminManagerId.toString() : undefined;

        // Remove store from previous admin if changed
        if (prevAdminId && prevAdminId !== newAdminId) {
            await Admin.updateOne(
                { _id: prevAdminId },
                { $pull: { managedStores: { storeId: updated._id } } }
            );
        }

        // Add store to new admin
        if (newAdminId) {
            await Admin.updateOne(
                { _id: newAdminId },
                {
                    $addToSet: {
                        managedStores: { storeId: updated._id, storeName: name },
                    },
                }
            );
        }

        // Sync storeName across admins for this store
        await Admin.updateMany(
            { 'managedStores.storeId': updated._id },
            { $set: { 'managedStores.$.storeName': name } }
        );        

        const admin = await Admin.findById(adminManagerId).lean();

        if (admin && typeof admin === 'object' && !Array.isArray(admin)) {

            // Notify store admin
            await Notification.create({
                userId: adminManagerId.toString(),
                role: 'admin',
                title: 'New Store Assigned',
                message: `You have been assigned to manage a new store: ${name}.`,
                type: 'store',
                targetScreen: 'stores/detail',
                targetId: existing._id.toString(),
                meta: { storeName: name }
            });

            try {
                const adminToken = (admin as any).deviceToken;
                if (adminToken) {
                    await sendPushNotificationWithData({
                        token: adminToken,
                        title: 'Pharmato',
                        body: `Store Assigned : You have been assigned as the Store Manager for ${name}. You can now manage orders for this store.`,
                        data: { storeName: name }
                    });
                }
            } catch (err) {
                console.error('Failed to send push notification to admin:', err);
            }

        }

        return NextResponse.json({ success: true, message: 'Store updated successfully', data: updated });
    } catch (error: any) {
        console.error('PUT /api/admin/store error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to update store', error: error?.message },
            { status: 500 }
        );
    }
}

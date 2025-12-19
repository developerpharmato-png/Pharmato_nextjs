/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Admin login
 *     tags:
 *       - Admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "admin@example.com"
 *               password:
 *                 type: string
 *                 example: "yourpassword"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Admin'
 *                 message:
 *                   type: string
 *       400:
 *         description: Missing email or password
 *       401:
 *         description: Invalid email or password
 */
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import Role from '@/models/Role';
import bcrypt from 'bcryptjs';
import { signJwt } from '@/lib/jwt';
import Store from '@/models/Store';


export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const body = await request.json();
        const { email, password } = body;

        // Validate input
        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Find admin by email
        const admin = await Admin.findOne({ email: email.toLowerCase() });
        if (!admin) {
            return NextResponse.json(
                { success: false, error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            return NextResponse.json(
                { success: false, error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // populate role info (workaround strictPopulate if needed)
        const populated = await admin.populate({ path: 'roleId', strictPopulate: false } as any).catch(() => admin);

        // Return user data without password and include roleId & roleName
        const adminObj = populated.toObject ? populated.toObject() : (populated as any);
        delete (adminObj as any).password;

        let role = adminObj.roleId || null;
        const roleId = role && role._id ? String(role._id) : (role ? String(role) : null);
        let roleName = role && role.name ? role.name : null;

        // Fallback: if populate didn't return role name, try direct lookup
        if (!roleName && roleId) {
            try {
                const roleDoc: any = await Role.findById(roleId).select('name').lean();
                if (roleDoc && roleDoc.name) {
                    roleName = roleDoc.name;
                }
            } catch (e) {
                // ignore lookup errors and keep roleName null
            }
        }

        // Ensure top-level roleId/roleName for client convenience
        adminObj.roleId = roleId;
        adminObj.roleName = roleName;

        // Expose managedStores for store selection/permissions
        // If none on the admin doc, hydrate from Store.adminManagerId for backward compatibility
        if (!adminObj.managedStores || adminObj.managedStores.length === 0) {
            const stores = await Store.find({ adminManagerId: adminObj._id })
                .select('_id name')
                .lean();
            adminObj.managedStores = (stores || []).map((s: any) => ({ storeId: s._id, storeName: s.name }));
        }

        // Issue access and refresh tokens (access: 24h, refresh: no expiry)
        const accessToken = signJwt({
            adminId: adminObj._id,
            email: adminObj.email,
            roleId: adminObj.roleId,
            roleName: adminObj.roleName,
            role: 'admin'
        }, '24h');

        const refreshToken = signJwt({
            adminId: adminObj._id,
            email: adminObj.email,
            roleId: adminObj.roleId,
            roleName: adminObj.roleName,
            role: 'admin'
        }, undefined); // no expiry

        // Store refresh token in admin document (single session)
        await Admin.findByIdAndUpdate(adminObj._id, { refreshToken: refreshToken });

        // Return data and set access token cookie
        const response = NextResponse.json({
            success: true,
            data: adminObj,
            message: 'Login successful'
        });
        response.cookies.set('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 // 1 day
        });
        // Also set refresh token as HTTP-only cookie (longer expiry)
        response.cookies.set('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 30 // 30 days
        });
        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to login' },
            { status: 500 }
        );
    }
}
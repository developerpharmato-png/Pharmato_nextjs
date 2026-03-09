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
import crypto from 'crypto';


export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const body = await request.json();
        const { email, password, deviceToken } = body;

        // 1️⃣ Validate Input
        if (!email || !password) {
            return NextResponse.json(
                { success: false, message: 'Email and password are required' },
                { status: 400 }
            );
        }

        const normalizedEmail = email.toLowerCase().trim();

        // 2️⃣ Find Admin
        const admin: any = await Admin.findOne({ email: normalizedEmail });

        if (!admin) {
            return NextResponse.json(
                { success: false, message: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // 3️⃣ Password Check
        const isPasswordValid = await bcrypt.compare(password, admin.password);

        if (!isPasswordValid) {
            return NextResponse.json(
                { success: false, message: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // 4️⃣ Admin Active Check
        if (!admin.isActive) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        'Your account has been deactivated. Please contact administrator'
                },
                { status: 403 }
            );
        }

        // 5️⃣ Role Active Check
        let roleName = null;
        let roleId = null;

        if (admin.roleId) {
            const role: any = await Role.findById(admin.roleId)
                .select('name isActive')
                .lean();

            if (!role || !role.isActive) {
                return NextResponse.json(
                    {
                        success: false,
                        message:
                            'Your role has been deactivated. Please contact administrator'
                    },
                    { status: 403 }
                );
            }

            roleName = role.name;
            roleId = role._id;
        }

        // 6️⃣ Device Token Cleanup
        if (deviceToken) {            
            await Admin.updateMany(
                { deviceToken: deviceToken },
                { $set: { deviceToken: '' } }
            );
        }

        // 7️⃣ Managed Stores Load
        let managedStores = admin.managedStores;

        if (!managedStores || managedStores.length === 0) {
            const stores: any = await Store.find({ adminManagerId: admin._id })
                .select('_id name')
                .lean();

            managedStores = stores.map((s: any) => ({
                storeId: s._id,
                storeName: s.name
            }));
        }

        // 8️⃣ Session Generate
        const sessionId = crypto.randomBytes(16).toString('hex');

        // 9️⃣ Access Token
        const accessToken = signJwt(
            {
                adminId: admin._id,
                email: admin.email,
                roleId,
                roleName,
                role: 'admin',
                sessionId
            },
            '24h'
        );

        // 🔟 Refresh Token
        const refreshToken = signJwt(
            {
                adminId: admin._id,
                email: admin.email,
                roleId,
                roleName,
                role: 'admin',
                sessionId
            },
            '30d'
        );

        // 1️⃣1️⃣ Update Session in DB
        await Admin.findByIdAndUpdate(admin._id, {
            sessionToken: accessToken,
            refreshToken: refreshToken,
            sessionId,
            deviceToken: deviceToken || ''
        });

        // 1️⃣2️⃣ Prepare Response Object
        const adminObj: any = admin.toObject();

        delete adminObj.password;

        adminObj.roleId = roleId;
        adminObj.roleName = roleName;
        adminObj.managedStores = managedStores;
        adminObj.sessionToken = accessToken;
        adminObj.refreshToken = refreshToken;
        adminObj.sessionId = sessionId;
        adminObj.deviceToken = deviceToken || null;

        // 1️⃣3️⃣ Create Response
        const response = NextResponse.json({
            success: true,
            data: adminObj,
            message: 'Login successful'
        });

        // 1️⃣4️⃣ Access Token Cookie
        response.cookies.set('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24
        });

        // 1️⃣5️⃣ Refresh Token Cookie
        response.cookies.set('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 30
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
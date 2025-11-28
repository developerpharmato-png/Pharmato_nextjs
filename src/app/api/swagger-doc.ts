import { createSwaggerSpec } from 'next-swagger-doc';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
    const spec = createSwaggerSpec({
        definition: {
            openapi: '3.0.0',
            info: {
                title: 'Medicine Management System API',
                version: '1.0.0',
            },
        },
        apiFolder: 'src/app/api',
        schemaFolders: ['src/models'],
    });
    /**
     * @swagger
    * /api/settings/get-by-type:
    *   post:
    *     summary: Get setting data by type
    *     tags:
    *       - Settings
    *     requestBody:
    *       required: true
    *       content:
    *         application/json:
    *           schema:
    *             type: object
    *             properties:
    *               type:
    *                 type: string
    *                 description: The type of setting to fetch
    *     responses:
    *       200:
    *         description: Setting data found
    *         content:
    *           application/json:
    *             schema:
    *               type: object
    *               properties:
    *                 status:
    *                   type: boolean
    *                 data:
    *                   $ref: '#/components/schemas/Setting'
    *                 message:
    *                   type: string
    * /api/customer/users/{id}/delete:
    *   put:
    *     summary: Delete user (customer, soft delete)
    *     tags:
    *       - Customer
    *     parameters:
    *       - in: path
    *         name: id
    *         required: true
    *         schema:
    *           type: string
    *         description: User ID
    *     responses:
    *       200:
    *         description: User deleted (isDelete set to true)
    *         content:
    *           application/json:
    *             schema:
    *               type: object
    *               properties:
    *                 success:
    *                   type: boolean
    *                 data:
    *                   $ref: '#/components/schemas/User'
    *                 error:
    *                   type: string
    * /api/admin/users/{id}/delete:
    *   put:
    *     summary: Toggle user delete status (soft delete/restore)
    *     tags:
    *       - Admin
    *     parameters:
    *       - in: path
    *         name: id
    *         required: true
    *         schema:
    *           type: string
    *         description: User ID
    *     responses:
    *       200:
    *         description: User delete status toggled
    *         content:
    *           application/json:
    *             schema:
    *               type: object
    *               properties:
    *                 success:
    *                   type: boolean
    *                 data:
    *                   $ref: '#/components/schemas/User'
    *                 error:
    *                   type: string
     * /api/admin/marg:
     *   post:
     *     summary: Fetch product data from MargERP
     *     tags:
     *       - Marg
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               CompanyCode:
     *                 type: string
     *               MargID:
     *                 type: integer
     *               Datetime:
     *                 type: string
     *               index:
     *                 type: integer
     *     responses:
     *       200:
     *         description: MargERP product data
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   type: object
     *                 error:
     *                   type: string
     */
    return NextResponse.json(spec);
}

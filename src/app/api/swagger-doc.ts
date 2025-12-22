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
    return NextResponse.json(spec);
}



/**
 * @swagger
 * /api/customer/notifications:
 *   post:
 *     summary: Send notification to customer (dummy)
 *     tags:
 *       - Customer
 *     description: Dummy endpoint to simulate sending a notification to a customer. No request body required.
 *     requestBody:
 *       required: false
 *     responses:
 *       200:
 *         description: Notification sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *             example:
 *               success: true
 *               message: Notification sent to customer (dummy)
 */
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
 *       404:
 *         description: No data found
 */


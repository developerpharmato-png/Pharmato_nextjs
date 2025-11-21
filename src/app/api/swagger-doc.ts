import { createSwaggerSpec } from 'next-swagger-doc';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
    const spec = createSwaggerSpec({
        title: 'Medicine Management System API',
        version: '1.0.0',
        apiFolder: 'src/app/api',
        schemaFolder: 'src/models',
    });
    /**
     * @swagger
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

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
}

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
        * parameters:
* - in: path
        * name: id
            * required: true
                * schema:
* type: string
        * description: Medicine MongoDB ID
            * requestBody:
* required: true
        * content:
* application / json:
* schema:
* type: object
        * description: quantity in cart if in cart, else 0
            * 400:
* description: Medicine id is required
*/


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

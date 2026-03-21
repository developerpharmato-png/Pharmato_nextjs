export const runtime = "nodejs";

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';
import Order from '@/models/Order';
import Notification from '@/models/Notification';
import User from '@/models/User';
import Medicine from '@/models/Medicine';
import * as XLSX from 'xlsx';


/**
 * @swagger
 * /api/customer/dummy/upload-excel:
 *   post:
 *     summary: Upload an Excel file and parse its content
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Excel data parsed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 message:
 *                   type: string
 */

export async function POST(request: NextRequest) {
    await dbConnect();
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        if (!file || !(file instanceof File)) {
            return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
        }
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        // Read workbook
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        // Convert to JSON, first row as keys
        const data: any = XLSX.utils.sheet_to_json(worksheet, { defval: null });

        const bulkOps: any[] = [];

        for (const element of data) {

            const checkMedicine = await Medicine.findOne({ uniqueIdentity: element.uniqueIdentity });

            if (checkMedicine) {

                const isOtc = element.isOtc == 'Y' || element.isOtc == 'y' ? true : false;
                const isPrescription = element.isPrescription == 'Y' || element.isPrescription == 'y' ? true : false;
                const composition = element.composition ? element.composition.split(',').map((comp: string) => comp.trim()) : [];

                const medObj = {
                    name: element.name,
                    manufacturer: element.manufacturer,
                    medicineType: element.medicineType,
                    unit: element.unit ? element.unit : "",
                    description: element.description,
                    isOTC: isOtc,
                    isPrescription: isPrescription,
                    composition: composition
                };

                bulkOps.push({
                    updateOne: {
                        filter: { uniqueIdentity: element.uniqueIdentity },     // If exists → update
                        update: {
                            $set: medObj
                        }                          // If not exists → insert
                    }
                });

            }

        }

        // 🚀 BULK WRITE (super fast for both insert + update)
        if (bulkOps.length > 0) {
            await Medicine.bulkWrite(bulkOps, { ordered: false });
        }

        console.log('Excel Data:', data);
        return NextResponse.json({ success: true, data : bulkOps, message: 'Excel data parsed successfully' });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

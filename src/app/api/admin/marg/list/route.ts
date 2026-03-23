import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';
import moment from 'moment-timezone';
import Wallet from '@/models/Wallet';
import Marg from '@/models/Marg';

/**
 * @swagger
 * /api/admin/marg/list:
 *   post:
 *     summary: Get list of orders for a customer
 *     tags:
 *       - Admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               limit:
 *                 type: integer
 *                 description: Number of items to return
 *                 default: 10
 *               offset:
 *                 type: integer
 *                 description: Number of items to skip
 *                 default: 1
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Missing or invalid input
 */

export async function POST(req: NextRequest) {
    await dbConnect();

    const body = await req.json();
    const limit = typeof body.limit === 'number' && body.limit > 0 ? body.limit : 10;
    const offsetData = typeof body.offset === 'number' && body.offset >= 0 ? body.offset : 0;
    const offset = (Number(offsetData) - 1) * limit;

    const margList : any[] = await Marg.find({})
        .select({
            _id: 1,
            uniqueCode: 1,
            margGetDataCount: 1,
            margInsertDataCount: 1,
            margUpdateDataCount: 1,
            status: 1,
            type: 1,
            createdAt: 1,
            updatedAt: 1
        })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean();


    for (const marg of margList) {
        if (marg.createdAt) {
            marg.createdAt = moment(marg.createdAt)
                .tz('Asia/Kolkata')
                .format('MMM D, YYYY HH:mm z');
        }
        if (marg.updatedAt) {
            marg.updatedAt = moment(marg.updatedAt)
                .tz('Asia/Kolkata')
                .format('MMM D, YYYY HH:mm z');
        }
    }

    const totalCount = await Marg.countDocuments({});

    return NextResponse.json({
        status: true,
        data: margList,
        limit,
        offset,
        totalCount,
        lastSyncDateTime: margList[0].createdAt
    });
}


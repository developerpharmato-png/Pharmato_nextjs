import { NextRequest, NextResponse } from 'next/server';
import dbConnect from "@/lib/mongodb";
import cron from 'node-cron';

export async function POST(req: NextRequest) {
  await dbConnect();

  console.log("🔥 CRON CHAL GAYA");

  return NextResponse.json({ success: true }); 
}

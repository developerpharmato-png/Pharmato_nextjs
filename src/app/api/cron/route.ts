import { NextRequest, NextResponse } from 'next/server';
import dbConnect from "@/lib/mongodb";
import cron from 'node-cron';

export async function POST(req: NextRequest) {
  await dbConnect();

  console.log("🔥 CRON CHAL GAYA");

    //   // Example: run every minute
    // cron.schedule('* * * * *', () => {
    //   console.log('Scheduler running at', new Date().toISOString());
    //   // 🔥 Yahan apna task likh sakte ho, jaise DB update ya API call
    // });

  return NextResponse.json({ success: true }); 
}

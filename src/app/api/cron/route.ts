import { NextRequest, NextResponse } from 'next/server';
import dbConnect from "@/lib/mongodb";
import { sendPushNotificationWithData } from '@/utils/firebase.helper';

export async function POST(req: NextRequest) {
  await dbConnect(); 

  console.log("🔥 CRON JOB EXECUTED", new Date().toISOString());

  await sendPushNotificationWithData({
    token: "f0dMsw4nTtyZ8ZbRCYY3FC:APA91bHnKR2YYcDnkZPyNC9oVO0Xpi57dCIhWR2DDjYEdmgpBgk2weQ6vp1yjvXiFpqQV4jg7B7pHmRsENhP5mwkUZvFn6eFpcK4b2ZcZ6NpD0SA4M7K-kk",
    title: "Pharmato",
    body: `🔥 CRON JOB EXECUTED ${new Date().toISOString()}`,
    data: {}
  });

  return NextResponse.json({ success: true });
}

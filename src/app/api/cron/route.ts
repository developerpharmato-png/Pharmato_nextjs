import { NextRequest, NextResponse } from 'next/server';
import dbConnect from "@/lib/mongodb";
import { sendPushNotificationWithData } from '@/utils/firebase.helper';

export async function POST(req: NextRequest) {
  await dbConnect(); 

  console.log("🔥 CRON JOB EXECUTED", new Date().toISOString());

  await sendPushNotificationWithData({
    token: "en9Qc-BYT26emCwhoWHHFv:APA91bECQqRUUuC36gc70z6ZSre9kkGtvtCdThkj9g5Exw_bxXP7x98_KIN4C3inDgV17MW3UWn8qo2hXRm89qIZZVb62K1vpm4FoBN-GeoXjeqCcI-eMrI",
    title: "Pharmato",
    body: `🔥 CRON JOB EXECUTED ${new Date().toISOString()}`,
    data: {}
  });

  return NextResponse.json({ success: true });
}

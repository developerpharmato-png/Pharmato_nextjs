import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";

export async function GET() {
  await dbConnect();

  console.log("🔥 CRON CHAL GAYA");

  return NextResponse.json({ success: true }); 
}
 
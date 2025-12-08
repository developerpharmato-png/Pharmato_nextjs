import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Medicine from "@/models/Medicine";

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { id, isActive } = body || {};

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });
    }

    const updated = await Medicine.findByIdAndUpdate(
      id,
      { isActive: !!isActive },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: "Medicine not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    console.error("PATCH /api/medicines/status error", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to update status" }, { status: 500 });
  }
}

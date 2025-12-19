import { NextResponse } from 'next/server';
import authorize from '@/middleware/authorize';

export async function POST(req: Request) {
    // Reuse server-side authorize() which can access DB and JWT
    const authRes = await authorize(req as any);
    if (authRes) return authRes;
    // console.log("Internal verify chala");
    return NextResponse.json({ success: true });
}

import { NextResponse } from 'next/server';

export async function POST() {
    try {
        return NextResponse.json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Failed to logout' },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from 'next/server';

// Webhook endpoint deprecated. Return 410 Gone to avoid SMTP attempts from production.
export async function POST(_request: NextRequest) {
    return NextResponse.json({ success: false, error: 'Deprecated: webhook disabled. Use RESEND_API_KEY and external provider.' }, { status: 410 });
}
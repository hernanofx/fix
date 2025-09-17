import { NextRequest, NextResponse } from 'next/server';

// This endpoint has been deprecated in favor of using an external HTTP provider (Resend).
// Returning 410 Gone to avoid accidental SMTP/Zoho calls from production.
export async function POST(_request: NextRequest) {
    return NextResponse.json({ success: false, error: 'Deprecated: use RESEND_API_KEY and external provider. Zoho endpoint disabled.' }, { status: 410 });
}
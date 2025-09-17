import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

async function runEmailTests() {
    const results: Record<string, any> = {};

    // Only test Resend availability now (SMTP and Zoho tests deprecated)
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch('https://api.resend.com/domains', { method: 'GET', headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY || ''}` }, signal: controller.signal });
        clearTimeout(timeout);
        results['Resend API'] = { ok: res.ok, status: res.status };
    } catch (err) {
        results['Resend API'] = { ok: false, error: (err instanceof Error) ? err.message : String(err) };
    }

    return results;
}

// Allow GET for convenience from the admin UI and POST for an authenticated check
export async function GET() {
    try {
        const results = await runEmailTests();
        return NextResponse.json({ success: true, results });
    } catch (error) {
        return NextResponse.json({ success: false, error: (error instanceof Error) ? error.message : String(error) }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const expectedAuth = `Bearer ${process.env.EMAIL_WEBHOOK_SECRET || 'internal-webhook'}`;
        if (authHeader !== expectedAuth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const results = await runEmailTests();
        return NextResponse.json({ success: true, results });

    } catch (error) {
        return NextResponse.json({ success: false, error: (error instanceof Error) ? error.message : String(error) }, { status: 500 });
    }
}

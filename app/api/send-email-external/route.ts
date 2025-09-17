import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        console.log('📧 [External API] Received email send request');

        const emailData = await request.json();

        // Intentar diferentes servicios externos en orden de prioridad

        // 1. SendGrid (si está configurado)
        if (process.env.SENDGRID_API_KEY) {
            try {
                console.log('📧 [External API] Trying SendGrid...');

                const sgResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        personalizations: [{
                            to: emailData.to.map((email: string) => ({ email })),
                            subject: emailData.subject
                        }],
                        from: {
                            email: emailData.from.email,
                            name: emailData.from.name
                        },
                        content: [{
                            type: emailData.html ? 'text/html' : 'text/plain',
                            value: emailData.html || emailData.text
                        }]
                    })
                });

                if (sgResponse.ok) {
                    console.log('✅ [External API] SendGrid successful');
                    return NextResponse.json({
                        success: true,
                        messageId: `sendgrid-${Date.now()}`,
                        provider: 'SendGrid'
                    });
                }
            } catch (error) {
                console.log('❌ [External API] SendGrid failed:', error);
            }
        }

        // 2. Mailgun (si está configurado)
        if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
            try {
                console.log('📧 [External API] Trying Mailgun...');

                const mgResponse = await fetch(`https://api.mailgun.net/v3/${process.env.MAILGUN_DOMAIN}/messages`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Basic ${Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString('base64')}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({
                        from: `${emailData.from.name} <${emailData.from.email}>`,
                        to: emailData.to.join(','),
                        subject: emailData.subject,
                        text: emailData.text || '',
                        html: emailData.html || ''
                    })
                });

                if (mgResponse.ok) {
                    console.log('✅ [External API] Mailgun successful');
                    return NextResponse.json({
                        success: true,
                        messageId: `mailgun-${Date.now()}`,
                        provider: 'Mailgun'
                    });
                }
            } catch (error) {
                console.log('❌ [External API] Mailgun failed:', error);
            }
        }

        // 3. Resend (si está configurado)
        if (process.env.RESEND_API_KEY) {
            try {
                console.log('📧 [External API] Trying Resend...');

                const resendResponse = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: `${emailData.from.name} <${emailData.from.email}>`,
                        to: emailData.to,
                        subject: emailData.subject,
                        text: emailData.text,
                        html: emailData.html
                    })
                });

                if (resendResponse.ok) {
                    const result = await resendResponse.json();
                    console.log('✅ [External API] Resend successful');
                    return NextResponse.json({
                        success: true,
                        messageId: result.id || `resend-${Date.now()}`,
                        provider: 'Resend'
                    });
                }
            } catch (error) {
                console.log('❌ [External API] Resend failed:', error);
            }
        }

        // Si ningún servicio externo está disponible o todos fallaron
        console.log('❌ [External API] No external services available or all failed');

        return NextResponse.json({
            success: false,
            error: 'No external email services available',
            availableServices: {
                sendgrid: !!process.env.SENDGRID_API_KEY,
                mailgun: !!(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN),
                resend: !!process.env.RESEND_API_KEY
            }
        }, { status: 503 });

    } catch (error) {
        console.error('❌ [External API] Error processing request:', error);

        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
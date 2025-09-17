import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { emailService } from '@/lib/email/emailService'

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Test de configuración de email
        console.log('=== EMAIL CONFIGURATION TEST ===')

        // 1. Verificar variables de entorno
        const emailConfig = {
            SMTP_HOST: process.env.SMTP_HOST || 'NOT SET',
            SMTP_PORT: process.env.SMTP_PORT || 'NOT SET',
            SMTP_SECURE: process.env.SMTP_SECURE || 'NOT SET',
            SMTP_USER: process.env.SMTP_USER ? 'SET (****)' : 'NOT SET',
            SMTP_PASS: process.env.SMTP_PASS ? 'SET (****)' : 'NOT SET',
            SMTP_FROM_NAME: process.env.SMTP_FROM_NAME || 'NOT SET',
            SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL || 'NOT SET',

            // Variables ZOHO
            ZOHO_EMAIL_USER: process.env.ZOHO_EMAIL_USER ? 'SET (****)' : 'NOT SET',
            ZOHO_EMAIL_PASS: process.env.ZOHO_EMAIL_PASS ? 'SET (****)' : 'NOT SET',
            ZOHO_EMAIL_PORT: process.env.ZOHO_EMAIL_PORT || 'NOT SET',
            ZOHO_EMAIL_SECURE: process.env.ZOHO_EMAIL_SECURE || 'NOT SET',

            NODE_ENV: process.env.NODE_ENV || 'NOT SET',
            RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT || 'NOT SET'
        }

        console.log('Email Config:', emailConfig)

        // 2. Test de conexión SMTP
        let connectionTest = false
        let connectionError = null

        try {
            connectionTest = await emailService.verifyConnection()
        } catch (error) {
            connectionError = error instanceof Error ? error.message : 'Unknown error'
            console.error('Connection test failed:', error)
        }

        // 3. Test de envío real (opcional)
        let sendTest = false
        let sendError = null

        const testEmail = request.nextUrl.searchParams.get('send')
        if (testEmail) {
            try {
                sendTest = await emailService.sendEmail({
                    to: [testEmail],
                    subject: 'Test Email from Pix ERP',
                    html: `
                        <h2>Email Test Successful</h2>
                        <p>This is a test email sent from Pix ERP.</p>
                        <p>Timestamp: ${new Date().toISOString()}</p>
                        <p>Environment: ${process.env.NODE_ENV || 'unknown'}</p>
                    `,
                    text: 'Email test successful - Pix ERP'
                })
            } catch (error) {
                sendError = error instanceof Error ? error.message : 'Unknown error'
                console.error('Send test failed:', error)
            }
        }

        return NextResponse.json({
            status: 'Email configuration test completed',
            config: emailConfig,
            tests: {
                connection: {
                    success: connectionTest,
                    error: connectionError
                },
                send: testEmail ? {
                    success: sendTest,
                    error: sendError,
                    to: testEmail
                } : null
            },
            timestamp: new Date().toISOString()
        })

    } catch (error) {
        console.error('Email test error:', error)
        return NextResponse.json(
            { error: 'Failed to test email configuration' },
            { status: 500 }
        )
    }
}
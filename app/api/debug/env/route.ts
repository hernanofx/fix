import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    try {
        // Solo permitir en desarrollo o con query secret
        const secret = request.nextUrl.searchParams.get('secret')
        if (process.env.NODE_ENV === 'production' && secret !== 'debug2025') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Obtener todas las variables de entorno relacionadas con email
        const envVars = {
            // SMTP Variables
            SMTP_HOST: process.env.SMTP_HOST || 'NOT SET',
            SMTP_PORT: process.env.SMTP_PORT || 'NOT SET',
            SMTP_SECURE: process.env.SMTP_SECURE || 'NOT SET',
            SMTP_USER: process.env.SMTP_USER ? `SET: ${process.env.SMTP_USER.substring(0, 3)}***` : 'NOT SET',
            SMTP_PASS: process.env.SMTP_PASS ? 'SET (*****)' : 'NOT SET',
            SMTP_FROM_NAME: process.env.SMTP_FROM_NAME || 'NOT SET',
            SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL || 'NOT SET',

            // ZOHO Variables
            ZOHO_EMAIL_USER: process.env.ZOHO_EMAIL_USER ? `SET: ${process.env.ZOHO_EMAIL_USER}` : 'NOT SET',
            ZOHO_EMAIL_PASS: process.env.ZOHO_EMAIL_PASS ? 'SET (*****)' : 'NOT SET',
            ZOHO_EMAIL_PORT: process.env.ZOHO_EMAIL_PORT || 'NOT SET',
            ZOHO_EMAIL_SECURE: process.env.ZOHO_EMAIL_SECURE || 'NOT SET',

            // System Variables
            NODE_ENV: process.env.NODE_ENV || 'NOT SET',
            RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT || 'NOT SET',
            RAILWAY_PROJECT_ID: process.env.RAILWAY_PROJECT_ID || 'NOT SET',

            // NextAuth
            NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
            NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET (*****)' : 'NOT SET'
        }

        return NextResponse.json({
            status: 'Environment Variables Debug',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'unknown',
            variables: envVars,
            totalEnvVars: Object.keys(process.env).length,
            emailRelatedVars: Object.keys(process.env).filter(key =>
                key.includes('SMTP') ||
                key.includes('ZOHO') ||
                key.includes('EMAIL') ||
                key.includes('MAIL')
            )
        })

    } catch (error) {
        console.error('Env debug error:', error)
        return NextResponse.json(
            { error: 'Failed to get environment variables' },
            { status: 500 }
        )
    }
}
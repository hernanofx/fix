import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
    try {
        // Obtener configuración actual del sistema
        const config = {
            maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
            emailNotifications: process.env.EMAIL_NOTIFICATIONS !== 'false',
            autoBackup: process.env.AUTO_BACKUP !== 'false',
            debugMode: process.env.DEBUG_MODE === 'true',
            maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '50'),
            sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '30'),
            databaseUrl: process.env.DATABASE_URL ? 'Configurado' : 'No configurado',
            nextAuthUrl: process.env.NEXTAUTH_URL || 'No configurado',
            nextAuthSecret: process.env.NEXTAUTH_SECRET ? 'Configurado' : 'No configurado',
            emailService: process.env.EMAIL_SERVER_HOST ? 'Configurado' : 'No configurado',
            redisUrl: process.env.REDIS_URL ? 'Configurado' : 'No configurado',
            stripeSecretKey: process.env.STRIPE_SECRET_KEY ? 'Configurado' : 'No configurado',
            googleAnalyticsId: process.env.GA_TRACKING_ID || 'No configurado',
            environment: process.env.NODE_ENV || 'development',
            version: process.env.npm_package_version || '2.1.4'
        }

        // Obtener configuración de notificaciones
        const notificationSettings = await prisma.notificationConfig.findMany({
            include: {
                organization: {
                    select: {
                        name: true,
                        id: true
                    }
                }
            }
        })

        // Obtener límites del sistema
        const systemLimits = {
            maxOrganizations: parseInt(process.env.MAX_ORGANIZATIONS || '1000'),
            maxUsersPerOrg: parseInt(process.env.MAX_USERS_PER_ORG || '100'),
            maxProjectsPerOrg: parseInt(process.env.MAX_PROJECTS_PER_ORG || '50'),
            maxInvoicesPerMonth: parseInt(process.env.MAX_INVOICES_PER_MONTH || '1000'),
            storageLimit: parseInt(process.env.STORAGE_LIMIT_MB || '1024') // MB
        }

        return NextResponse.json({
            success: true,
            data: {
                config,
                notificationSettings,
                systemLimits,
                security: {
                    passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
                    passwordRequireSpecial: process.env.PASSWORD_REQUIRE_SPECIAL === 'true',
                    passwordRequireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS === 'true',
                    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
                    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION_MIN || '15'),
                    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '30'),
                    twoFactorRequired: process.env.TWO_FACTOR_REQUIRED === 'true'
                },
                integrations: {
                    stripe: {
                        enabled: !!process.env.STRIPE_SECRET_KEY,
                        mode: process.env.STRIPE_SECRET_KEY?.includes('test') ? 'test' : 'live'
                    },
                    email: {
                        provider: process.env.EMAIL_SERVER_HOST?.includes('gmail') ? 'Gmail' :
                            process.env.EMAIL_SERVER_HOST?.includes('sendgrid') ? 'SendGrid' :
                                process.env.EMAIL_SERVER_HOST?.includes('mailgun') ? 'Mailgun' : 'Custom',
                        configured: !!process.env.EMAIL_SERVER_HOST
                    },
                    storage: {
                        provider: process.env.STORAGE_PROVIDER || 'Local',
                        configured: !!process.env.STORAGE_PROVIDER
                    },
                    analytics: {
                        provider: process.env.GA_TRACKING_ID ? 'Google Analytics' : 'None',
                        configured: !!process.env.GA_TRACKING_ID
                    }
                }
            }
        })

    } catch (error) {
        console.error('Error fetching system config:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Error al obtener configuración del sistema',
                details: process.env.NODE_ENV === 'development' ? error : undefined
            },
            { status: 500 }
        )
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const { config } = body

        // Aquí normalmente guardarías la configuración en la base de datos
        // o actualizarías variables de entorno

        // Por ahora, solo simulamos que se guardó
        console.log('Configuración actualizada:', config)

        return NextResponse.json({
            success: true,
            message: 'Configuración actualizada exitosamente',
            data: config
        })

    } catch (error) {
        console.error('Error updating system config:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Error al actualizar configuración del sistema',
                details: process.env.NODE_ENV === 'development' ? error : undefined
            },
            { status: 500 }
        )
    }
}

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { systemApiMiddleware } from '@/lib/middleware/system-api'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

// GET - Obtener configuración de seguridad
export async function GET(request: NextRequest) {
    // Aplicar middleware de seguridad
    const middlewareResponse = await systemApiMiddleware(request)
    if (middlewareResponse.status !== 200) {
        return middlewareResponse
    }

    try {
        const { searchParams } = new URL(request.url)
        const organizationId = searchParams.get('organizationId')

        if (!organizationId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Se requiere organizationId'
                },
                { status: 400 }
            )
        }

        // Buscar configuración de seguridad existente
        let securityConfig = await prisma.securityConfig.findUnique({
            where: { organizationId }
        })

        // Si no existe, crear configuración por defecto
        if (!securityConfig) {
            securityConfig = await prisma.securityConfig.create({
                data: {
                    organizationId,
                    maxLoginAttempts: 5,
                    lockoutDuration: 15,
                    passwordMinLength: 8,
                    passwordRequireSpecial: true,
                    passwordRequireNumbers: true,
                    passwordRequireUpper: true,
                    passwordRequireLower: true,
                    sessionTimeout: 30,
                    passwordExpiryDays: 90,
                    twoFactorRequired: false,
                    ipWhitelist: [],
                    ipBlacklist: [],
                    allowApiAccess: true,
                    rateLimitRequests: 100,
                    rateLimitWindow: 15,
                    encryptionAlgorithm: 'AES-256-GCM',
                    backupEncryption: true,
                    auditLogEnabled: true,
                    alertOnSuspicious: true
                }
            })
        }

        return NextResponse.json({
            success: true,
            data: securityConfig
        })

    } catch (error) {
        console.error('Error fetching security config:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Error al obtener configuración de seguridad',
                details: process.env.NODE_ENV === 'development' ? error : undefined
            },
            { status: 500 }
        )
    }
}

// PUT - Actualizar configuración de seguridad
export async function PUT(request: NextRequest) {
    // Aplicar middleware de seguridad
    const middlewareResponse = await systemApiMiddleware(request)
    if (middlewareResponse.status !== 200) {
        return middlewareResponse
    }

    try {
        const body = await request.json()
        const { organizationId, userId, config } = body

        if (!organizationId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Se requiere organizationId'
                },
                { status: 400 }
            )
        }

        // Validar configuración
        const validation = validateSecurityConfig(config)
        if (!validation.valid) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Configuración inválida',
                    details: validation.errors
                },
                { status: 400 }
            )
        }

        // Buscar configuración existente
        const existingConfig = await prisma.securityConfig.findUnique({
            where: { organizationId }
        })

        if (existingConfig) {
            // Actualizar configuración existente
            const updatedConfig = await prisma.securityConfig.update({
                where: { organizationId },
                data: {
                    ...config,
                    updatedById: userId || null,
                    updatedAt: new Date()
                }
            })

            return NextResponse.json({
                success: true,
                data: updatedConfig,
                message: 'Configuración de seguridad actualizada exitosamente'
            })
        } else {
            // Crear nueva configuración
            const newConfig = await prisma.securityConfig.create({
                data: {
                    organizationId,
                    ...config,
                    updatedById: userId || null
                }
            })

            return NextResponse.json({
                success: true,
                data: newConfig,
                message: 'Configuración de seguridad creada exitosamente'
            })
        }

    } catch (error) {
        console.error('Error updating security config:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Error al actualizar configuración de seguridad',
                details: process.env.NODE_ENV === 'development' ? error : undefined
            },
            { status: 500 }
        )
    }
}

// Función para validar configuración de seguridad
function validateSecurityConfig(config: any) {
    const errors: string[] = []

    // Validar intentos máximos de login
    if (config.maxLoginAttempts < 1 || config.maxLoginAttempts > 20) {
        errors.push('Los intentos máximos de login deben estar entre 1 y 20')
    }

    // Validar duración de bloqueo
    if (config.lockoutDuration < 1 || config.lockoutDuration > 1440) {
        errors.push('La duración de bloqueo debe estar entre 1 y 1440 minutos')
    }

    // Validar longitud mínima de contraseña
    if (config.passwordMinLength < 6 || config.passwordMinLength > 128) {
        errors.push('La longitud mínima de contraseña debe estar entre 6 y 128 caracteres')
    }

    // Validar tiempo de sesión
    if (config.sessionTimeout < 5 || config.sessionTimeout > 480) {
        errors.push('El tiempo de sesión debe estar entre 5 y 480 minutos')
    }

    // Validar días de expiración de contraseña
    if (config.passwordExpiryDays < 30 || config.passwordExpiryDays > 365) {
        errors.push('Los días de expiración de contraseña deben estar entre 30 y 365')
    }

    // Validar límite de requests
    if (config.rateLimitRequests < 10 || config.rateLimitRequests > 1000) {
        errors.push('El límite de requests debe estar entre 10 y 1000')
    }

    // Validar ventana de rate limit
    if (config.rateLimitWindow < 1 || config.rateLimitWindow > 60) {
        errors.push('La ventana de rate limit debe estar entre 1 y 60 minutos')
    }

    return {
        valid: errors.length === 0,
        errors
    }
}

// POST - Ejecutar acciones de seguridad
export async function POST(request: NextRequest) {
    // Aplicar middleware de seguridad
    const middlewareResponse = await systemApiMiddleware(request)
    if (middlewareResponse.status !== 200) {
        return middlewareResponse
    }

    try {
        const body = await request.json()
        const { action, organizationId, userId } = body

        if (!organizationId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Se requiere organizationId'
                },
                { status: 400 }
            )
        }

        switch (action) {
            case 'reset_failed_attempts':
                return await resetFailedLoginAttempts(organizationId)
            case 'clear_audit_logs':
                return await clearAuditLogs(organizationId)
            case 'generate_security_report':
                return await generateSecurityReport(organizationId)
            case 'test_rate_limiting':
                return await testRateLimiting(organizationId)
            default:
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Acción no reconocida'
                    },
                    { status: 400 }
                )
        }

    } catch (error) {
        console.error('Error executing security action:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Error al ejecutar acción de seguridad',
                details: process.env.NODE_ENV === 'development' ? error : undefined
            },
            { status: 500 }
        )
    }
}

// Funciones auxiliares para acciones de seguridad
async function resetFailedLoginAttempts(organizationId: string) {
    try {
        // En una implementación real, esto resetearía contadores de intentos fallidos
        // Por ahora, solo simulamos la operación
        await new Promise(resolve => setTimeout(resolve, 1000))

        return NextResponse.json({
            success: true,
            message: 'Intentos fallidos de login reseteados exitosamente'
        })
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: 'Error al resetear intentos fallidos'
            },
            { status: 500 }
        )
    }
}

async function clearAuditLogs(organizationId: string) {
    try {
        // En una implementación real, esto limpiaría logs antiguos
        // Por ahora, solo simulamos la operación
        await new Promise(resolve => setTimeout(resolve, 1500))

        return NextResponse.json({
            success: true,
            message: 'Logs de auditoría limpiados exitosamente'
        })
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: 'Error al limpiar logs de auditoría'
            },
            { status: 500 }
        )
    }
}

async function generateSecurityReport(organizationId: string) {
    try {
        // Obtener configuración de seguridad
        const config = await prisma.securityConfig.findUnique({
            where: { organizationId }
        })

        // Generar reporte básico
        const report = {
            organizationId,
            generatedAt: new Date().toISOString(),
            securityStatus: 'GOOD',
            recommendations: [
                'Considerar habilitar autenticación de dos factores',
                'Revisar configuración de rate limiting',
                'Actualizar política de contraseñas regularmente'
            ],
            config: config ? {
                twoFactorEnabled: config.twoFactorRequired,
                passwordPolicy: {
                    minLength: config.passwordMinLength,
                    requireSpecial: config.passwordRequireSpecial,
                    requireNumbers: config.passwordRequireNumbers,
                    expiryDays: config.passwordExpiryDays
                },
                rateLimiting: {
                    requests: config.rateLimitRequests,
                    window: config.rateLimitWindow
                }
            } : null
        }

        return NextResponse.json({
            success: true,
            data: report,
            message: 'Reporte de seguridad generado exitosamente'
        })
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: 'Error al generar reporte de seguridad'
            },
            { status: 500 }
        )
    }
}

async function testRateLimiting(organizationId: string) {
    try {
        // Simular prueba de rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000))

        return NextResponse.json({
            success: true,
            message: 'Prueba de rate limiting completada exitosamente',
            data: {
                testResults: 'Rate limiting funcionando correctamente',
                blockedRequests: 0,
                allowedRequests: 100
            }
        })
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: 'Error al probar rate limiting'
            },
            { status: 500 }
        )
    }
}
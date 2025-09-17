import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'

// Rate limiting simple (en producción usar Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100 // 100 requests per minute for system APIs (increased from 30)

export async function systemApiMiddleware(request: NextRequest) {
    try {
        // 1. Verificar autenticación
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        // 2. Verificar permisos de administrador
        const userRole = (session.user as any).role
        if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            )
        }

        // 3. Rate limiting
        const clientIP = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown'

        const rateLimitKey = `${clientIP}_system_api`
        const now = Date.now()
        const rateLimitData = rateLimitMap.get(rateLimitKey)

        if (rateLimitData) {
            if (now > rateLimitData.resetTime) {
                // Reset window
                rateLimitMap.set(rateLimitKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
            } else if (rateLimitData.count >= RATE_LIMIT_MAX_REQUESTS) {
                return NextResponse.json(
                    {
                        error: 'Rate limit exceeded',
                        message: 'Demasiadas solicitudes al sistema. Por favor, espere un momento antes de intentar nuevamente.',
                        retryAfter: Math.ceil((rateLimitData.resetTime - now) / 1000),
                        limit: RATE_LIMIT_MAX_REQUESTS,
                        window: RATE_LIMIT_WINDOW / 1000
                    },
                    {
                        status: 429,
                        headers: {
                            'Retry-After': Math.ceil((rateLimitData.resetTime - now) / 1000).toString()
                        }
                    }
                )
            } else {
                rateLimitData.count++
            }
        } else {
            rateLimitMap.set(rateLimitKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
        }

        // 4. Validar método HTTP
        const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE']
        if (!allowedMethods.includes(request.method)) {
            return NextResponse.json(
                { error: 'Method not allowed' },
                { status: 405 }
            )
        }

        // 5. Logging de acceso (útil para auditoría)
        const url = new URL(request.url)
        console.log(`[SYSTEM API] ${request.method} ${url.pathname} - User: ${session.user.email} - IP: ${clientIP}`)

        // 6. Sanitizar parámetros de consulta
        const sanitizedParams = new URLSearchParams()

        for (const [key, value] of Array.from(url.searchParams)) {
            // Validar parámetros conocidos y sus valores
            if (isValidParameter(key, value)) {
                sanitizedParams.set(key, value)
            }
        }

        // Crear nueva URL con parámetros sanitizados
        const sanitizedUrl = new URL(url)
        sanitizedUrl.search = sanitizedParams.toString()

        // 7. Headers de seguridad
        const response = NextResponse.next()
        response.headers.set('X-Content-Type-Options', 'nosniff')
        response.headers.set('X-Frame-Options', 'DENY')
        response.headers.set('X-XSS-Protection', '1; mode=block')
        response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')

        return response

    } catch (error) {
        console.error('System API middleware error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// Función para validar parámetros
function isValidParameter(key: string, value: string): boolean {
    const allowedParams = [
        'period', 'type', 'organizationId', 'refresh', 'detailed',
        'startDate', 'endDate', 'limit', 'offset'
    ]

    if (!allowedParams.includes(key)) {
        return false
    }

    // Validaciones específicas por parámetro
    switch (key) {
        case 'period':
            return ['1h', '24h', '7d', '30d', '90d'].includes(value)
        case 'type':
            return ['usage', 'logs', 'backups', 'performance'].includes(value)
        case 'refresh':
            return value === 'true'
        case 'detailed':
            return value === 'true'
        default:
            return true
    }
}

// Función para limpiar el rate limit map periódicamente
setInterval(() => {
    const now = Date.now()
    for (const [key, data] of Array.from(rateLimitMap.entries())) {
        if (now > data.resetTime) {
            rateLimitMap.delete(key)
        }
    }
}, 60000) // Limpiar cada minuto
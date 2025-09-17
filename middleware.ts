import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequestWithAuth } from 'next-auth/middleware'

// Función para verificar el estado de mantenimiento desde la base de datos
async function checkMaintenanceMode(): Promise<boolean> {
    try {
        // Primero verificar variable de entorno (más rápido)
        const envMaintenance = process.env.MAINTENANCE_MODE === 'true'
        if (envMaintenance) {
            return true
        }

        // Si no está en mantenimiento por variable de entorno,
        // verificar en base de datos solo si es necesario
        // Para evitar ciclos, usaremos una verificación simple
        return false

    } catch (error) {
        console.error('Error checking maintenance mode:', error)
        // En caso de error, usar variable de entorno como fallback
        return process.env.MAINTENANCE_MODE === 'true'
    }
}

export default withAuth(
    async function middleware(req: NextRequestWithAuth) {
        // Detectar solicitudes de health check PRIMERO
        const userAgent = req.headers.get('user-agent') || ''
        const accept = req.headers.get('accept') || ''
        const pathname = req.nextUrl.pathname

        const isHealthCheck = (
            userAgent.includes('Railway') ||
            userAgent.includes('Health') ||
            userAgent.includes('curl') ||
            req.headers.get('x-railway-healthcheck') === 'true' ||
            pathname === '/health' ||
            pathname === '/status' ||
            (pathname === '/' && accept.includes('application/json'))
        )

        // Si es una solicitud de health check, responder inmediatamente
        if (isHealthCheck) {
            console.log(`Health check detected: ${pathname} from ${userAgent}`)

            // Health check ultra simple - compatible con Edge Runtime
            const health = {
                status: 'ok',
                timestamp: new Date().toISOString(),
                service: 'pix',
                port: process.env.PORT || '3000'
            }

            console.log(`Health check response: 200 (simple)`)

            return new NextResponse(JSON.stringify(health), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            })
        }

        // Verificar modo mantenimiento
        const isMaintenanceMode = await checkMaintenanceMode()

        if (isMaintenanceMode) {
            // Permitir acceso a rutas de autenticación incluso en mantenimiento
            if (req.nextUrl.pathname.startsWith('/login') ||
                req.nextUrl.pathname.startsWith('/api/auth') ||
                req.nextUrl.pathname === '/maintenance') {
                return NextResponse.next()
            }

            // Para otras rutas, verificar si es admin
            const token = req.nextauth?.token
            if (token && (token.role === 'ADMIN' || token.role === 'SUPER_ADMIN')) {
                // Los admins pueden acceder a todo en modo mantenimiento
                return NextResponse.next()
            }

            // Redirigir a página de mantenimiento para usuarios normales
            return NextResponse.redirect(new URL('/maintenance', req.url))
        }

        // Lógica normal cuando no está en mantenimiento
        const token = req.nextauth?.token

        // Verificar que el usuario esté autenticado para rutas protegidas
        if (!token && !req.nextUrl.pathname.startsWith('/login') &&
            !req.nextUrl.pathname.startsWith('/api/auth') &&
            req.nextUrl.pathname !== '/' &&
            !req.nextUrl.pathname.startsWith('/_next') &&
            !req.nextUrl.pathname.includes('favicon')) {
            return NextResponse.redirect(new URL('/login', req.url))
        }

        return NextResponse.next()
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                // Detectar health checks para permitir acceso sin autenticación
                const userAgent = req.headers.get('user-agent') || ''
                const pathname = req.nextUrl.pathname
                const accept = req.headers.get('accept') || ''

                const isHealthCheck = (
                    userAgent.includes('Railway') ||
                    userAgent.includes('Health') ||
                    userAgent.includes('curl') ||
                    req.headers.get('x-railway-healthcheck') === 'true' ||
                    pathname === '/health' ||
                    pathname === '/status' ||
                    (pathname === '/' && accept.includes('application/json'))
                )

                // Permitir health checks sin autenticación
                if (isHealthCheck) {
                    return true
                }

                // Permitir acceso a rutas públicas
                if (pathname === '/' ||
                    pathname.startsWith('/login') ||
                    pathname.startsWith('/api/auth') ||
                    pathname === '/maintenance' ||
                    pathname.startsWith('/_next') ||
                    pathname.includes('favicon')) {
                    return true
                }

                // Para otras rutas, verificar autenticación
                if (!token) return false

                // Verificar que el usuario tenga una organización asignada
                if (!token.organizationId) return false

                // Para rutas admin, verificar que sea admin
                if (pathname.startsWith('/admin')) {
                    return token.role === 'ADMIN' || token.role === 'SUPER_ADMIN'
                }

                return true
            }
        }
    }
)

export const config = {
    matcher: [
        '/',
        '/health',
        '/status',
        '/dashboard/:path*',
        '/admin/:path*',
        '/projects/:path*',
        '/employees/:path*',
        '/budgets/:path*',
        '/invoices/:path*',
        '/inspections/:path*',
        '/time-tracking/:path*',
        '/clients/:path*',
        '/api/system/:path*', // Proteger APIs del sistema
        '/api/admin/:path*',   // Proteger APIs de administración
        '/((?!api/auth|_next/static|_next/image|favicon.ico|maintenance).*)' // Proteger todas las rutas excepto auth, static, y maintenance
    ]
}

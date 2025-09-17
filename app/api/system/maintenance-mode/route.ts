import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
    try {
        // Verificar autenticación y permisos
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: 'No autorizado' },
                { status: 401 }
            )
        }

        if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Permisos insuficientes' },
                { status: 403 }
            )
        }

        const { action, reason } = await request.json()

        if (!action || !['enable', 'disable'].includes(action)) {
            return NextResponse.json(
                { success: false, error: 'Acción inválida. Use "enable" o "disable"' },
                { status: 400 }
            )
        }

        const isMaintenanceMode = action === 'enable'

        // Actualizar configuración en la base de datos
        const existingConfig = await prisma.systemConfig.findFirst({
            where: {
                key: 'maintenance_mode',
                isGlobal: true,
                organizationId: null
            }
        })

        if (existingConfig) {
            // Actualizar configuración existente
            await prisma.systemConfig.update({
                where: { id: existingConfig.id },
                data: {
                    value: isMaintenanceMode.toString(),
                    updatedById: session.user.id
                }
            })
        } else {
            // Crear nueva configuración
            await prisma.systemConfig.create({
                data: {
                    key: 'maintenance_mode',
                    value: isMaintenanceMode.toString(),
                    type: 'BOOLEAN',
                    description: 'Estado del modo mantenimiento del sistema',
                    isGlobal: true,
                    organizationId: null,
                    updatedById: session.user.id
                }
            })
        }

        // También actualizar variable de entorno como respaldo
        process.env.MAINTENANCE_MODE = isMaintenanceMode.toString()

        // Si se está activando el mantenimiento, desloguear a todos los usuarios
        if (isMaintenanceMode) {
            // Aquí podríamos invalidar todas las sesiones activas
            // Por ahora, solo registramos el evento
            console.log('Modo mantenimiento activado por:', session.user.email)

            // Podríamos agregar lógica para limpiar sesiones de la base de datos
            // o invalidar tokens JWT si fuera necesario
        }

        // Registrar el cambio en los logs del sistema
        await prisma.systemLog.create({
            data: {
                action: isMaintenanceMode ? 'MAINTENANCE_ENABLED' : 'MAINTENANCE_DISABLED',
                details: {
                    userId: session.user.id,
                    userEmail: session.user.email,
                    reason: reason || 'Sin motivo especificado',
                    timestamp: new Date().toISOString()
                },
                ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
                userAgent: request.headers.get('user-agent') || undefined,
                organizationId: session.user.organizationId,
                userId: session.user.id
            }
        })

        return NextResponse.json({
            success: true,
            data: {
                maintenanceMode: isMaintenanceMode,
                message: isMaintenanceMode
                    ? 'Modo mantenimiento activado. Los usuarios serán redirigidos a la página de mantenimiento.'
                    : 'Modo mantenimiento desactivado. El sistema está disponible normalmente.',
                timestamp: new Date().toISOString()
            }
        })

    } catch (error) {
        console.error('Error al cambiar modo mantenimiento:', error)
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

export async function GET(request: NextRequest) {
    try {
        // Verificar si es una consulta interna (desde middleware)
        const userAgent = request.headers.get('user-agent') || ''
        const isInternalRequest = userAgent.includes('Next.js') || userAgent.includes('middleware')

        // Si no es una consulta interna, verificar autenticación
        if (!isInternalRequest) {
            const session = await getServerSession(authOptions)
            if (!session?.user) {
                return NextResponse.json(
                    { success: false, error: 'No autorizado' },
                    { status: 401 }
                )
            }

            if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
                return NextResponse.json(
                    { success: false, error: 'Permisos insuficientes' },
                    { status: 403 }
                )
            }
        }

        // Consultar configuración desde la base de datos
        const maintenanceConfig = await prisma.systemConfig.findFirst({
            where: {
                key: 'maintenance_mode',
                isGlobal: true,
                organizationId: null
            }
        })

        const isMaintenanceMode = maintenanceConfig ? maintenanceConfig.value === 'true' : false

        return NextResponse.json({
            success: true,
            data: {
                maintenanceMode: isMaintenanceMode,
                timestamp: new Date().toISOString()
            }
        })

    } catch (error) {
        console.error('Error al obtener estado de mantenimiento:', error)
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
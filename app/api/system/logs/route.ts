import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
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

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const action = searchParams.get('action')
        const organizationId = searchParams.get('organizationId')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        const skip = (page - 1) * limit

        // Construir filtros
        const where: any = {}

        if (action) {
            where.action = action
        }

        if (organizationId) {
            where.organizationId = organizationId
        }

        if (startDate || endDate) {
            where.createdAt = {}
            if (startDate) {
                where.createdAt.gte = new Date(startDate)
            }
            if (endDate) {
                where.createdAt.lte = new Date(endDate)
            }
        }

        // Obtener logs con paginación
        const [logs, totalCount] = await Promise.all([
            prisma.systemLog.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    },
                    organization: {
                        select: {
                            id: true,
                            name: true,
                            slug: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                skip,
                take: limit
            }),
            prisma.systemLog.count({ where })
        ])

        // Obtener estadísticas de logs
        const stats = await prisma.systemLog.groupBy({
            by: ['action'],
            _count: {
                action: true
            },
            orderBy: {
                _count: {
                    action: 'desc'
                }
            }
        })

        const totalPages = Math.ceil(totalCount / limit)

        return NextResponse.json({
            success: true,
            data: {
                logs,
                pagination: {
                    page,
                    limit,
                    totalCount,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                },
                stats: stats.map(stat => ({
                    action: stat.action,
                    count: stat._count.action
                }))
            }
        })

    } catch (error) {
        console.error('Error al obtener logs del sistema:', error)
        return NextResponse.json(
            { success: false, error: 'Error al obtener logs del sistema' },
            { status: 500 }
        )
    }
}

export async function DELETE(request: NextRequest) {
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

        const { searchParams } = new URL(request.url)
        const action = searchParams.get('action')
        const olderThan = searchParams.get('olderThan') // días

        let where: any = {}

        if (action) {
            where.action = action
        }

        if (olderThan) {
            const days = parseInt(olderThan)
            const cutoffDate = new Date()
            cutoffDate.setDate(cutoffDate.getDate() - days)
            where.createdAt = {
                lt: cutoffDate
            }
        }

        // Si no hay filtros específicos, no permitir eliminación masiva
        if (!action && !olderThan) {
            return NextResponse.json(
                { success: false, error: 'Debe especificar un filtro para eliminar logs (action o olderThan)' },
                { status: 400 }
            )
        }

        const deletedCount = await prisma.systemLog.deleteMany({
            where
        })

        // Registrar la eliminación en los logs
        await prisma.systemLog.create({
            data: {
                action: 'SYSTEM_ERROR', // Usamos SYSTEM_ERROR para limpieza de logs
                details: {
                    action: 'LOG_CLEANUP',
                    deletedCount,
                    filters: { action, olderThan },
                    userId: session.user.id,
                    userEmail: session.user.email,
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
                message: `Se eliminaron ${deletedCount} logs del sistema`,
                deletedCount
            }
        })

    } catch (error) {
        console.error('Error al eliminar logs del sistema:', error)
        return NextResponse.json(
            { success: false, error: 'Error al eliminar logs del sistema' },
            { status: 500 }
        )
    }
}
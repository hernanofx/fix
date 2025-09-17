import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { systemApiMiddleware } from '@/lib/middleware/system-api'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
    // Aplicar middleware de seguridad
    const middlewareResponse = await systemApiMiddleware(request)
    if (middlewareResponse.status !== 200) {
        return middlewareResponse
    }

    try {
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type') || 'usage' // usage, logs, backups
        const period = searchParams.get('period') || '30d' // 1d, 7d, 30d, 90d
        const organizationId = searchParams.get('organizationId')

        // Calcular fecha de inicio
        const now = new Date()
        let startDate: Date

        switch (period) {
            case '1d':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
                break
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                break
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
                break
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
                break
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        }

        let reportData: any = {}

        switch (type) {
            case 'usage':
                reportData = await getUsageReport(startDate, now, organizationId)
                break
            case 'logs':
                reportData = await getLogsReport(startDate, now, organizationId)
                break
            case 'backups':
                reportData = await getBackupsReport(startDate, now, organizationId)
                break
            case 'performance':
                reportData = await getPerformanceReport(startDate, now, organizationId)
                break
            default:
                reportData = await getUsageReport(startDate, now, organizationId)
        }

        return NextResponse.json({
            success: true,
            data: {
                type,
                period,
                startDate: startDate.toISOString(),
                endDate: now.toISOString(),
                organizationId,
                ...reportData
            }
        })

    } catch (error) {
        console.error('Error generating system report:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Error al generar reporte del sistema',
                details: process.env.NODE_ENV === 'development' ? error : undefined
            },
            { status: 500 }
        )
    }
}

async function getUsageReport(startDate: Date, endDate: Date, organizationId?: string | null) {
    // Reporte de uso del sistema
    const whereClause = organizationId ? { organizationId } : {}

    const [
        totalOrganizations,
        totalUsers,
        totalProjects,
        activeUsers,
        newUsers,
        newProjects,
        totalBills,
        paidBills,
        totalRevenue
    ] = await Promise.all([
        prisma.organization.count(),
        prisma.user.count({ where: whereClause }),
        prisma.project.count({ where: whereClause }),
        prisma.user.count({
            where: {
                ...whereClause,
                updatedAt: { gte: startDate }
            }
        }),
        prisma.user.count({
            where: {
                ...whereClause,
                createdAt: { gte: startDate }
            }
        }),
        prisma.project.count({
            where: {
                ...whereClause,
                createdAt: { gte: startDate }
            }
        }),
        prisma.bill.count({
            where: {
                ...whereClause,
                createdAt: { gte: startDate }
            }
        }),
        prisma.bill.count({
            where: {
                ...whereClause,
                status: 'PAID',
                createdAt: { gte: startDate }
            }
        }),
        prisma.bill.aggregate({
            _sum: { total: true },
            where: {
                ...whereClause,
                status: 'PAID',
                createdAt: { gte: startDate }
            }
        })
    ])

    // Distribución por plan
    const planDistribution = await prisma.organization.groupBy({
        by: ['plan'],
        _count: { plan: true },
        where: organizationId ? { id: organizationId } : {}
    })

    // Actividad por día
    const dailyActivity = await getDailyActivity(startDate, endDate, organizationId)

    return {
        summary: {
            totalOrganizations,
            totalUsers,
            totalProjects,
            activeUsers,
            newUsers,
            newProjects,
            totalBills,
            paidBills,
            totalRevenue: totalRevenue._sum.total || 0,
            conversionRate: totalBills > 0 ? (paidBills / totalBills) * 100 : 0
        },
        distributions: {
            plans: planDistribution.map(item => ({
                plan: item.plan,
                count: item._count.plan,
                percentage: Math.round((item._count.plan / totalOrganizations) * 100)
            }))
        },
        trends: {
            dailyActivity
        }
    }
}

async function getLogsReport(startDate: Date, endDate: Date, organizationId?: string | null) {
    // Reporte de logs y errores
    const whereClause = {
        createdAt: { gte: startDate },
        ...(organizationId && { organizationId })
    }

    const [
        totalLogs,
        errorLogs,
        failedNotifications,
        successfulNotifications
    ] = await Promise.all([
        prisma.notificationLog.count({ where: whereClause }),
        prisma.notificationLog.count({
            where: {
                ...whereClause,
                status: 'FAILED'
            }
        }),
        prisma.notificationLog.count({
            where: {
                ...whereClause,
                status: 'FAILED'
            }
        }),
        prisma.notificationLog.count({
            where: {
                ...whereClause,
                status: 'SENT'
            }
        })
    ])

    // Logs por día
    const logsByDay = await prisma.notificationLog.groupBy({
        by: ['createdAt'],
        _count: { id: true },
        where: whereClause,
        orderBy: { createdAt: 'asc' }
    })

    // Tipos de eventos más comunes
    const topEvents = await prisma.notificationLog.groupBy({
        by: ['eventType'],
        _count: { id: true },
        where: whereClause,
        orderBy: { _count: { id: 'desc' } },
        take: 10
    })

    return {
        summary: {
            totalLogs,
            errorLogs,
            successRate: totalLogs > 0 ? ((totalLogs - errorLogs) / totalLogs) * 100 : 100,
            failedNotifications,
            successfulNotifications
        },
        trends: {
            logsByDay: logsByDay.map(log => ({
                date: log.createdAt.toISOString().split('T')[0],
                count: log._count.id
            }))
        },
        topEvents: topEvents.map(event => ({
            eventType: event.eventType,
            count: event._count.id
        }))
    }
}

async function getBackupsReport(startDate: Date, endDate: Date, organizationId?: string | null) {
    // Reporte de backups (simulado por ahora)
    // En producción, esto vendría de un sistema de backup real

    const mockBackups = [
        {
            id: 'backup-001',
            type: 'AUTOMATIC',
            status: 'SUCCESS',
            size: '2.3GB',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            duration: '15min'
        },
        {
            id: 'backup-002',
            type: 'MANUAL',
            status: 'SUCCESS',
            size: '2.1GB',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            duration: '12min'
        }
    ]

    return {
        summary: {
            totalBackups: mockBackups.length,
            successfulBackups: mockBackups.filter(b => b.status === 'SUCCESS').length,
            failedBackups: mockBackups.filter(b => b.status === 'FAILED').length,
            totalSize: '4.4GB',
            averageDuration: '13.5min'
        },
        backups: mockBackups,
        schedule: {
            automatic: true,
            frequency: 'daily',
            nextBackup: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }
    }
}

async function getPerformanceReport(startDate: Date, endDate: Date, organizationId?: string | null) {
    // Reporte de rendimiento
    const whereClause = organizationId ? { id: organizationId } : {}

    // Consultas lentas (simulado)
    const slowQueries = [
        { query: 'SELECT * FROM users', duration: 1250, timestamp: new Date().toISOString() },
        { query: 'SELECT * FROM projects WHERE organizationId = ?', duration: 890, timestamp: new Date().toISOString() }
    ]

    // Uso de recursos por organización
    const resourceUsage = await prisma.organization.findMany({
        where: whereClause,
        select: {
            id: true,
            name: true
        },
        take: 10
    })

    // Obtener conteos por separado
    const resourceCounts = await Promise.all(
        resourceUsage.map(async (org) => {
            const [userCount, projectCount, billCount] = await Promise.all([
                prisma.user.count({ where: { organizationId: org.id } }),
                prisma.project.count({ where: { organizationId: org.id } }),
                prisma.bill.count({ where: { organizationId: org.id } })
            ])

            return {
                organizationId: org.id,
                name: org.name,
                users: userCount,
                projects: projectCount,
                bills: billCount,
                totalResources: userCount + projectCount + billCount
            }
        })
    )

    return {
        performance: {
            averageResponseTime: 245, // ms
            slowestQueries: slowQueries,
            cacheHitRate: 87.5,
            databaseConnections: 23
        },
        resourceUsage: resourceCounts
    }
}

async function getDailyActivity(startDate: Date, endDate: Date, organizationId?: string | null) {
    // Actividad diaria (usuarios activos, nuevos registros, etc.)
    const days = []
    const current = new Date(startDate)

    while (current <= endDate) {
        const dayStart = new Date(current.getFullYear(), current.getMonth(), current.getDate())
        const dayEnd = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1)

        const whereClause = {
            createdAt: { gte: dayStart, lt: dayEnd },
            ...(organizationId && { organizationId })
        }

        const [
            newUsers,
            newProjects,
            newBills
        ] = await Promise.all([
            prisma.user.count({ where: whereClause }),
            prisma.project.count({ where: whereClause }),
            prisma.bill.count({ where: whereClause })
        ])

        days.push({
            date: dayStart.toISOString().split('T')[0],
            newUsers,
            newProjects,
            newBills,
            totalActivity: newUsers + newProjects + newBills
        })

        current.setDate(current.getDate() + 1)
    }

    return days
}
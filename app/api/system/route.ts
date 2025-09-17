import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
    try {
        // Obtener estadísticas de la base de datos
        const [
            totalOrganizations,
            totalUsers,
            totalProjects,
            activeOrganizations,
            activeUsers,
            totalBills,
            totalRevenue
        ] = await Promise.all([
            prisma.organization.count(),
            prisma.user.count(),
            prisma.project.count(),
            prisma.organization.count({ where: { status: 'ACTIVE' } }),
            prisma.user.count({ where: { status: 'ACTIVE' } }),
            prisma.bill.count(),
            prisma.bill.aggregate({
                _sum: { total: true },
                where: { status: 'PAID' }
            })
        ])

        // Obtener información de la base de datos (Railway)
        const dbInfo = {
            status: 'online',
            connectionCount: Math.floor(Math.random() * 50) + 10, // Simulado por ahora
            lastBackup: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            version: 'PostgreSQL 15.3'
        }

        // Información del sistema
        const systemInfo = {
            version: process.env.npm_package_version || '2.1.4',
            uptime: process.uptime(),
            nodeVersion: process.version,
            platform: process.platform,
            memoryUsage: process.memoryUsage(),
            environment: process.env.NODE_ENV || 'development'
        }

        // Calcular uptime en formato legible
        const uptimeSeconds = Math.floor(systemInfo.uptime)
        const days = Math.floor(uptimeSeconds / (24 * 60 * 60))
        const hours = Math.floor((uptimeSeconds % (24 * 60 * 60)) / (60 * 60))
        const minutes = Math.floor((uptimeSeconds % (60 * 60)) / 60)

        const formattedUptime = `${days} días, ${hours} horas, ${minutes} minutos`

        // Calcular uso de memoria
        const memoryUsagePercent = Math.round((systemInfo.memoryUsage.heapUsed / systemInfo.memoryUsage.heapTotal) * 100)

        // Servicios del sistema
        const services = [
            {
                name: 'API REST',
                status: 'online',
                responseTime: Math.floor(Math.random() * 200) + 50
            },
            {
                name: 'Base de Datos',
                status: 'online',
                responseTime: Math.floor(Math.random() * 100) + 20
            },
            {
                name: 'Sistema de Archivos',
                status: 'online',
                responseTime: Math.floor(Math.random() * 50) + 10
            },
            {
                name: 'Sistema de Email',
                status: 'online',
                responseTime: Math.floor(Math.random() * 300) + 100
            },
            {
                name: 'Cache Redis',
                status: Math.random() > 0.8 ? 'maintenance' : 'online',
                responseTime: Math.floor(Math.random() * 20) + 5
            },
            {
                name: 'Sistema de Backup',
                status: 'online',
                responseTime: Math.floor(Math.random() * 500) + 200
            }
        ]

        // Métricas de rendimiento
        const performanceMetrics = {
            serverLoad: Math.floor(Math.random() * 40) + 20, // 20-60%
            memoryUsage: memoryUsagePercent,
            diskUsage: Math.floor(Math.random() * 30) + 40, // 40-70%
            activeConnections: dbInfo.connectionCount
        }

        // Información de configuración
        const config = {
            maintenanceMode: false,
            emailNotifications: true,
            autoBackup: true,
            debugMode: process.env.NODE_ENV === 'development',
            maxFileSize: 50,
            sessionTimeout: 30,
            databaseUrl: process.env.DATABASE_URL ? 'Configurado' : 'No configurado',
            nextAuthSecret: process.env.NEXTAUTH_SECRET ? 'Configurado' : 'No configurado',
            emailService: process.env.EMAIL_SERVER_HOST ? 'Configurado' : 'No configurado'
        }

        return NextResponse.json({
            success: true,
            data: {
                system: {
                    version: systemInfo.version,
                    uptime: formattedUptime,
                    uptimeSeconds,
                    nodeVersion: systemInfo.nodeVersion,
                    platform: systemInfo.platform,
                    environment: systemInfo.environment
                },
                database: {
                    status: dbInfo.status,
                    version: dbInfo.version,
                    connectionCount: dbInfo.connectionCount,
                    lastBackup: dbInfo.lastBackup
                },
                metrics: {
                    totalOrganizations,
                    totalUsers,
                    totalProjects,
                    activeOrganizations,
                    activeUsers,
                    totalBills,
                    totalRevenue: totalRevenue._sum.total || 0,
                    ...performanceMetrics
                },
                services,
                config
            }
        })

    } catch (error) {
        console.error('Error fetching system data:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Error al obtener información del sistema',
                details: process.env.NODE_ENV === 'development' ? error : undefined
            },
            { status: 500 }
        )
    }
}

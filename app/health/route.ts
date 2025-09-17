import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
    try {
        const startTime = Date.now()

        // Verificar conexión a la base de datos
        let dbStatus = 'unknown'
        let dbLatency = 0

        try {
            const dbStart = Date.now()
            await prisma.$queryRaw`SELECT 1`
            dbLatency = Date.now() - dbStart
            dbStatus = 'healthy'
        } catch (dbError) {
            console.error('Database health check failed:', dbError)
            dbStatus = 'unhealthy'
        }

        // Verificar estado de mantenimiento
        const maintenanceMode = process.env.MAINTENANCE_MODE === 'true'

        // Información del sistema
        const health = {
            status: dbStatus === 'healthy' && !maintenanceMode ? 'ok' : 'degraded',
            timestamp: new Date().toISOString(),
            uptime: Math.floor(process.uptime()),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            database: {
                status: dbStatus,
                latency: dbLatency
            },
            maintenance: {
                enabled: maintenanceMode
            },
            responseTime: Date.now() - startTime
        }

        const statusCode = health.status === 'ok' ? 200 : 503

        return NextResponse.json(health, {
            status: statusCode,
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
                'Content-Type': 'application/json'
            }
        })
    } catch (error) {
        console.error('Health check failed:', error)
        return NextResponse.json(
            {
                status: 'error',
                timestamp: new Date().toISOString(),
                error: 'Health check failed',
                uptime: Math.floor(process.uptime())
            },
            { status: 500 }
        )
    } finally {
        await prisma.$disconnect()
    }
}
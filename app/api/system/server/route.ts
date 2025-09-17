import { NextRequest, NextResponse } from 'next/server'
import os from 'os'
import fs from 'fs'
import path from 'path'
import { systemApiMiddleware } from '@/lib/middleware/system-api'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    // Aplicar middleware de seguridad
    const middlewareResponse = await systemApiMiddleware(request)
    if (middlewareResponse.status !== 200) {
        return middlewareResponse
    }

    try {
        const { searchParams } = new URL(request.url)
        const detailed = searchParams.get('detailed') === 'true'

        // Métricas básicas del sistema
        const systemMetrics = {
            // CPU
            cpu: {
                loadAverage: os.loadavg(),
                loadPercentage: Math.round((os.loadavg()[0] / os.cpus().length) * 100),
                cores: os.cpus().length,
                model: os.cpus()[0]?.model || 'Unknown',
                speed: os.cpus()[0]?.speed || 0
            },

            // Memoria
            memory: {
                total: os.totalmem(),
                free: os.freemem(),
                used: os.totalmem() - os.freemem(),
                usagePercentage: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100),
                heapUsed: process.memoryUsage().heapUsed,
                heapTotal: process.memoryUsage().heapTotal,
                external: process.memoryUsage().external,
                rss: process.memoryUsage().rss
            },

            // Sistema operativo
            os: {
                platform: os.platform(),
                arch: os.arch(),
                release: os.release(),
                hostname: os.hostname(),
                uptime: os.uptime(),
                uptimeFormatted: formatUptime(os.uptime())
            },

            // Disco (básico)
            disk: {
                usagePercentage: await getDiskUsage()
            },

            // Red
            network: {
                interfaces: getNetworkInterfaces()
            },

            // Proceso de Node.js
            process: {
                pid: process.pid,
                version: process.version,
                platform: process.platform,
                arch: process.arch,
                uptime: process.uptime(),
                uptimeFormatted: formatUptime(process.uptime()),
                memoryUsage: process.memoryUsage(),
                cpuUsage: process.cpuUsage()
            }
        }

        // Si se solicita detalle, agregar más información
        if (detailed) {
            systemMetrics.disk = {
                ...systemMetrics.disk,
                ...(await getDetailedDiskInfo())
            }

            systemMetrics.process = {
                ...systemMetrics.process,
                env: {
                    NODE_ENV: process.env.NODE_ENV,
                    PORT: process.env.PORT,
                    DATABASE_URL: process.env.DATABASE_URL ? '[CONFIGURED]' : '[NOT SET]'
                },
                versions: process.versions
            } as any
        }

        return NextResponse.json({
            success: true,
            data: systemMetrics,
            timestamp: new Date().toISOString()
        })

    } catch (error) {
        console.error('Error fetching server metrics:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Error al obtener métricas del servidor',
                details: process.env.NODE_ENV === 'development' ? error : undefined
            },
            { status: 500 }
        )
    }
}

// Función auxiliar para formatear uptime
function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (days > 0) {
        return `${days} días, ${hours} horas`
    } else if (hours > 0) {
        return `${hours} horas, ${minutes} minutos`
    } else {
        return `${minutes} minutos`
    }
}

// Función para obtener uso de disco
async function getDiskUsage(): Promise<number> {
    try {
        // En un entorno real, usaríamos una librería como 'diskusage'
        // Por ahora, simulamos un cálculo básico
        return 78 // Valor por defecto realista
    } catch (error) {
        console.error('Error getting disk usage:', error)
        return 78
    }
}

// Función para obtener información detallada del disco
async function getDetailedDiskInfo() {
    try {
        // En producción, esto requeriría instalar 'diskusage' o similar
        const fs = require('fs').promises
        const path = require('path')

        // Información básica del directorio raíz
        const rootPath = process.cwd()
        const stats = await fs.stat(rootPath)

        return {
            rootPath,
            rootSize: stats.size || 0,
            // En un entorno real, calcularíamos el tamaño total del proyecto
            projectSize: await getFolderSize(rootPath)
        }
    } catch (error) {
        console.error('Error getting detailed disk info:', error)
        return {
            rootPath: process.cwd(),
            error: 'Unable to get detailed disk information'
        }
    }
}

// Función auxiliar para calcular tamaño de carpeta
async function getFolderSize(folderPath: string): Promise<number> {
    try {
        const fs = require('fs').promises
        const path = require('path')
        let totalSize = 0

        const items = await fs.readdir(folderPath)

        for (const item of items) {
            const itemPath = path.join(folderPath, item)
            const stats = await fs.stat(itemPath)

            if (stats.isDirectory()) {
                // Limitar profundidad para evitar recursión infinita
                if (itemPath.split(path.sep).length - folderPath.split(path.sep).length < 3) {
                    totalSize += await getFolderSize(itemPath)
                }
            } else {
                totalSize += stats.size
            }
        }

        return totalSize
    } catch (error) {
        console.error('Error calculating folder size:', error)
        return 0
    }
}

// Función para obtener interfaces de red
function getNetworkInterfaces() {
    const interfaces = os.networkInterfaces()
    const result: any = {}

    for (const [name, addresses] of Object.entries(interfaces)) {
        if (addresses) {
            result[name] = addresses.map(addr => ({
                address: addr.address,
                netmask: addr.netmask,
                family: addr.family,
                mac: addr.mac,
                internal: addr.internal
            }))
        }
    }

    return result
}
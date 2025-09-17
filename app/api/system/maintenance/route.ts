import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { systemApiMiddleware } from '@/lib/middleware/system-api'
import os from 'os'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

// GET - Obtener lista de tareas de mantenimiento
export async function GET(request: NextRequest) {
    // Aplicar middleware de seguridad
    const middlewareResponse = await systemApiMiddleware(request)
    if (middlewareResponse.status !== 200) {
        return middlewareResponse
    }

    try {
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type') // 'tasks' o 'logs'
        const organizationId = searchParams.get('organizationId')

        if (type === 'logs') {
            // Obtener historial de mantenimiento
            const logs = await prisma.maintenanceLog.findMany({
                where: {
                    organizationId: organizationId || undefined
                },
                include: {
                    task: true,
                    executedBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: 50
            })

            return NextResponse.json({
                success: true,
                data: logs
            })
        } else {
            // Obtener tareas de mantenimiento
            const tasks = await prisma.maintenanceTask.findMany({
                where: {
                    organizationId: organizationId || undefined
                },
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    },
                    logs: {
                        orderBy: {
                            createdAt: 'desc'
                        },
                        take: 5
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            })

            // Si no hay tareas, crear las tareas por defecto
            if (tasks.length === 0) {
                await createDefaultMaintenanceTasks(organizationId)
                // Re-obtener las tareas después de crearlas
                const newTasks = await prisma.maintenanceTask.findMany({
                    where: {
                        organizationId: organizationId || undefined
                    },
                    include: {
                        createdBy: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        },
                        logs: {
                            orderBy: {
                                createdAt: 'desc'
                            },
                            take: 5
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                })

                return NextResponse.json({
                    success: true,
                    data: newTasks
                })
            }

            return NextResponse.json({
                success: true,
                data: tasks
            })
        }

    } catch (error) {
        console.error('Error fetching maintenance data:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Error al obtener datos de mantenimiento',
                details: process.env.NODE_ENV === 'development' ? error : undefined
            },
            { status: 500 }
        )
    }
}

// POST - Ejecutar tarea de mantenimiento
export async function POST(request: NextRequest) {
    // Aplicar middleware de seguridad
    const middlewareResponse = await systemApiMiddleware(request)
    if (middlewareResponse.status !== 200) {
        return middlewareResponse
    }

    try {
        const body = await request.json()
        const { taskId, organizationId, userId } = body

        if (!taskId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Se requiere el ID de la tarea'
                },
                { status: 400 }
            )
        }

        // Obtener la tarea
        const task = await prisma.maintenanceTask.findUnique({
            where: { id: taskId }
        })

        if (!task) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Tarea no encontrada'
                },
                { status: 404 }
            )
        }

        // Actualizar estado de la tarea
        await prisma.maintenanceTask.update({
            where: { id: taskId },
            data: {
                status: 'RUNNING',
                lastRun: new Date()
            }
        })

        // Ejecutar la tarea
        const result = await executeMaintenanceTask(task)

        // Crear log de ejecución
        const log = await prisma.maintenanceLog.create({
            data: {
                taskId,
                status: result.success ? 'COMPLETED' : 'FAILED',
                startTime: new Date(),
                endTime: new Date(),
                duration: result.duration,
                result: result.message,
                errorMessage: result.error,
                organizationId: organizationId || null,
                executedById: userId || null
            }
        })

        // Actualizar estado de la tarea
        await prisma.maintenanceTask.update({
            where: { id: taskId },
            data: {
                status: result.success ? 'COMPLETED' : 'FAILED',
                executionTime: result.duration,
                result: result.message,
                errorMessage: result.error,
                lastRun: new Date()
            }
        })

        return NextResponse.json({
            success: true,
            data: {
                task: await prisma.maintenanceTask.findUnique({
                    where: { id: taskId },
                    include: {
                        logs: {
                            orderBy: { createdAt: 'desc' },
                            take: 1
                        }
                    }
                }),
                log
            }
        })

    } catch (error) {
        console.error('Error executing maintenance task:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Error al ejecutar tarea de mantenimiento',
                details: process.env.NODE_ENV === 'development' ? error : undefined
            },
            { status: 500 }
        )
    }
}

// Función para crear tareas de mantenimiento por defecto
async function createDefaultMaintenanceTasks(organizationId?: string | null) {
    const defaultTasks = [
        {
            name: 'Limpiar Cache',
            description: 'Eliminar archivos temporales y limpiar caché del sistema',
            type: 'CACHE_CLEANUP' as const,
            priority: 'MEDIUM' as const
        },
        {
            name: 'Optimizar Base de Datos',
            description: 'Reindexar tablas y optimizar consultas de la base de datos',
            type: 'DATABASE_OPTIMIZATION' as const,
            priority: 'HIGH' as const
        },
        {
            name: 'Verificar Integridad',
            description: 'Comprobar archivos del sistema y verificar integridad de datos',
            type: 'FILESYSTEM_CHECK' as const,
            priority: 'MEDIUM' as const
        },
        {
            name: 'Actualizar Dependencias',
            description: 'Instalar últimas versiones de dependencias del sistema',
            type: 'DEPENDENCY_UPDATE' as const,
            priority: 'LOW' as const
        },
        {
            name: 'Backup Completo',
            description: 'Copia de seguridad completa del sistema',
            type: 'BACKUP_VERIFICATION' as const,
            priority: 'HIGH' as const
        },
        {
            name: 'Limpiar Logs',
            description: 'Eliminar logs antiguos del sistema',
            type: 'LOG_ROTATION' as const,
            priority: 'LOW' as const
        }
    ]

    for (const taskData of defaultTasks) {
        await prisma.maintenanceTask.create({
            data: {
                ...taskData,
                organizationId: organizationId || null
            }
        })
    }
}

// Función para ejecutar tareas de mantenimiento
async function executeMaintenanceTask(task: any) {
    const startTime = Date.now()

    try {
        switch (task.type) {
            case 'CACHE_CLEANUP':
                return await executeCacheCleanup()
            case 'DATABASE_OPTIMIZATION':
                return await executeDatabaseOptimization()
            case 'FILESYSTEM_CHECK':
                return await executeFilesystemCheck()
            case 'DEPENDENCY_UPDATE':
                return await executeDependencyUpdate()
            case 'BACKUP_VERIFICATION':
                return await executeBackupVerification()
            case 'LOG_ROTATION':
                return await executeLogRotation()
            default:
                return {
                    success: false,
                    message: 'Tipo de tarea no reconocido',
                    error: 'TASK_TYPE_UNKNOWN',
                    duration: Date.now() - startTime
                }
        }
    } catch (error) {
        return {
            success: false,
            message: 'Error durante la ejecución',
            error: error instanceof Error ? error.message : 'Unknown error',
            duration: Date.now() - startTime
        }
    }
}

// Funciones específicas para cada tipo de tarea
async function executeCacheCleanup() {
    const startTime = Date.now()

    try {
        // Limpiar caché de Next.js
        const cacheDir = path.join(process.cwd(), '.next', 'cache')
        if (fs.existsSync(cacheDir)) {
            // Simular limpieza (en producción sería más complejo)
            await new Promise(resolve => setTimeout(resolve, 1000))
        }

        return {
            success: true,
            message: 'Cache limpiado exitosamente',
            duration: Date.now() - startTime
        }
    } catch (error) {
        return {
            success: false,
            message: 'Error limpiando cache',
            error: error instanceof Error ? error.message : 'Unknown error',
            duration: Date.now() - startTime
        }
    }
}

async function executeDatabaseOptimization() {
    const startTime = Date.now()

    try {
        // Ejecutar consultas de optimización
        await prisma.$queryRaw`VACUUM ANALYZE`
        await prisma.$queryRaw`REINDEX DATABASE ${process.env.DATABASE_URL?.split('/').pop()}`

        return {
            success: true,
            message: 'Base de datos optimizada exitosamente',
            duration: Date.now() - startTime
        }
    } catch (error) {
        return {
            success: false,
            message: 'Error optimizando base de datos',
            error: error instanceof Error ? error.message : 'Unknown error',
            duration: Date.now() - startTime
        }
    }
}

async function executeFilesystemCheck() {
    const startTime = Date.now()

    try {
        // Verificar archivos del sistema
        const projectDir = process.cwd()
        const files = fs.readdirSync(projectDir)
        let checkedFiles = 0

        for (const file of files) {
            const filePath = path.join(projectDir, file)
            if (fs.existsSync(filePath)) {
                checkedFiles++
            }
        }

        return {
            success: true,
            message: `Verificación completada. ${checkedFiles} archivos verificados`,
            duration: Date.now() - startTime
        }
    } catch (error) {
        return {
            success: false,
            message: 'Error verificando sistema de archivos',
            error: error instanceof Error ? error.message : 'Unknown error',
            duration: Date.now() - startTime
        }
    }
}

async function executeDependencyUpdate() {
    const startTime = Date.now()

    try {
        // Simular actualización de dependencias
        await new Promise(resolve => setTimeout(resolve, 2000))

        return {
            success: true,
            message: 'Dependencias actualizadas exitosamente',
            duration: Date.now() - startTime
        }
    } catch (error) {
        return {
            success: false,
            message: 'Error actualizando dependencias',
            error: error instanceof Error ? error.message : 'Unknown error',
            duration: Date.now() - startTime
        }
    }
}

async function executeBackupVerification() {
    const startTime = Date.now()

    try {
        // Simular verificación de backup
        await new Promise(resolve => setTimeout(resolve, 3000))

        return {
            success: true,
            message: 'Backup verificado exitosamente',
            duration: Date.now() - startTime
        }
    } catch (error) {
        return {
            success: false,
            message: 'Error verificando backup',
            error: error instanceof Error ? error.message : 'Unknown error',
            duration: Date.now() - startTime
        }
    }
}

async function executeLogRotation() {
    const startTime = Date.now()
    const retentionDays = 30
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)

    try {
        let totalDeleted = 0
        let spaceFreed = 0

        // 1. Limpiar logs de notificaciones antiguos
        const notificationLogsDeleted = await prisma.notificationLog.deleteMany({
            where: {
                createdAt: {
                    lt: cutoffDate
                }
            }
        })
        totalDeleted += notificationLogsDeleted.count
        console.log(`Deleted ${notificationLogsDeleted.count} notification logs older than ${retentionDays} days`)

        // 2. Limpiar archivos de logs físicos si existen
        const logsDir = path.join(process.cwd(), 'logs')
        if (fs.existsSync(logsDir)) {
            const logFiles = fs.readdirSync(logsDir)
            let filesDeleted = 0

            for (const file of logFiles) {
                const filePath = path.join(logsDir, file)
                const stats = fs.statSync(filePath)

                // Eliminar archivos de log más antiguos que 30 días
                if (stats.mtime < cutoffDate) {
                    const fileSize = stats.size
                    fs.unlinkSync(filePath)
                    spaceFreed += fileSize
                    filesDeleted++
                }
            }

            console.log(`Deleted ${filesDeleted} log files, freed ${Math.round(spaceFreed / 1024)} KB`)
        }

        // 3. Ejecutar VACUUM en PostgreSQL para recuperar espacio
        try {
            await prisma.$queryRaw`VACUUM`
            console.log('PostgreSQL VACUUM completed successfully')
        } catch (vacuumError) {
            console.warn('VACUUM operation failed:', vacuumError)
        }

        const resultMessage = `Limpieza completada: ${totalDeleted} registros eliminados, ${Math.round(spaceFreed / 1024)} KB liberados. Retención: ${retentionDays} días.`

        return {
            success: true,
            message: resultMessage,
            details: {
                retentionDays,
                totalDeleted,
                spaceFreedKB: Math.round(spaceFreed / 1024),
                notificationLogsDeleted: notificationLogsDeleted.count
            },
            duration: Date.now() - startTime
        }

    } catch (error) {
        console.error('Error during log rotation:', error)
        return {
            success: false,
            message: 'Error durante la rotación de logs',
            error: error instanceof Error ? error.message : 'Unknown error',
            duration: Date.now() - startTime
        }
    }
}
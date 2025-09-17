import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { PrismaClient } from '@prisma/client'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()
const execAsync = promisify(exec)

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

        const { type = 'database' } = await request.json()

        // Crear directorio de backups si no existe
        const backupDir = path.join(process.cwd(), 'backups')
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true })
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const filename = `backup-${type}-${timestamp}.sql`
        const filepath = path.join(backupDir, filename)

        let backupResult = ''

        if (type === 'database') {
            // Backup de PostgreSQL usando pg_dump
            const databaseUrl = process.env.DATABASE_URL
            if (!databaseUrl) {
                throw new Error('DATABASE_URL no configurada')
            }

            // Extraer información de conexión de la URL
            const url = new URL(databaseUrl)
            const host = url.hostname
            const port = url.port
            const database = url.pathname.slice(1)
            const username = url.username
            const password = url.password

            // Comando pg_dump
            const pgDumpCommand = `pg_dump --host=${host} --port=${port} --username=${username} --dbname=${database} --no-password --format=custom --compress=9 --file="${filepath}"`

            // Establecer contraseña en variable de entorno
            process.env.PGPASSWORD = password

            try {
                const { stdout, stderr } = await execAsync(pgDumpCommand)
                backupResult = `Backup completado exitosamente. Archivo: ${filename}`

                if (stderr) {
                    console.log('pg_dump stderr:', stderr)
                }
            } catch (error) {
                console.error('Error ejecutando pg_dump:', error)
                throw new Error(`Error al crear backup: ${error instanceof Error ? error.message : 'Error desconocido'}`)
            } finally {
                // Limpiar variable de entorno
                delete process.env.PGPASSWORD
            }
        } else if (type === 'files') {
            // Backup de archivos (uploads, configuraciones, etc.)
            const sourceDir = path.join(process.cwd(), 'public/uploads')
            const filesBackupPath = path.join(backupDir, `files-${timestamp}.tar.gz`)

            if (fs.existsSync(sourceDir)) {
                const tarCommand = `tar -czf "${filesBackupPath}" -C "${path.dirname(sourceDir)}" "${path.basename(sourceDir)}"`
                await execAsync(tarCommand)
                backupResult = `Backup de archivos completado. Archivo: files-${timestamp}.tar.gz`
            } else {
                backupResult = 'No hay archivos para respaldar'
            }
        } else {
            throw new Error('Tipo de backup no válido. Use "database" o "files"')
        }

        // Registrar el backup en los logs del sistema
        await prisma.systemLog.create({
            data: {
                action: 'BACKUP_CREATED',
                details: {
                    type,
                    filename,
                    filepath,
                    userId: session.user.id,
                    userEmail: session.user.email,
                    timestamp: new Date().toISOString(),
                    size: fs.existsSync(filepath) ? fs.statSync(filepath).size : 0
                },
                ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
                userAgent: request.headers.get('user-agent') || undefined,
                organizationId: session.user.organizationId,
                userId: session.user.id
            }
        })

        // Actualizar configuración del sistema con la fecha del último backup
        await prisma.systemConfig.upsert({
            where: {
                key_organizationId: {
                    key: 'last_backup',
                    organizationId: null as any
                }
            },
            update: {
                value: new Date().toISOString(),
                updatedById: session.user.id
            },
            create: {
                key: 'last_backup',
                value: new Date().toISOString(),
                type: 'STRING',
                description: 'Fecha del último backup realizado',
                isGlobal: true,
                updatedById: session.user.id
            }
        })

        return NextResponse.json({
            success: true,
            data: {
                message: backupResult,
                filename,
                filepath,
                timestamp: new Date().toISOString(),
                size: fs.existsSync(filepath) ? fs.statSync(filepath).size : 0
            }
        })

    } catch (error) {
        console.error('Error al crear backup:', error)

        // Registrar error en logs del sistema
        try {
            const session = await getServerSession(authOptions)
            if (session?.user) {
                await prisma.systemLog.create({
                    data: {
                        action: 'SYSTEM_ERROR',
                        details: {
                            error: error instanceof Error ? error.message : 'Error desconocido',
                            stack: error instanceof Error ? error.stack : undefined,
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
            }
        } catch (logError) {
            console.error('Error al registrar en logs:', logError)
        }

        return NextResponse.json(
            { success: false, error: `Error al crear backup: ${error instanceof Error ? error.message : 'Error desconocido'}` },
            { status: 500 }
        )
    }
}

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

        // Listar archivos de backup disponibles
        const backupDir = path.join(process.cwd(), 'backups')
        const backups = []

        if (fs.existsSync(backupDir)) {
            const files = fs.readdirSync(backupDir)
                .filter(file => file.endsWith('.sql') || file.endsWith('.tar.gz'))
                .map(file => {
                    const filepath = path.join(backupDir, file)
                    const stats = fs.statSync(filepath)
                    return {
                        filename: file,
                        size: stats.size,
                        createdAt: stats.birthtime,
                        type: file.includes('files-') ? 'files' : 'database'
                    }
                })
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

            backups.push(...files)
        }

        return NextResponse.json({
            success: true,
            data: {
                backups,
                totalSize: backups.reduce((sum, backup) => sum + backup.size, 0),
                count: backups.length
            }
        })

    } catch (error) {
        console.error('Error al listar backups:', error)
        return NextResponse.json(
            { success: false, error: 'Error al listar backups' },
            { status: 500 }
        )
    }
}
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notificationTrigger } from '@/lib/email/notificationTrigger'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { user } = session
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')

        const whereClause: any = { organizationId: user.organizationId }

        // Agregar filtro por status si se proporciona
        if (status) {
            whereClause.status = status
        }

        // Si el rol es USER, solo mostrar sus propios registros
        if (user.role === 'USER') {
            const employee = await prisma.employee.findFirst({
                where: {
                    createdById: user.id,
                    organizationId: user.organizationId
                }
            })
            if (!employee) {
                return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
            }
            whereClause.employeeId = employee.id
        }

        const entries = await prisma.timeTracking.findMany({
            where: whereClause,
            include: {
                createdBy: { select: { id: true, name: true } },
                employee: { select: { id: true, firstName: true, lastName: true, position: true } },
                project: { select: { id: true, name: true, code: true } }
            },
            orderBy: { startTime: 'desc' }
        })

        return NextResponse.json(entries)
    } catch (error) {
        console.error('Error fetching time entries:', error)
        return NextResponse.json({ error: 'Error fetching time entries' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { user } = session
        const body = await request.json()
        const { date, startTime, endTime, duration: inputDuration, description, location, coordinates, projectId, employeeId, organizationId, createdById } = body

        if (organizationId !== user.organizationId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        // Verificar permisos
        if (user.role === 'USER') {
            const employee = await prisma.employee.findFirst({
                where: {
                    createdById: user.id,
                    organizationId: user.organizationId
                }
            })
            if (!employee || employee.id !== employeeId) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            }
        }

        const organization = await prisma.organization.findUnique({ where: { id: organizationId } })
        if (!organization) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

        const createdBy = await prisma.user.findUnique({ where: { id: createdById || user.id } })
        if (!createdBy) return NextResponse.json({ error: 'Created by user not found' }, { status: 404 })

        // validate startTime
        if (!startTime) return NextResponse.json({ error: 'startTime is required' }, { status: 400 })
        const start = new Date(startTime)
        if (isNaN(start.getTime())) return NextResponse.json({ error: 'Invalid startTime' }, { status: 400 })

        const end = endTime ? new Date(endTime) : undefined
        if (endTime && isNaN(end!.getTime())) return NextResponse.json({ error: 'Invalid endTime' }, { status: 400 })

        // Calculate duration if both startTime and endTime are provided
        let finalDuration = inputDuration !== undefined ? Number(inputDuration) : undefined
        if (startTime && endTime && finalDuration === undefined) {
            const start = new Date(startTime)
            const end = new Date(endTime)
            const diffMs = end.getTime() - start.getTime()
            finalDuration = Math.round(diffMs / (1000 * 60)) // Convert to minutes
        }

        const entry = await prisma.timeTracking.create({
            data: {
                date: date ? new Date(date) : new Date(),
                startTime: start,
                endTime: end,
                duration: finalDuration,
                description,
                location,
                coordinates,
                projectId,
                employeeId,
                organizationId,
                createdById: createdById || user.id
            },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true } },
                project: { select: { id: true, name: true } },
                createdBy: { select: { id: true, name: true, email: true } }
            }
        })

        // Disparar notificación de registro de tiempo creado
        try {
            await notificationTrigger.onTimeTrackingCreated({
                ...entry,
                hoursWorked: finalDuration ? (finalDuration / 60).toFixed(2) : 0, // Convertir minutos a horas
                workType: 'Registro de tiempo'
            });
        } catch (error) {
            console.error('Error sending time tracking notification:', error);
        }

        return NextResponse.json(entry, { status: 201 })
    } catch (error) {
        console.error('Error creating time entry:', error)
        return NextResponse.json({ error: 'Error creating time entry' }, { status: 500 })
    }
}

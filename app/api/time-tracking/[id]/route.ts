import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { user } = session
        const { id } = params

        const entry = await prisma.timeTracking.findFirst({
            where: {
                id,
                organizationId: user.organizationId
            }
        })

        if (!entry) return NextResponse.json({ error: 'Entry not found' }, { status: 404 })

        // Verificar permisos para USER
        if (user.role === 'USER') {
            const employee = await prisma.employee.findFirst({
                where: {
                    createdById: user.id,
                    organizationId: user.organizationId
                }
            })
            if (!employee || entry.employeeId !== employee.id) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            }
        }

        return NextResponse.json(entry)
    } catch (error) {
        console.error('Error fetching entry:', error)
        return NextResponse.json({ error: 'Error fetching entry' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { user } = session
        const { id } = params
        const body = await request.json()
        const { date, startTime, endTime, duration, description, location, coordinates, projectId, employeeId, status, organizationId } = body

        // Verificar que el registro existe y pertenece a la organización
        const existingEntry = await prisma.timeTracking.findFirst({
            where: {
                id,
                organizationId: user.organizationId
            }
        })

        if (!existingEntry) {
            return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 })
        }

        // Verificar permisos
        if (user.role === 'USER') {
            const employee = await prisma.employee.findFirst({
                where: {
                    createdById: user.id,
                    organizationId: user.organizationId
                }
            })
            if (!employee || existingEntry.employeeId !== employee.id) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            }
            // USER no puede cambiar employeeId
            if (employeeId && employeeId !== existingEntry.employeeId) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            }
        }

        // Calculate duration if both startTime and endTime are provided
        let calculatedDuration = duration !== undefined ? Number(duration) : undefined
        if (startTime && endTime && calculatedDuration === undefined) {
            const start = new Date(startTime)
            const end = new Date(endTime)
            const diffMs = end.getTime() - start.getTime()
            calculatedDuration = Math.round(diffMs / (1000 * 60)) // Convert to minutes
        }

        const updated = await prisma.timeTracking.update({
            where: { id },
            data: {
                date: date ? new Date(date) : undefined,
                startTime: startTime ? new Date(startTime) : undefined,
                endTime: endTime ? new Date(endTime) : undefined,
                duration: calculatedDuration,
                description,
                location,
                coordinates,
                projectId,
                employeeId,
                status,
                updatedAt: new Date()
            },
            include: {
                employee: true,
                project: true
            }
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error('Error updating entry:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { user } = session
        const { id } = params

        // Verificar que el registro existe y pertenece a la organización
        const existingEntry = await prisma.timeTracking.findFirst({
            where: {
                id,
                organizationId: user.organizationId
            }
        })

        if (!existingEntry) {
            return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 })
        }

        // Verificar permisos
        if (user.role === 'USER') {
            const employee = await prisma.employee.findFirst({
                where: {
                    createdById: user.id,
                    organizationId: user.organizationId
                }
            })
            if (!employee || existingEntry.employeeId !== employee.id) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            }
        }

        await prisma.timeTracking.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting entry:', error)
        return NextResponse.json({ error: 'Error deleting entry' }, { status: 500 })
    }
}

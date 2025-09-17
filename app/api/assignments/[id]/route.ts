import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'

const prisma = new PrismaClient()

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const assignment = await prisma.assignment.findFirst({
            where: {
                id: params.id,
                organizationId: session.user.organizationId
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        position: true
                    }
                },
                project: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        })

        if (!assignment) {
            return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
        }

        // Format response to match frontend expectations
        const formattedAssignment = {
            id: assignment.id,
            employeeId: assignment.employeeId,
            employeeName: `${assignment.employee.firstName} ${assignment.employee.lastName}`,
            employeePosition: assignment.employee.position,
            projectId: assignment.projectId,
            projectName: assignment.project.name,
            role: assignment.role,
            startDate: assignment.startDate.toISOString().split('T')[0],
            endDate: assignment.endDate ? assignment.endDate.toISOString().split('T')[0] : null,
            hoursPerWeek: assignment.hoursPerWeek.toString(),
            status: assignment.status === 'ACTIVO' ? 'Activo' :
                assignment.status === 'INACTIVO' ? 'Inactivo' : 'Completado',
            createdAt: assignment.createdAt,
            updatedAt: assignment.updatedAt
        }

        return NextResponse.json(formattedAssignment)
    } catch (error) {
        console.error('Error reading assignment:', error)
        return NextResponse.json({ error: 'Error reading assignment' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        console.log('PUT /api/assignments/[id] - Starting request for ID:', params.id)

        const session = await getServerSession(authOptions)
        console.log('Session:', session ? 'Found' : 'Not found')

        if (!session?.user?.id || !session?.user?.organizationId) {
            console.log('Unauthorized - Missing session data')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        console.log('Request body:', body)

        const {
            employeeId,
            projectId,
            role,
            startDate,
            endDate,
            hoursPerWeek,
            status
        } = body

        // Validate required fields
        if (!employeeId || !projectId || !role || !startDate || !hoursPerWeek) {
            console.log('Missing required fields:', { employeeId, projectId, role, startDate, hoursPerWeek })
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Convert status to enum
        const statusEnum = status === 'Activo' ? 'ACTIVO' :
            status === 'Inactivo' ? 'INACTIVO' : 'COMPLETADO'

        console.log('Updating assignment with data:', {
            id: params.id,
            employeeId,
            projectId,
            role,
            startDate,
            endDate,
            hoursPerWeek,
            status: statusEnum,
            organizationId: session.user.organizationId
        })

        const assignment = await prisma.assignment.updateMany({
            where: {
                id: params.id,
                organizationId: session.user.organizationId
            },
            data: {
                employeeId,
                projectId,
                role,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                hoursPerWeek: parseInt(hoursPerWeek),
                status: statusEnum
            }
        })

        if (assignment.count === 0) {
            console.log('Assignment not found for update')
            return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
        }

        // Fetch the updated assignment
        const updatedAssignment = await prisma.assignment.findFirst({
            where: {
                id: params.id,
                organizationId: session.user.organizationId
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        position: true
                    }
                },
                project: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        })

        console.log('Assignment updated successfully:', updatedAssignment?.id)

        // Format response to match frontend expectations
        const formattedAssignment = {
            id: updatedAssignment!.id,
            employeeId: updatedAssignment!.employeeId,
            employeeName: `${updatedAssignment!.employee.firstName} ${updatedAssignment!.employee.lastName}`,
            employeePosition: updatedAssignment!.employee.position,
            projectId: updatedAssignment!.projectId,
            projectName: updatedAssignment!.project.name,
            role: updatedAssignment!.role,
            startDate: updatedAssignment!.startDate.toISOString().split('T')[0],
            endDate: updatedAssignment!.endDate ? updatedAssignment!.endDate.toISOString().split('T')[0] : null,
            hoursPerWeek: updatedAssignment!.hoursPerWeek.toString(),
            status: updatedAssignment!.status === 'ACTIVO' ? 'Activo' :
                updatedAssignment!.status === 'INACTIVO' ? 'Inactivo' : 'Completado'
        }

        console.log('Returning formatted assignment:', formattedAssignment)

        return NextResponse.json(formattedAssignment)
    } catch (error) {
        console.error('Error updating assignment:', error)
        return NextResponse.json({ error: 'Error updating assignment' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        console.log('DELETE /api/assignments/[id] - Starting request for ID:', params.id)

        const session = await getServerSession(authOptions)
        console.log('Session:', session ? 'Found' : 'Not found')

        if (!session?.user?.organizationId) {
            console.log('Unauthorized - Missing session data')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const assignment = await prisma.assignment.deleteMany({
            where: {
                id: params.id,
                organizationId: session.user.organizationId
            }
        })

        if (assignment.count === 0) {
            console.log('Assignment not found for deletion')
            return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
        }

        console.log('Assignment deleted successfully:', params.id)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting assignment:', error)
        return NextResponse.json({ error: 'Error deleting assignment' }, { status: 500 })
    }
}

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const organizationId = searchParams.get('organizationId') || session.user.organizationId
        const id = searchParams.get('id')

        if (id) {
            const assignment = await prisma.assignment.findFirst({
                where: {
                    id,
                    organizationId
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
        }

        const assignments = await prisma.assignment.findMany({
            where: {
                organizationId
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
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        // Format response to match frontend expectations
        const formattedAssignments = assignments.map(assignment => ({
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
                assignment.status === 'INACTIVO' ? 'Inactivo' : 'Completado'
        }))

        return NextResponse.json(formattedAssignments)
    } catch (error) {
        console.error('Error reading assignments:', error)
        return NextResponse.json({ error: 'Error reading assignments' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        console.log('POST /api/assignments - Starting request')

        const session = await getServerSession(authOptions)
        console.log('Session:', session ? 'Found' : 'Not found')

        if (!session?.user?.id || !session?.user?.organizationId) {
            console.log('Unauthorized - Missing session data')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        console.log('Session user:', {
            id: session.user.id,
            organizationId: session.user.organizationId
        })

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

        console.log('Creating assignment with data:', {
            employeeId,
            projectId,
            role,
            startDate,
            endDate,
            hoursPerWeek,
            status: statusEnum,
            organizationId: session.user.organizationId,
            createdById: session.user.id
        })

        const assignment = await prisma.assignment.create({
            data: {
                employeeId,
                projectId,
                role,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                hoursPerWeek: parseInt(hoursPerWeek),
                status: statusEnum,
                organizationId: session.user.organizationId,
                createdById: session.user.id
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

        console.log('Assignment created successfully:', assignment.id)

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
                assignment.status === 'INACTIVO' ? 'Inactivo' : 'Completado'
        }

        console.log('Returning formatted assignment:', formattedAssignment)

        return NextResponse.json(formattedAssignment, { status: 201 })
    } catch (error) {
        console.error('Error creating assignment:', error)
        return NextResponse.json({ error: 'Error creating assignment' }, { status: 500 })
    }
}

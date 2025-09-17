import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notificationTrigger } from '@/lib/email/notificationTrigger'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params
        const employee = await prisma.employee.findUnique({
            where: { id },
            include: { createdBy: { select: { id: true, name: true, email: true } } }
        })

        // fetch assigned projects separately to avoid include typing issues
        let employeeProjects = []
        if (employee) {
            employeeProjects = await (prisma as any).employeeProject.findMany({ where: { employeeId: id }, include: { project: true } })
        }

        if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

        const full = { ...(employee as any), employeeProjects }
        const withName = { ...full, name: `${full.firstName || ''} ${full.lastName || ''}`.trim(), joinDate: full.hireDate || full.joinDate || null }
        return NextResponse.json(withName)
    } catch (error) {
        console.error('Error fetching employee:', error)
        return NextResponse.json({ error: 'Error fetching employee' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params
        const body = await request.json()

        console.log('PUT /api/employees/[id] - Received body:', JSON.stringify(body, null, 2))

        // Get current session to identify who is updating
        const session = await getServerSession(authOptions)
        const currentUser = session?.user

        const { projectIds, name, joinDate, ...rest } = body

        // Transform frontend fields to match Prisma schema
        const transformedData: any = {}

        // Valid fields for Employee model update
        const validFields = [
            'firstName', 'lastName', 'email', 'phone', 'position', 'department',
            'salary', 'hireDate', 'birthDate', 'address', 'emergencyContact',
            'emergencyPhone', 'status'
        ]

        // Filter out invalid fields and transform data
        Object.keys(rest).forEach(key => {
            if (validFields.includes(key)) {
                if (key === 'salary' && rest[key] !== undefined && rest[key] !== '') {
                    transformedData[key] = parseFloat(rest[key])
                } else if (key === 'hireDate' && rest[key]) {
                    transformedData[key] = new Date(rest[key])
                } else if (key === 'birthDate' && rest[key]) {
                    transformedData[key] = new Date(rest[key])
                } else {
                    transformedData[key] = rest[key]
                }
            }
        })

        // Handle name field - split into firstName and lastName
        if (name && typeof name === 'string') {
            const nameParts = name.trim().split(' ')
            transformedData.firstName = nameParts[0] || ''
            transformedData.lastName = nameParts.slice(1).join(' ') || ''
        }

        // Handle joinDate field - convert to hireDate
        if (joinDate) {
            transformedData.hireDate = new Date(joinDate)
        }

        console.log('PUT /api/employees/[id] - Filtered and transformed data:', JSON.stringify(transformedData, null, 2))

        // Use a transaction to update the employee and sync project links atomically
        const result = await prisma.$transaction(async (tx) => {
            console.log('PUT /api/employees/[id] - Starting transaction for employee update')

            const updated = await tx.employee.update({
                where: { id },
                data: {
                    ...transformedData,
                    salary: transformedData.salary ? parseFloat(transformedData.salary) : undefined,
                    hireDate: transformedData.hireDate || undefined
                }
            })

            console.log('PUT /api/employees/[id] - Employee updated successfully:', updated.id)

            const t = tx as any
            // remove existing links
            await t.employeeProject.deleteMany({ where: { employeeId: id } })
            console.log('PUT /api/employees/[id] - Removed existing project links')

            // create new links if provided
            if (Array.isArray(projectIds) && projectIds.length > 0) {
                const toCreate = projectIds.map((p: string) => ({ employeeId: id, projectId: p }))
                try {
                    await t.employeeProject.createMany({ data: toCreate, skipDuplicates: true })
                    console.log('PUT /api/employees/[id] - Created new project links:', projectIds.length)
                } catch (e) {
                    console.error('Error creating employee-project links during update', e)
                }
            }

            return updated
        })

        console.log('PUT /api/employees/[id] - Transaction completed successfully')

        // 🚀 Disparar notificación de empleado actualizado (asíncrono, no bloquea la respuesta)
        setImmediate(async () => {
            try {
                const notificationData = {
                    ...result,
                    organizationId: result.organizationId,
                    updatedBy: currentUser ? { name: currentUser.name || 'Usuario' } : { name: 'Sistema' }
                }
                await notificationTrigger.onEmployeeUpdated(notificationData);
                console.log('PUT /api/employees/[id] - Employee update notification sent');
            } catch (notificationError) {
                console.error('Error sending employee update notification:', notificationError);
                // No fallar la actualización por error en notificación
            }
        });

        // return the full employee with assigned projects
        const fullEmployee = await prisma.employee.findUnique({
            where: { id },
            include: { createdBy: { select: { id: true, name: true, email: true } } }
        })

        const updatedEmployeeProjects = await (prisma as any).employeeProject.findMany({ where: { employeeId: id }, include: { project: true } })

        const full = { ...(fullEmployee as any), employeeProjects: updatedEmployeeProjects }

        console.log('PUT /api/employees/[id] - Returning updated employee data')

        return NextResponse.json(full || result)
    } catch (error: any) {
        console.error('Error updating employee:', error)
        console.error('Error details:', {
            message: error?.message,
            code: error?.code,
            meta: error?.meta,
            stack: error?.stack
        })

        // Return more detailed error information
        return NextResponse.json({
            error: 'Error updating employee',
            details: error?.message || 'Unknown error',
            code: error?.code || 'UNKNOWN_ERROR'
        }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params
        await prisma.employee.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting employee:', error)
        return NextResponse.json({ error: 'Error deleting employee' }, { status: 500 })
    }
}

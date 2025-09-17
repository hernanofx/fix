import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notificationTrigger } from '@/lib/email/notificationTrigger'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            firstName,
            lastName,
            name,
            email,
            phone,
            position,
            department,
            salary,
            hireDate,
            joinDate,
            address,
            emergencyContact,
            emergencyPhone,
            organizationId,
            createdById,
            projectIds
        } = body

        // Accept `name` (single field) from front-end and split into first/last
        let effectiveFirstName = firstName
        let effectiveLastName = lastName
        if (!effectiveFirstName && name) {
            const parts = String(name).trim().split(/\s+/)
            effectiveFirstName = parts.shift() || ''
            effectiveLastName = parts.join(' ') || ''
        }

        // Accept joinDate as alias for hireDate
        const effectiveHireDate = hireDate ?? joinDate

        if (!effectiveFirstName) {
            return NextResponse.json({ error: 'firstName (or name) is required' }, { status: 400 })
        }

        if (!organizationId) {
            return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
        }

        if (!createdById) {
            return NextResponse.json({ error: 'createdById is required' }, { status: 400 })
        }

        const organization = await prisma.organization.findUnique({ where: { id: organizationId } })
        if (!organization) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        let createdBy = null
        try {
            createdBy = await prisma.user.findUnique({ where: { id: createdById } })
        } catch (e) {
            console.error('Error querying createdBy user', e)
            return NextResponse.json({ error: 'Error validating createdById' }, { status: 400 })
        }

        if (!createdBy) {
            return NextResponse.json({ error: 'Created by user not found' }, { status: 404 })
        }

        console.log('Creating employee with payload', { firstName, lastName, email, phone, position, department, salary: !!salary, hireDate: !!hireDate, organizationId, createdById, projectIdsLength: Array.isArray(projectIds) ? projectIds.length : undefined })

        // Validate projectIds exist and belong to the organization to avoid FK errors
        if (projectIds !== undefined) {
            if (!Array.isArray(projectIds)) {
                return NextResponse.json({ error: 'projectIds must be an array of project ids' }, { status: 400 })
            }

            if (projectIds.length > 0) {
                try {
                    const found = await prisma.project.findMany({ where: { id: { in: projectIds }, organizationId }, select: { id: true } })
                    const foundIds = new Set(found.map((p: any) => p.id))
                    const missing = projectIds.filter((p: string) => !foundIds.has(p))
                    if (missing.length > 0) {
                        console.error('Some projectIds not found or not in organization', { missing })
                        return NextResponse.json({ error: 'Some projectIds are invalid or do not belong to the organization', missing }, { status: 400 })
                    }
                } catch (e) {
                    console.error('Error validating projectIds', e)
                    return NextResponse.json({ error: 'Error validating projectIds' }, { status: 400 })
                }
            }
        }

        // Use a transaction to ensure employee and links are created atomically
        let employee
        try {
            employee = await prisma.$transaction(async (tx) => {
                const created = await tx.employee.create({
                    data: {
                        firstName: effectiveFirstName,
                        lastName: effectiveLastName,
                        email,
                        phone,
                        position,
                        department,
                        salary: salary ? parseFloat(salary) : undefined,
                        hireDate: effectiveHireDate ? new Date(effectiveHireDate) : undefined,
                        address,
                        emergencyContact,
                        emergencyPhone,
                        organizationId,
                        createdById
                    }
                })

                if (projectIds !== undefined) {
                    if (!Array.isArray(projectIds)) {
                        throw new Error('projectIds must be an array of project ids')
                    }

                    if (projectIds.length > 0) {
                        const toCreate = projectIds.map((p: string) => ({ employeeId: created.id, projectId: p }))
                        console.log('Creating employee-project links inside transaction', { count: toCreate.length })
                        try {
                            await (tx as any).employeeProject.createMany({ data: toCreate, skipDuplicates: true })
                        } catch (e) {
                            console.error('Error creating employee-project links in transaction', e)
                            // rethrow to rollback
                            throw e
                        }
                    }
                }

                return created
            })
        } catch (e: any) {
            console.error('Transaction failed while creating employee and links:', e?.message || e, e?.stack || '')
            const msg = e && e.message ? e.message : 'Error creating employee and links'
            return NextResponse.json({ error: msg }, { status: 500 })
        }

        console.log('Employee created', { id: employee.id })
        // fetch full employee and assigned projects separately to avoid include issues
        const fullEmployee = await prisma.employee.findUnique({ where: { id: employee.id }, include: { createdBy: { select: { id: true, name: true, email: true } } } })
        const assigned = await (prisma as any).employeeProject.findMany({ where: { employeeId: employee.id }, include: { project: true } })
        const full = { ...(fullEmployee as any), employeeProjects: assigned }

        // 🚀 Disparar notificación de empleado creado
        try {
            await notificationTrigger.onEmployeeCreated({
                ...fullEmployee,
                organizationId
            });
            console.log('Employee creation notification sent');
        } catch (notificationError) {
            console.error('Error sending employee notification:', notificationError);
        }

        console.log('Returning created employee with assigned projects', { id: employee.id, assignedCount: Array.isArray(assigned) ? assigned.length : 0 })

        return NextResponse.json(full || employee, { status: 201 })
    } catch (error: any) {
        console.error('Error creating employee:', error?.message || error, error?.stack || '')
        return NextResponse.json({ error: (error && (error.message || String(error))) || 'Error creating employee' }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const organizationId = searchParams.get('organizationId')

        if (!organizationId) {
            return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
        }

        const employees = await (prisma as any).employee.findMany({
            where: { organizationId },
            include: { createdBy: { select: { id: true, name: true, email: true } }, employeeProjects: { include: { project: true } } },
            orderBy: { createdAt: 'desc' }
        })

        // normalize fields for frontend: combine firstName + lastName into name and expose joinDate (hireDate)
        const normalized = (employees || []).map((e: any) => ({
            ...e,
            name: `${e.firstName || ''} ${e.lastName || ''}`.trim(),
            joinDate: e.hireDate || e.joinDate || null
        }))

        return NextResponse.json(normalized)
    } catch (error) {
        console.error('Error fetching employees:', error)
        return NextResponse.json({ error: 'Error fetching employees' }, { status: 500 })
    }
}

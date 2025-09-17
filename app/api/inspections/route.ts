import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notificationTrigger } from '@/lib/email/notificationTrigger'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            title,
            description,
            type,
            priority = 'MEDIUM',
            location,
            scheduledDate,
            projectId,
            organizationId,
            createdById,
            inspectedById,
            inspector
        } = body

        if (!organizationId) {
            return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
        }

        const organization = await prisma.organization.findUnique({ where: { id: organizationId } })
        if (!organization) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        const createdBy = await prisma.user.findUnique({ where: { id: createdById } })
        if (!createdBy) {
            return NextResponse.json({ error: 'Created by user not found' }, { status: 404 })
        }

        // Map localized frontend labels to Prisma enum tokens
        const typeMap: Record<string, string> = {
            'Estructural': 'PROGRESS',
            'Instalaciones': 'MAINTENANCE',
            'Final': 'FINAL',
            'Seguridad': 'SAFETY',
            'Calidad': 'QUALITY'
        }

        const priorityMap: Record<string, string> = {
            'Baja': 'LOW',
            'Media': 'MEDIUM',
            'Alta': 'HIGH',
            'Crítica': 'URGENT'
        }

        const allowedTypes = ['SAFETY', 'QUALITY', 'PROGRESS', 'FINAL', 'MAINTENANCE']
        const allowedPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

        const mappedType = typeof type === 'string' ? (typeMap[type] ?? type) : undefined
        const mappedPriority = typeof priority === 'string' ? (priorityMap[priority] ?? priority) : 'MEDIUM'

        if (mappedType && !allowedTypes.includes(mappedType)) {
            return NextResponse.json({ error: `Invalid inspection type: ${type}` }, { status: 400 })
        }

        if (mappedPriority && !allowedPriorities.includes(mappedPriority)) {
            return NextResponse.json({ error: `Invalid priority: ${priority}` }, { status: 400 })
        }

        // Resolve inspector: if an id was provided use it, otherwise try to match a user by name inside the organization
        let resolvedInspectedById: string | undefined = undefined
        if (inspectedById && typeof inspectedById === 'string') {
            resolvedInspectedById = inspectedById
        } else if (inspector && typeof inspector === 'string' && inspector.trim().length > 0) {
            const found = await prisma.user.findFirst({ where: { organizationId, name: inspector } })
            if (found) resolvedInspectedById = found.id
        }

        const inspection = await prisma.inspection.create({
            data: {
                title,
                description,
                type: mappedType as any,
                priority: mappedPriority as any,
                location,
                inspector, // Guardar el inspector como texto libre
                scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
                projectId,
                organizationId,
                createdById,
                inspectedById: resolvedInspectedById
            },
            include: {
                createdBy: { select: { id: true, name: true, email: true } },
                project: { select: { id: true, name: true } },
                inspectedBy: { select: { id: true, name: true, email: true } }
            }
        })

        // Disparar notificación de inspección programada
        try {
            await notificationTrigger.onInspectionScheduled(inspection);
        } catch (error) {
            console.error('Error sending inspection notification:', error);
        }

        return NextResponse.json(inspection, { status: 201 })
    } catch (error) {
        console.error('Error creating inspection:', error)
        return NextResponse.json({ error: 'Error creating inspection' }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const organizationId = searchParams.get('organizationId')

        if (!organizationId) {
            return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
        }

        const inspections = await prisma.inspection.findMany({
            where: { organizationId },
            include: {
                createdBy: { select: { id: true, name: true, email: true } },
                project: { select: { id: true, name: true } },
                inspectedBy: { select: { id: true, name: true, email: true } }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(inspections)
    } catch (error) {
        console.error('Error fetching inspections:', error)
        return NextResponse.json({ error: 'Error fetching inspections' }, { status: 500 })
    }
}

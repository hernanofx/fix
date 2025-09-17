import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const organizationId = searchParams.get('organizationId')

        if (!organizationId) {
            return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
        }

        const tasks = await (prisma as any).task.findMany({
            where: { organizationId },
            include: {
                project: { select: { id: true, name: true } },
                assignee: { select: { id: true, firstName: true, lastName: true } },
                createdBy: { select: { id: true, name: true, email: true } },
                rubro: { select: { id: true, name: true } },
                provider: { select: { id: true, name: true } },
                client: { select: { id: true, name: true } }
            },
            orderBy: { startDate: 'asc' }
        })

        // Map relational fields to friendly names for the client
        const mapped = (tasks as any[]).map((t: any) => ({
            ...t,
            project: t.project ? t.project.name : null,
            assignee: t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}` : null,
            rubro: t.rubro ? t.rubro.name : null,
            provider: t.provider ? t.provider.name : null,
            client: t.client ? t.client.name : null
        }))

        return NextResponse.json(mapped)
    } catch (error) {
        console.error('Error reading planning:', error)
        return NextResponse.json({ error: 'Error reading planning' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            title,
            description,
            startDate,
            endDate,
            estimatedHours,
            progress = 0,
            priority = 'MEDIUM',
            status = 'PENDING',
            projectId,
            assigneeId,
            rubroId,
            providerId,
            clientId,
            externalLinks = [],
            organizationId,
            createdById
        } = body

        // Basic validation
        if (!organizationId) return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
        if (!createdById) return NextResponse.json({ error: 'createdById is required' }, { status: 400 })
        if (!title || typeof title !== 'string') return NextResponse.json({ error: 'title is required' }, { status: 400 })

        const parsedStart = startDate ? new Date(startDate) : null
        const parsedEnd = endDate ? new Date(endDate) : null
        if (parsedStart && isNaN(parsedStart.getTime())) return NextResponse.json({ error: 'Invalid startDate' }, { status: 400 })
        if (parsedEnd && isNaN(parsedEnd.getTime())) return NextResponse.json({ error: 'Invalid endDate' }, { status: 400 })

        const created = await (prisma as any).task.create({
            data: {
                title: title.trim(),
                description: description ?? null,
                startDate: parsedStart,
                endDate: parsedEnd,
                estimatedHours: estimatedHours ? Number(estimatedHours) : null,
                progress: Number.isFinite(Number(progress)) ? Number(progress) : 0,
                priority: priority as any,
                status: status as any,
                projectId: projectId ?? null,
                assigneeId: assigneeId ?? null,
                rubroId: rubroId ?? null,
                providerId: providerId ?? null,
                clientId: clientId ?? null,
                externalLinks: externalLinks || [],
                organizationId,
                createdById
            },
            include: {
                project: { select: { id: true, name: true } },
                assignee: { select: { id: true, firstName: true, lastName: true } },
                rubro: { select: { id: true, name: true } },
                provider: { select: { id: true, name: true } },
                client: { select: { id: true, name: true } }
            }
        })

        const mapped = {
            ...created,
            project: created.project ? created.project.name : null,
            assignee: created.assignee ? `${created.assignee.firstName} ${created.assignee.lastName}` : null,
            rubro: created.rubro ? created.rubro.name : null,
            provider: created.provider ? created.provider.name : null,
            client: created.client ? created.client.name : null
        }

        return NextResponse.json(mapped, { status: 201 })
    } catch (error) {
        console.error('Error creating planning item:', error)
        const message = (error && (error as any).message) ? (error as any).message : 'Error creating planning item'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const found = await (prisma as any).task.findUnique({
            where: { id: params.id },
            include: {
                project: { select: { id: true, name: true } },
                assignee: { select: { id: true, firstName: true, lastName: true } },
                rubro: { select: { id: true, name: true } },
                provider: { select: { id: true, name: true } },
                client: { select: { id: true, name: true } }
            }
        })
        if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        const mapped = {
            ...found,
            project: found.project ? found.project.name : null,
            assignee: found.assignee ? `${found.assignee.firstName} ${found.assignee.lastName}` : null,
            rubro: found.rubro ? found.rubro.name : null,
            provider: found.provider ? found.provider.name : null,
            client: found.client ? found.client.name : null
        }
        return NextResponse.json(mapped)
    } catch (error) {
        console.error('Error reading planning item:', error)
        return NextResponse.json({ error: 'Error reading planning item' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await request.json()
        const update: any = {}
        if (body.title) update.title = String(body.title).trim()
        if (body.description !== undefined) update.description = body.description
        if (body.startDate) {
            const d = new Date(body.startDate)
            if (isNaN(d.getTime())) return NextResponse.json({ error: 'Invalid startDate' }, { status: 400 })
            update.startDate = d
        }
        if (body.endDate) {
            const d = new Date(body.endDate)
            if (isNaN(d.getTime())) return NextResponse.json({ error: 'Invalid endDate' }, { status: 400 })
            update.endDate = d
        }
        if (body.estimatedHours !== undefined) update.estimatedHours = Number(body.estimatedHours)
        if (body.progress !== undefined) update.progress = Number(body.progress)
        if (body.priority) update.priority = body.priority
        if (body.status) update.status = body.status
        if (body.projectId !== undefined) update.projectId = body.projectId || null
        if (body.assigneeId !== undefined) update.assigneeId = body.assigneeId || null
        if (body.rubroId !== undefined) update.rubroId = body.rubroId || null
        if (body.providerId !== undefined) update.providerId = body.providerId || null
        if (body.clientId !== undefined) update.clientId = body.clientId || null
        if (body.externalLinks !== undefined) update.externalLinks = body.externalLinks || []

        const updated = await (prisma as any).task.update({
            where: { id: params.id },
            data: update,
            include: {
                project: { select: { id: true, name: true } },
                assignee: { select: { id: true, firstName: true, lastName: true } },
                rubro: { select: { id: true, name: true } },
                provider: { select: { id: true, name: true } },
                client: { select: { id: true, name: true } }
            }
        })
        const mapped = {
            ...updated,
            project: updated.project ? updated.project.name : null,
            assignee: updated.assignee ? `${updated.assignee.firstName} ${updated.assignee.lastName}` : null,
            rubro: updated.rubro ? updated.rubro.name : null,
            provider: updated.provider ? updated.provider.name : null,
            client: updated.client ? updated.client.name : null
        }
        return NextResponse.json(mapped)
    } catch (error) {
        console.error('Error updating planning item:', error)
        return NextResponse.json({ error: 'Error updating planning item' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        await (prisma as any).task.delete({ where: { id: params.id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting planning item:', error)
        return NextResponse.json({ error: 'Error deleting planning item' }, { status: 500 })
    }
}

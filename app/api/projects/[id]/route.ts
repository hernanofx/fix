import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const { pathname } = new URL(request.url)
        const parts = pathname.split('/')
        const id = parts[parts.length - 1]
        if (!id) return NextResponse.json({ error: 'Project id is required' }, { status: 400 })

        const project = await prisma.project.findUnique({
            where: { id },
        })

        if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

        return NextResponse.json(project)
    } catch (err) {
        console.error('Error fetching project:', err)
        return NextResponse.json({ error: 'Error fetching project' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { pathname } = new URL(request.url)
        const parts = pathname.split('/')
        const id = parts[parts.length - 1]
        if (!id) return NextResponse.json({ error: 'Project id is required' }, { status: 400 })

        const body = await request.json()
        const {
            name,
            description,
            code,
            status,
            priority,
            startDate,
            endDate,
            budget,
            address,
            city,
            coordinates,
            progress
        } = body

        const parsedStartDate = startDate ? new Date(startDate) : null
        const parsedEndDate = endDate ? new Date(endDate) : null

        let budgetNumber: number | null = null
        if (budget !== undefined && budget !== null && budget !== '') {
            const b = Number(budget)
            budgetNumber = Number.isFinite(b) ? b : null
        }

        const updated = await prisma.project.update({
            where: { id },
            data: {
                name: name !== undefined ? String(name).trim() : undefined,
                description: description ?? undefined,
                code: code ?? undefined,
                status: status ?? undefined,
                priority: priority ?? undefined,
                startDate: parsedStartDate ?? undefined,
                endDate: parsedEndDate ?? undefined,
                budget: budgetNumber ?? undefined,
                address: address ?? undefined,
                city: city ?? undefined,
                coordinates: coordinates ?? undefined,
                progress: progress ?? undefined
            }
        })

        return NextResponse.json(updated)
    } catch (err) {
        console.error('Error updating project:', err)
        return NextResponse.json({ error: 'Error updating project' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { pathname } = new URL(request.url)
        const parts = pathname.split('/')
        const id = parts[parts.length - 1]
        if (!id) return NextResponse.json({ error: 'Project id is required' }, { status: 400 })

        await prisma.project.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('Error deleting project:', err)
        return NextResponse.json({ error: 'Error deleting project' }, { status: 500 })
    }
}

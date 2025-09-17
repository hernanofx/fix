import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params
        const inspection = await prisma.inspection.findUnique({
            where: { id },
            include: { createdBy: { select: { id: true, name: true, email: true } } }
        })

        if (!inspection) return NextResponse.json({ error: 'Inspection not found' }, { status: 404 })
        return NextResponse.json(inspection)
    } catch (error) {
        console.error('Error fetching inspection:', error)
        return NextResponse.json({ error: 'Error fetching inspection' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params
        const body = await request.json()

        // Extraer campos de relación
        const { projectId, inspectedById, ...updateData } = body

        // Preparar datos de actualización
        const data: any = {
            ...updateData,
            scheduledDate: updateData.scheduledDate ? new Date(updateData.scheduledDate) : undefined
        }

        // Manejar relación con proyecto
        if (projectId) {
            data.project = { connect: { id: projectId } }
        } else if (projectId === null) {
            data.project = { disconnect: true }
        }

        // Manejar relación con inspector
        if (inspectedById) {
            data.inspectedBy = { connect: { id: inspectedById } }
        } else if (inspectedById === null) {
            data.inspectedBy = { disconnect: true }
        }

        const updated = await prisma.inspection.update({
            where: { id },
            data,
            include: {
                createdBy: { select: { id: true, name: true, email: true } },
                project: { select: { id: true, name: true } },
                inspectedBy: { select: { id: true, name: true, email: true } }
            }
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error('Error updating inspection:', error)
        return NextResponse.json({ error: 'Error updating inspection' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params
        await prisma.inspection.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting inspection:', error)
        return NextResponse.json({ error: 'Error deleting inspection' }, { status: 500 })
    }
}

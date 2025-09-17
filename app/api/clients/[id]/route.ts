import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params
        const client = await prisma.client.findUnique({ where: { id } })
        if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json(client)
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
    }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params
        const body = await request.json()

        const updated = await prisma.client.update({
            where: { id },
            data: {
                name: body.name,
                email: body.email || null,
                phone: body.phone || null,
                address: body.address || null,
                city: body.city || null,
                country: body.country || null,
                rut: body.rut || null,
                contactName: body.contactName || null,
                contactPhone: body.contactPhone || null,
                notes: body.notes || null,
                status: body.status || undefined,
                situacion: body.situacion || null, // Added missing situacion field
                projectInterests: body.projectInterests || [],
                materialInterests: body.materialInterests || [],
                rubroInterests: body.rubroInterests || [],
                prospectNotes: body.prospectNotes || null,
            },
        })

        return NextResponse.json(updated)
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params
        await prisma.client.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
    }
}

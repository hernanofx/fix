import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params
        const provider = await prisma.provider.findUnique({
            where: { id },
        })

        if (!provider) {
            return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
        }

        return NextResponse.json(provider)
    } catch (error) {
        console.error('Error fetching provider:', error)
        return NextResponse.json({ error: 'Error fetching provider' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params
        const body = await request.json()

        const provider = await prisma.provider.update({
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
                website: body.website || null,
                category: body.category || null,
                paymentTerms: body.paymentTerms || null,
                notes: body.notes || null,
                status: body.status,
            },
        })

        return NextResponse.json(provider)
    } catch (error) {
        console.error('Error updating provider:', error)
        return NextResponse.json({ error: 'Error updating provider' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params
        await prisma.provider.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting provider:', error)
        return NextResponse.json({ error: 'Error deleting provider' }, { status: 500 })
    }
}

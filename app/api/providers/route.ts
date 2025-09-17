import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notificationTrigger } from '@/lib/email/notificationTrigger'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const organizationId = searchParams.get('organizationId')

        if (!organizationId) {
            return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
        }

        const providers = await prisma.provider.findMany({
            where: { organizationId },
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json(providers)
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            name,
            email,
            phone,
            address,
            city,
            country,
            rut,
            contactName,
            contactPhone,
            website,
            category,
            paymentTerms,
            notes,
            status,
            organizationId,
            createdById,
        } = body

        if (!name || !organizationId || !createdById) {
            return NextResponse.json({ error: 'name, organizationId and createdById are required' }, { status: 400 })
        }

        const provider = await prisma.provider.create({
            data: {
                name,
                email: email || null,
                phone: phone || null,
                address: address || null,
                city: city || null,
                country: country || null,
                rut: rut || null,
                contactName: contactName || null,
                contactPhone: contactPhone || null,
                website: website || null,
                category: category || null,
                paymentTerms: paymentTerms || null,
                notes: notes || null,
                status: status || undefined,
                organizationId,
                createdById,
            },
            include: {
                createdBy: { select: { id: true, name: true, email: true } }
            }
        })

        // Disparar notificación de proveedor creado
        try {
            await notificationTrigger.onProviderCreated({
                ...provider,
                services: provider.category // Usar category como services para la notificación
            });
        } catch (error) {
            console.error('Error sending provider notification:', error);
        }

        return NextResponse.json(provider)
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
    }
}

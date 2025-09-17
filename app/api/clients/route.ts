import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notificationTrigger } from '@/lib/email/notificationTrigger'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const organizationId = searchParams.get('organizationId')
        const status = searchParams.get('status')

        if (!organizationId) {
            return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
        }

        const where: any = { organizationId }
        if (status) {
            where.status = status
        }

        const clients = await prisma.client.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                paymentTermRelations: {
                    select: {
                        amount: true,
                        currency: true,
                        status: true
                    }
                },
                payments: {
                    where: {
                        status: 'PAID'
                    },
                    select: {
                        amount: true,
                        currency: true
                    }
                }
            }
        })

        // Calculate outstanding balance for each client
        const clientsWithBalance = clients.map(client => {
            const balancesByCurrency: Record<string, number> = {}

            // Add all payment terms (total amount expected)
            client.paymentTermRelations.forEach(term => {
                const currency = term.currency || 'PESOS'
                const amount = parseFloat(term.amount.toString()) || 0
                balancesByCurrency[currency] = (balancesByCurrency[currency] || 0) + amount
            })

            // Subtract all paid amounts
            client.payments.forEach(payment => {
                const currency = payment.currency || 'PESOS'
                const amount = parseFloat(payment.amount.toString()) || 0
                balancesByCurrency[currency] = (balancesByCurrency[currency] || 0) - amount
            })

            // Find the currency with the highest absolute balance
            let mainCurrency = 'PESOS'
            let mainAmount = 0

            Object.entries(balancesByCurrency).forEach(([currency, amount]) => {
                if (Math.abs(amount) > Math.abs(mainAmount)) {
                    mainCurrency = currency
                    mainAmount = amount
                }
            })

            return {
                ...client,
                outstandingBalance: mainAmount,
                outstandingBalanceCurrency: mainCurrency,
                balancesByCurrency,
                // Remove the included relations from the response to keep it clean
                paymentTermRelations: undefined,
                payments: undefined
            }
        })

        return NextResponse.json(clientsWithBalance)
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
            notes,
            status,
            organizationId,
            createdById,
            projectInterests,
            materialInterests,
            rubroInterests,
            prospectNotes,
        } = body

        if (!name || !organizationId || !createdById) {
            return NextResponse.json({ error: 'name, organizationId and createdById are required' }, { status: 400 })
        }

        const client = await prisma.client.create({
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
                notes: notes || null,
                status: status || undefined,
                projectInterests: projectInterests || [],
                materialInterests: materialInterests || [],
                rubroInterests: rubroInterests || [],
                prospectNotes: prospectNotes || null,
                organizationId,
                createdById,
            },
            include: {
                createdBy: { select: { id: true, name: true, email: true } }
            }
        })

        // Disparar notificación de cliente creado
        try {
            await notificationTrigger.onClientCreated(client);
        } catch (error) {
            console.error('Error sending client notification:', error);
        }

        return NextResponse.json(client)
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
    }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const organizationId = searchParams.get('organizationId')

        if (!organizationId) {
            return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
        }

        const cashBoxes = await prisma.cashBox.findMany({
            where: { organizationId, isActive: true },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(cashBoxes)
    } catch (error) {
        console.error('Error fetching cash boxes:', error)
        return NextResponse.json({ error: 'Error fetching cash boxes' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { name, initialBalance = 0, description, organizationId } = body

        if (!name || !organizationId) {
            return NextResponse.json({ error: 'name and organizationId are required' }, { status: 400 })
        }

        const cashBox = await prisma.cashBox.create({
            data: {
                name,
                currency: 'PESOS', // Las cajas son bimonetarias, siempre PESOS por defecto
                description,
                organizationId
            }
        })

        // Crear balance inicial si se proporciona
        if (parseFloat(initialBalance.toString()) > 0) {
            await prisma.accountBalance.create({
                data: {
                    accountId: cashBox.id,
                    accountType: 'CASH_BOX',
                    currency: 'PESOS',
                    balance: parseFloat(initialBalance.toString()),
                    organizationId
                }
            })
        }

        return NextResponse.json(cashBox, { status: 201 })
    } catch (error) {
        console.error('Error creating cash box:', error)
        return NextResponse.json({ error: 'Error creating cash box' }, { status: 500 })
    }
}

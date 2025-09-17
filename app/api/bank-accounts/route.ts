import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const organizationId = searchParams.get('organizationId')

        if (!organizationId) {
            return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
        }

        const bankAccounts = await prisma.bankAccount.findMany({
            where: { organizationId, isActive: true },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(bankAccounts)
    } catch (error) {
        console.error('Error fetching bank accounts:', error)
        return NextResponse.json({ error: 'Error fetching bank accounts' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { name, bankName, accountNumber, initialBalance = 0, description, organizationId } = body

        if (!name || !bankName || !accountNumber || !organizationId) {
            return NextResponse.json({
                error: 'name, bankName, accountNumber and organizationId are required'
            }, { status: 400 })
        }

        const bankAccount = await prisma.bankAccount.create({
            data: {
                name,
                bankName,
                accountNumber,
                currency: 'PESOS', // Los bancos también son bimonetarios, siempre PESOS por defecto
                description,
                organizationId
            }
        })

        // Crear balance inicial si se proporciona
        if (parseFloat(initialBalance.toString()) > 0) {
            await prisma.accountBalance.create({
                data: {
                    accountId: bankAccount.id,
                    accountType: 'BANK_ACCOUNT',
                    currency: 'PESOS',
                    balance: parseFloat(initialBalance.toString()),
                    organizationId
                }
            })
        }

        return NextResponse.json(bankAccount, { status: 201 })
    } catch (error) {
        console.error('Error creating bank account:', error)
        return NextResponse.json({ error: 'Error creating bank account' }, { status: 500 })
    }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { Decimal } from '@prisma/client/runtime/library'

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')

        const where = {
            organizationId: session.user.organizationId,
            ...(status && { status: status as any })
        }

        const [checks, total] = await Promise.all([
            prisma.check.findMany({
                where,
                include: {
                    cashBox: { select: { id: true, name: true } },
                    bankAccount: { select: { id: true, name: true } },
                    transactions: true
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.check.count({ where })
        ])

        return NextResponse.json({
            checks,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error('Error fetching checks:', error)
        return NextResponse.json({ error: 'Error fetching checks' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const data = await request.json()
        const { checkNumber, amount, currency, issuerName, issuerBank, issueDate, dueDate,
            cashBoxId, bankAccountId, receivedFrom, issuedTo, description, isReceived } = data

        // Validar datos
        if (!checkNumber || !amount || !currency) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Verificar unicidad del número de cheque
        const existingCheck = await prisma.check.findUnique({
            where: {
                checkNumber_organizationId: {
                    checkNumber,
                    organizationId: session.user.organizationId
                }
            }
        })
        if (existingCheck) {
            return NextResponse.json({ error: 'Check number already exists' }, { status: 400 })
        }

        const result = await prisma.$transaction(async (tx) => {
            // Crear el cheque
            const check = await tx.check.create({
                data: {
                    checkNumber,
                    amount: new Decimal(amount),
                    currency,
                    issuerName,
                    issuerBank,
                    issueDate: issueDate ? new Date(issueDate) : new Date(),
                    dueDate: new Date(dueDate),
                    status: isReceived ? 'PENDING' : 'ISSUED',
                    organizationId: session.user.organizationId,
                    cashBoxId: cashBoxId || null,
                    bankAccountId: bankAccountId || null,
                    receivedFrom: receivedFrom || null,
                    issuedTo: issuedTo || null,
                    description
                }
            })

            // NO crear transacción en tesorería hasta que se cobre el cheque
            // NO actualizar AccountBalance hasta que se cobre el cheque

            return { check }
        })

        return NextResponse.json(result, { status: 201 })
    } catch (error) {
        console.error('Error creating check:', error)
        return NextResponse.json({ error: 'Error creating check' }, { status: 500 })
    }
}
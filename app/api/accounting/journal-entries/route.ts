import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const organizationId = session.user.organizationId

        // Verificar que la organización tiene contabilidad habilitada
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: { enableAccounting: true }
        })

        if (!organization?.enableAccounting) {
            return NextResponse.json({ error: 'Contabilidad no habilitada' }, { status: 403 })
        }

        // Filtros
        const fromDate = searchParams.get('fromDate')
        const toDate = searchParams.get('toDate')
        const entryNumber = searchParams.get('entryNumber')
        const accountId = searchParams.get('accountId')
        const projectId = searchParams.get('projectId')
        const sourceType = searchParams.get('sourceType')
        const entryType = searchParams.get('entryType')
        const amountFrom = searchParams.get('amountFrom')
        const amountTo = searchParams.get('amountTo')
        const isAutomatic = searchParams.get('isAutomatic')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')

        const whereClause: any = { organizationId }

        if (fromDate && toDate) {
            whereClause.date = {
                gte: new Date(fromDate),
                lte: new Date(toDate)
            }
        }

        if (entryNumber) whereClause.entryNumber = entryNumber

        if (accountId) {
            whereClause.OR = [
                { debitAccountId: accountId },
                { creditAccountId: accountId }
            ]
        }

        if (projectId) whereClause.projectId = projectId
        if (sourceType) whereClause.sourceType = sourceType

        if (entryType === 'AUTOMATIC') {
            whereClause.isAutomatic = true
        } else if (entryType === 'MANUAL') {
            whereClause.isAutomatic = false
        }

        if (amountFrom || amountTo) {
            const amountFilter: any = {}
            if (amountFrom) {
                amountFilter.gte = parseFloat(amountFrom)
            }
            if (amountTo) {
                amountFilter.lte = parseFloat(amountTo)
            }
            whereClause.OR = whereClause.OR || []
            whereClause.OR.push(
                { debit: amountFilter },
                { credit: amountFilter }
            )
        }

        if (isAutomatic !== null) whereClause.isAutomatic = isAutomatic === 'true'

        const [entries, totalCount] = await Promise.all([
            prisma.journalEntry.findMany({
                where: whereClause,
                include: {
                    debitAccount: {
                        select: { code: true, name: true }
                    },
                    creditAccount: {
                        select: { code: true, name: true }
                    },
                    project: {
                        select: { id: true, name: true }
                    },
                    organization: {
                        select: { id: true, name: true }
                    }
                },
                orderBy: [
                    { date: 'desc' },
                    { entryNumber: 'desc' }
                ],
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.journalEntry.count({ where: whereClause })
        ])

        // Convertir Decimals a numbers para evitar que en el cliente lleguen como strings
        const serializedEntries = entries.map((e: any) => ({
            ...e,
            debit: typeof e.debit === 'string' ? parseFloat(e.debit) : (e.debit && typeof e.debit.toNumber === 'function' ? e.debit.toNumber() : Number(e.debit)),
            credit: typeof e.credit === 'string' ? parseFloat(e.credit) : (e.credit && typeof e.credit.toNumber === 'function' ? e.credit.toNumber() : Number(e.credit)),
            exchangeRate: typeof e.exchangeRate === 'string' ? parseFloat(e.exchangeRate) : (e.exchangeRate && typeof e.exchangeRate.toNumber === 'function' ? e.exchangeRate.toNumber() : Number(e.exchangeRate)),
        }))

        return NextResponse.json({
            entries: serializedEntries,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        })
    } catch (error) {
        console.error('Error fetching journal entries:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const organizationId = session.user.organizationId
        const userId = session.user.id

        // Verificar que la organización tiene contabilidad habilitada
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: { enableAccounting: true }
        })

        if (!organization?.enableAccounting) {
            return NextResponse.json({ error: 'Contabilidad no habilitada' }, { status: 403 })
        }

        const data = await request.json()
        const {
            description,
            entries, // Array de { debitAccountId?, creditAccountId?, amount, currency }
            date,
            sourceType,
            sourceId,
            isAutomatic = false
        } = data

        // Validar que está balanceado
        const totalDebits = entries
            .filter((e: any) => e.debitAccountId)
            .reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0)

        const totalCredits = entries
            .filter((e: any) => e.creditAccountId)
            .reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0)

        if (Math.abs(totalDebits - totalCredits) > 0.01) {
            return NextResponse.json({
                error: 'El asiento debe estar balanceado. Débitos: ' + totalDebits + ', Créditos: ' + totalCredits
            }, { status: 400 })
        }

        // Generar número correlativo
        const lastEntry = await prisma.journalEntry.findFirst({
            where: { organizationId },
            orderBy: { entryNumber: 'desc' }
        })

        const nextNumber = lastEntry
            ? String(parseInt(lastEntry.entryNumber) + 1).padStart(6, '0')
            : '000001'

        // Validar que todas las cuentas existen
        const accountIds = [
            ...entries.filter((e: any) => e.debitAccountId).map((e: any) => e.debitAccountId),
            ...entries.filter((e: any) => e.creditAccountId).map((e: any) => e.creditAccountId)
        ]

        const accounts = await prisma.account.findMany({
            where: {
                id: { in: accountIds },
                organizationId,
                isActive: true
            }
        })

        if (accounts.length !== accountIds.length) {
            return NextResponse.json({ error: 'Una o más cuentas no existen o están inactivas' }, { status: 400 })
        }

        // Crear asientos en transacción
        const journalEntries = await prisma.$transaction(async (tx) => {
            const createdEntries = []

            for (const entry of entries) {
                if (entry.debitAccountId) {
                    const journalEntry = await tx.journalEntry.create({
                        data: {
                            entryNumber: nextNumber,
                            date: date ? new Date(date) : new Date(),
                            description,
                            debit: new Decimal(entry.amount),
                            credit: new Decimal(0),
                            currency: entry.currency || 'PESOS',
                            debitAccountId: entry.debitAccountId,
                            organizationId,
                            sourceType,
                            sourceId,
                            isAutomatic,
                            createdBy: userId
                        },
                        include: {
                            debitAccount: { select: { code: true, name: true } },
                            creditAccount: { select: { code: true, name: true } }
                        }
                    })
                    createdEntries.push(journalEntry)
                }

                if (entry.creditAccountId) {
                    const journalEntry = await tx.journalEntry.create({
                        data: {
                            entryNumber: nextNumber,
                            date: date ? new Date(date) : new Date(),
                            description,
                            debit: new Decimal(0),
                            credit: new Decimal(entry.amount),
                            currency: entry.currency || 'PESOS',
                            creditAccountId: entry.creditAccountId,
                            organizationId,
                            sourceType,
                            sourceId,
                            isAutomatic,
                            createdBy: userId
                        },
                        include: {
                            debitAccount: { select: { code: true, name: true } },
                            creditAccount: { select: { code: true, name: true } }
                        }
                    })
                    createdEntries.push(journalEntry)
                }
            }

            return createdEntries
        })

        return NextResponse.json({
            entries: journalEntries,
            entryNumber: nextNumber,
            message: `Asiento ${nextNumber} creado exitosamente`
        }, { status: 201 })

    } catch (error) {
        console.error('Error creating journal entry:', error)
        return NextResponse.json({ error: 'Error creando asiento contable' }, { status: 500 })
    }
}
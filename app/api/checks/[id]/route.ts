import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { Decimal } from '@prisma/client/runtime/library'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const check = await prisma.check.findFirst({
            where: {
                id: params.id,
                organizationId: session.user.organizationId
            },
            include: {
                cashBox: { select: { id: true, name: true } },
                bankAccount: { select: { id: true, name: true } },
                transactions: true
            }
        })

        if (!check) {
            return NextResponse.json({ error: 'Check not found' }, { status: 404 })
        }

        return NextResponse.json(check)
    } catch (error) {
        console.error('Error fetching check:', error)
        return NextResponse.json({ error: 'Error fetching check' }, { status: 500 })
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const data = await request.json()
        const { status, notes } = data

        const check = await prisma.check.findFirst({
            where: {
                id: params.id,
                organizationId: session.user.organizationId
            }
        })

        if (!check) {
            return NextResponse.json({ error: 'Check not found' }, { status: 404 })
        }

        // Si cambia a CLEARED, registrar en tesorería según el tipo de cheque
        if (status === 'CLEARED') {
            await prisma.$transaction(async (tx) => {
                // Actualizar cheque
                await tx.check.update({
                    where: { id: params.id },
                    data: { status, notes, updatedAt: new Date() }
                })

                // Determinar el tipo de transacción basado en el estado anterior
                const wasIssued = check.status === 'ISSUED'
                const wasPending = check.status === 'PENDING'

                if (wasIssued || wasPending) {
                    // Crear transacción en tesorería
                    const transactionType = wasIssued ? 'EXPENSE' : 'INCOME' // Emitido = gasto, Recibido = ingreso
                    const category = wasIssued ? 'CHEQUE_PAGADO' : 'CHEQUE_COBRADO'
                    const description = wasIssued
                        ? `Pago de cheque emitido #${check.checkNumber} - ${check.issuerName}`
                        : `Cobro de cheque recibido #${check.checkNumber} - ${check.issuerName}`

                    const treasuryTransaction = await tx.transaction.create({
                        data: {
                            amount: check.amount.toNumber(),
                            currency: check.currency,
                            type: transactionType,
                            category: category,
                            description: description,
                            date: new Date(),
                            reference: `CHECK-${wasIssued ? 'PAY' : 'CLEAR'}-${check.id}`,
                            organizationId: session.user.organizationId,
                            cashBoxId: check.cashBoxId,
                            bankAccountId: check.bankAccountId,
                            checkId: check.id
                        }
                    })

                    // Actualizar AccountBalance
                    if (check.cashBoxId || check.bankAccountId) {
                        const accountId = check.cashBoxId || check.bankAccountId
                        if (!accountId) {
                            throw new Error('Account ID is required for balance update')
                        }
                        const accountType = check.cashBoxId ? 'CASH_BOX' : 'BANK_ACCOUNT'
                        const adjustment = wasIssued ? -check.amount.toNumber() : check.amount.toNumber() // Emitido = egreso, Recibido = ingreso

                        await tx.accountBalance.upsert({
                            where: {
                                accountId_accountType_currency: {
                                    accountId,
                                    accountType,
                                    currency: check.currency
                                }
                            },
                            update: {
                                balance: { increment: adjustment },
                                updatedAt: new Date()
                            },
                            create: {
                                accountId,
                                accountType,
                                currency: check.currency,
                                balance: adjustment,
                                organizationId: session.user.organizationId,
                                updatedAt: new Date()
                            }
                        })
                    }
                }
            })
        } else {
            // Actualización simple sin afectar tesorería
            await prisma.check.update({
                where: { id: params.id },
                data: { status, notes, updatedAt: new Date() }
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error updating check:', error)
        return NextResponse.json({ error: 'Error updating check' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const check = await prisma.check.findFirst({
            where: {
                id: params.id,
                organizationId: session.user.organizationId
            }
        })

        if (!check) {
            return NextResponse.json({ error: 'Check not found' }, { status: 404 })
        }

        await prisma.$transaction(async (tx) => {
            // Eliminar transacciones relacionadas en tesorería
            await tx.transaction.deleteMany({
                where: { checkId: params.id }
            })

            // Revertir AccountBalance si el cheque estaba cobrado
            if (check.status === 'CLEARED' && (check.cashBoxId || check.bankAccountId)) {
                const accountId = check.cashBoxId || check.bankAccountId
                if (!accountId) {
                    throw new Error('Account ID is required for balance update')
                }
                const accountType = check.cashBoxId ? 'CASH_BOX' : 'BANK_ACCOUNT'

                // Determinar el ajuste basado en si era emitido o recibido
                const wasIssued = check.status === 'CLEARED' // Si estaba cobrado, necesitamos revertir
                const adjustment = wasIssued ? check.amount.toNumber() : -check.amount.toNumber() // Revertir el ajuste anterior

                await tx.accountBalance.upsert({
                    where: {
                        accountId_accountType_currency: {
                            accountId,
                            accountType,
                            currency: check.currency
                        }
                    },
                    update: {
                        balance: { increment: adjustment },
                        updatedAt: new Date()
                    },
                    create: {
                        accountId,
                        accountType,
                        currency: check.currency,
                        balance: adjustment,
                        organizationId: session.user.organizationId,
                        updatedAt: new Date()
                    }
                })
            }

            // Eliminar cheque
            await tx.check.delete({
                where: { id: params.id }
            })
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting check:', error)
        return NextResponse.json({ error: 'Error deleting check' }, { status: 500 })
    }
}
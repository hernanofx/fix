import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Buscar cheques que vencen hoy y están pendientes
        const dueChecks = await prisma.check.findMany({
            where: {
                organizationId: session.user.organizationId,
                status: 'PENDING',
                dueDate: {
                    lte: today
                }
            }
        })

        const processedChecks = []

        for (const check of dueChecks) {
            await prisma.$transaction(async (tx) => {
                // Actualizar status del cheque a CLEARED
                await tx.check.update({
                    where: { id: check.id },
                    data: {
                        status: 'CLEARED',
                        updatedAt: new Date()
                    }
                })

                // Crear transacción en tesorería para el vencimiento del cheque
                await tx.transaction.create({
                    data: {
                        amount: check.amount.toNumber(),
                        currency: check.currency,
                        type: 'INCOME', // Vencimiento de cheque es ingreso
                        category: 'CHEQUE_VENCIDO',
                        description: `Vencimiento de cheque #${check.checkNumber} - ${check.issuerName}`,
                        date: new Date(),
                        reference: `CHECK-DUE-${check.id}`,
                        organizationId: session.user.organizationId,
                        cashBoxId: check.cashBoxId,
                        bankAccountId: check.bankAccountId,
                        checkId: check.id
                    }
                })

                // Actualizar AccountBalance si hay cuenta asociada
                if (check.cashBoxId || check.bankAccountId) {
                    const accountId = check.cashBoxId || check.bankAccountId!
                    const accountType = check.cashBoxId ? 'CASH_BOX' : 'BANK_ACCOUNT'

                    await tx.accountBalance.upsert({
                        where: {
                            accountId_accountType_currency: {
                                accountId,
                                accountType,
                                currency: check.currency
                            }
                        },
                        update: {
                            balance: { increment: check.amount.toNumber() },
                            updatedAt: new Date()
                        },
                        create: {
                            accountId,
                            accountType,
                            currency: check.currency,
                            balance: check.amount.toNumber(),
                            organizationId: session.user.organizationId,
                            updatedAt: new Date()
                        }
                    })
                }
            })

            processedChecks.push({
                id: check.id,
                checkNumber: check.checkNumber,
                amount: check.amount,
                currency: check.currency
            })
        }

        return NextResponse.json({
            success: true,
            message: `Procesados ${processedChecks.length} cheques vencidos`,
            processedChecks
        })
    } catch (error) {
        console.error('Error processing due checks:', error)
        return NextResponse.json({ error: 'Error processing due checks' }, { status: 500 })
    }
}
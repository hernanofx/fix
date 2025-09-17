import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BillStatus } from '@prisma/client'
import { AutoAccountingService } from '@/lib/accounting/auto-accounting'

// Función para parsear fechas en formato YYYY-MM-DD como zona horaria local
function parseLocalDate(dateString: string): Date {
    // Si la fecha viene en formato YYYY-MM-DD, parsearla manualmente
    // para evitar problemas de zona horaria UTC
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-').map(Number)
        // Crear fecha en zona horaria local (meses son 0-indexed en Date)
        return new Date(year, month - 1, day)
    }
    // Si no es formato YYYY-MM-DD, usar el constructor normal
    return new Date(dateString)
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const transaction = await prisma.transaction.findUnique({
            where: { id: params.id },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        })

        if (!transaction) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
        }

        // Mapear tipo para el frontend
        const mappedTransaction = {
            ...transaction,
            type: transaction.type === 'INCOME' ? 'Ingreso' : 'Egreso'
        }

        return NextResponse.json(mappedTransaction)
    } catch (error) {
        console.error('Error fetching transaction:', error)
        return NextResponse.json({ error: 'Failed to fetch transaction' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await request.json()

        // Validar que la moneda sea proporcionada y válida
        if (!body.currency) {
            return NextResponse.json(
                { error: 'Currency is required for transactions' },
                { status: 400 }
            )
        }

        const validCurrencies = ['PESOS', 'USD', 'EUR']
        if (!validCurrencies.includes(body.currency)) {
            return NextResponse.json(
                { error: 'Invalid currency. Must be PESOS, USD, or EUR' },
                { status: 400 }
            )
        }

        // Obtener la transacción original para revertir balances
        const originalTransaction = await prisma.transaction.findUnique({
            where: { id: params.id },
            include: {
                cashBox: true,
                bankAccount: true
            }
        })

        if (!originalTransaction) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
        }

        // Revertir el balance usando AccountBalance
        const originalAmount = originalTransaction.amount
        const adjustment = originalTransaction.type === 'INCOME' ? -originalAmount : originalAmount

        if (originalTransaction.cashBoxId) {
            await prisma.accountBalance.upsert({
                where: {
                    accountId_accountType_currency: {
                        accountId: originalTransaction.cashBoxId,
                        accountType: 'CASH_BOX',
                        currency: originalTransaction.currency
                    }
                },
                update: {
                    balance: { increment: adjustment },
                    updatedAt: new Date()
                },
                create: {
                    accountId: originalTransaction.cashBoxId,
                    accountType: 'CASH_BOX',
                    currency: originalTransaction.currency,
                    balance: adjustment,
                    organizationId: originalTransaction.organizationId,
                    updatedAt: new Date()
                }
            })
        } else if (originalTransaction.bankAccountId) {
            await prisma.accountBalance.upsert({
                where: {
                    accountId_accountType_currency: {
                        accountId: originalTransaction.bankAccountId,
                        accountType: 'BANK_ACCOUNT',
                        currency: originalTransaction.currency
                    }
                },
                update: {
                    balance: { increment: adjustment },
                    updatedAt: new Date()
                },
                create: {
                    accountId: originalTransaction.bankAccountId,
                    accountType: 'BANK_ACCOUNT',
                    currency: originalTransaction.currency,
                    balance: adjustment,
                    organizationId: originalTransaction.organizationId,
                    updatedAt: new Date()
                }
            })
        }

        const transaction = await prisma.transaction.update({
            where: { id: params.id },
            data: {
                amount: body.amount ? parseFloat(body.amount) : undefined,
                description: body.description,
                type: body.type === 'Ingreso' ? 'INCOME' : 'EXPENSE',
                category: body.category,
                currency: body.currency as any, // Cast to any to bypass TypeScript enum validation
                date: body.date ? parseLocalDate(body.date) : undefined,
                reference: body.reference,
                notes: body.notes,
                projectId: body.projectId || null,
                cashBoxId: body.cashBoxId || null,
                bankAccountId: body.bankAccountId || null
            },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                cashBox: {
                    select: {
                        id: true,
                        name: true,
                        currency: true
                    }
                },
                bankAccount: {
                    select: {
                        id: true,
                        name: true,
                        bankName: true,
                        currency: true
                    }
                }
            }
        })

        // Aplicar el nuevo balance usando AccountBalance
        const newAmount = body.amount ? parseFloat(body.amount) : originalAmount
        const newType = body.type === 'Ingreso' ? 'INCOME' : 'EXPENSE'
        const newAdjustment = newType === 'INCOME' ? newAmount : -newAmount

        if (body.cashBoxId) {
            await prisma.accountBalance.upsert({
                where: {
                    accountId_accountType_currency: {
                        accountId: body.cashBoxId,
                        accountType: 'CASH_BOX',
                        currency: body.currency
                    }
                },
                update: {
                    balance: { increment: newAdjustment },
                    updatedAt: new Date()
                },
                create: {
                    accountId: body.cashBoxId,
                    accountType: 'CASH_BOX',
                    currency: body.currency,
                    balance: newAdjustment,
                    organizationId: originalTransaction.organizationId,
                    updatedAt: new Date()
                }
            })
        } else if (body.bankAccountId) {
            await prisma.accountBalance.upsert({
                where: {
                    accountId_accountType_currency: {
                        accountId: body.bankAccountId,
                        accountType: 'BANK_ACCOUNT',
                        currency: body.currency
                    }
                },
                update: {
                    balance: { increment: newAdjustment },
                    updatedAt: new Date()
                },
                create: {
                    accountId: body.bankAccountId,
                    accountType: 'BANK_ACCOUNT',
                    currency: body.currency,
                    balance: newAdjustment,
                    organizationId: originalTransaction.organizationId,
                    updatedAt: new Date()
                }
            })
        }

        // Mapear tipo para el frontend
        const mappedTransaction = {
            ...transaction,
            type: transaction.type === 'INCOME' ? 'Ingreso' : 'Egreso'
        }

        return NextResponse.json(mappedTransaction)
    } catch (error) {
        console.error('Error updating transaction:', error)
        return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Primero obtener la transacción para saber si está relacionada con una factura
        const transaction = await prisma.transaction.findUnique({
            where: { id: params.id },
            include: {
                cashBox: true,
                bankAccount: true
            }
        })

        if (!transaction) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
        }

        console.log('🔥 TREASURY DELETE - Starting deletion of transaction:', {
            transactionId: params.id,
            reference: transaction.reference,
            amount: transaction.amount,
            description: transaction.description,
            type: transaction.type,
            cashBoxId: transaction.cashBoxId,
            bankAccountId: transaction.bankAccountId
        })

        // Si es una transacción relacionada con una factura (ingreso o egreso), buscar y eliminar el pago correspondiente
        if ((transaction.type === 'INCOME' || transaction.type === 'EXPENSE') &&
            (transaction.reference?.startsWith('BILL-PAY-') ||
                transaction.description?.includes('factura') ||
                transaction.description?.includes('Factura'))) {

            // Extraer el ID del pago del reference si existe
            let paymentId = null
            if (transaction.reference?.startsWith('BILL-PAY-')) {
                paymentId = transaction.reference.replace('BILL-PAY-', '')
            } else {
                // Buscar el pago correspondiente por descripción, monto y fecha
                const relatedPayment = await prisma.billPayment.findFirst({
                    where: {
                        organizationId: transaction.organizationId,
                        amount: transaction.amount,
                        paymentDate: {
                            gte: new Date(transaction.date.getTime() - 60000), // 1 minuto de tolerancia
                            lte: new Date(transaction.date.getTime() + 60000)
                        }
                    },
                    include: {
                        bill: true
                    }
                })

                if (relatedPayment) {
                    paymentId = relatedPayment.id
                }
            }

            if (paymentId) {
                // Obtener el pago antes de eliminarlo
                const payment = await prisma.billPayment.findUnique({
                    where: { id: paymentId },
                    include: {
                        bill: {
                            include: {
                                payments: true
                            }
                        }
                    }
                })

                if (payment) {
                    const bill = payment.bill

                    console.log('🗑️ Eliminando pago de factura desde tesorería:', {
                        paymentId: payment.id,
                        billId: bill.id,
                        billNumber: bill.number,
                        amount: payment.amount.toNumber()
                    })

                    // Eliminar el pago
                    await prisma.billPayment.delete({
                        where: { id: paymentId }
                    })

                    // Recalcular el estado de la factura basado en los pagos restantes
                    const remainingPayments = bill.payments.filter((p: any) => p.id !== paymentId)
                    const totalPayments = remainingPayments.reduce((sum: number, p: any) => sum + p.amount.toNumber(), 0)

                    // Determinar el estado correcto de la factura
                    let newStatus: BillStatus = BillStatus.PENDING
                    let newPaidDate = null

                    if (totalPayments >= bill.total.toNumber()) {
                        // Factura completamente pagada
                        newStatus = BillStatus.PAID
                        // Mantener la fecha de pago más reciente de los pagos restantes
                        const latestPayment = remainingPayments
                            .filter((p: any) => p.paymentDate)
                            .sort((a: any, b: any) => new Date(b.paymentDate!).getTime() - new Date(a.paymentDate!).getTime())[0]
                        newPaidDate = latestPayment?.paymentDate || null
                    } else if (totalPayments > 0) {
                        // Pago parcial - hay pagos pero no cubren el total
                        newStatus = BillStatus.PARTIAL
                        newPaidDate = null
                    }

                    await prisma.bill.update({
                        where: { id: bill.id },
                        data: {
                            status: newStatus,
                            paidDate: newPaidDate
                        }
                    })

                    console.log('📊 Estado de factura actualizado:', {
                        billId: bill.id,
                        oldStatus: bill.status,
                        newStatus: newStatus,
                        totalPayments: totalPayments,
                        billTotal: bill.total.toNumber()
                    })
                }
            }

            // 🔧 CORRECCIÓN: Revertir el balance usando AccountBalance para transacciones de facturas
            const amount = transaction.amount
            const adjustment = transaction.type === 'INCOME' ? -amount : amount

            if (transaction.cashBoxId) {
                await prisma.accountBalance.upsert({
                    where: {
                        accountId_accountType_currency: {
                            accountId: transaction.cashBoxId,
                            accountType: 'CASH_BOX',
                            currency: transaction.currency
                        }
                    },
                    update: {
                        balance: { increment: adjustment },
                        updatedAt: new Date()
                    },
                    create: {
                        accountId: transaction.cashBoxId,
                        accountType: 'CASH_BOX',
                        currency: transaction.currency,
                        balance: adjustment,
                        organizationId: transaction.organizationId,
                        updatedAt: new Date()
                    }
                })
            } else if (transaction.bankAccountId) {
                await prisma.accountBalance.upsert({
                    where: {
                        accountId_accountType_currency: {
                            accountId: transaction.bankAccountId,
                            accountType: 'BANK_ACCOUNT',
                            currency: transaction.currency
                        }
                    },
                    update: {
                        balance: { increment: adjustment },
                        updatedAt: new Date()
                    },
                    create: {
                        accountId: transaction.bankAccountId,
                        accountType: 'BANK_ACCOUNT',
                        currency: transaction.currency,
                        balance: adjustment,
                        organizationId: transaction.organizationId,
                        updatedAt: new Date()
                    }
                })
            }
        }
        // Si es una transacción relacionada con una cobranza (collection), buscar y eliminar el pago correspondiente
        else if (transaction.type === 'INCOME' &&
            transaction.description?.startsWith('Cobranza:') &&
            transaction.reference?.startsWith('PAY-')) {

            // Extraer el ID del pago del reference (PAY-{paymentId})
            const paymentId = transaction.reference.replace('PAY-', '')

            // Buscar y eliminar el pago correspondiente
            const relatedPayment = await prisma.billPayment.findUnique({
                where: { id: paymentId }
            })

            if (relatedPayment) {
                // Eliminar el pago
                await prisma.billPayment.delete({
                    where: { id: paymentId }
                })

                // Revertir el balance usando AccountBalance
                const amount = transaction.amount
                const adjustment = -amount // Siempre restar para cobranza

                if (transaction.cashBoxId) {
                    await prisma.accountBalance.upsert({
                        where: {
                            accountId_accountType_currency: {
                                accountId: transaction.cashBoxId,
                                accountType: 'CASH_BOX',
                                currency: transaction.currency
                            }
                        },
                        update: {
                            balance: { increment: adjustment },
                            updatedAt: new Date()
                        },
                        create: {
                            accountId: transaction.cashBoxId,
                            accountType: 'CASH_BOX',
                            currency: transaction.currency,
                            balance: adjustment,
                            organizationId: transaction.organizationId,
                            updatedAt: new Date()
                        }
                    })
                } else if (transaction.bankAccountId) {
                    await prisma.accountBalance.upsert({
                        where: {
                            accountId_accountType_currency: {
                                accountId: transaction.bankAccountId,
                                accountType: 'BANK_ACCOUNT',
                                currency: transaction.currency
                            }
                        },
                        update: {
                            balance: { increment: adjustment },
                            updatedAt: new Date()
                        },
                        create: {
                            accountId: transaction.bankAccountId,
                            accountType: 'BANK_ACCOUNT',
                            currency: transaction.currency,
                            balance: adjustment,
                            organizationId: transaction.organizationId,
                            updatedAt: new Date()
                        }
                    })
                }
            }
        } else {
            // Para otras transacciones, solo revertir el balance usando AccountBalance
            const amount = transaction.amount
            const adjustment = transaction.type === 'INCOME' ? -amount : amount

            if (transaction.cashBoxId) {
                await prisma.accountBalance.upsert({
                    where: {
                        accountId_accountType_currency: {
                            accountId: transaction.cashBoxId,
                            accountType: 'CASH_BOX',
                            currency: transaction.currency
                        }
                    },
                    update: {
                        balance: { increment: adjustment },
                        updatedAt: new Date()
                    },
                    create: {
                        accountId: transaction.cashBoxId,
                        accountType: 'CASH_BOX',
                        currency: transaction.currency,
                        balance: adjustment,
                        organizationId: transaction.organizationId,
                        updatedAt: new Date()
                    }
                })
            } else if (transaction.bankAccountId) {
                await prisma.accountBalance.upsert({
                    where: {
                        accountId_accountType_currency: {
                            accountId: transaction.bankAccountId,
                            accountType: 'BANK_ACCOUNT',
                            currency: transaction.currency
                        }
                    },
                    update: {
                        balance: { increment: adjustment },
                        updatedAt: new Date()
                    },
                    create: {
                        accountId: transaction.bankAccountId,
                        accountType: 'BANK_ACCOUNT',
                        currency: transaction.currency,
                        balance: adjustment,
                        organizationId: transaction.organizationId,
                        updatedAt: new Date()
                    }
                })
            }
        }

        // Eliminar asientos contables automáticos asociados
        await AutoAccountingService.deleteAutomaticEntries('TRANSACTION', params.id)

        // Finalmente eliminar la transacción
        await prisma.transaction.delete({
            where: { id: params.id }
        })

        console.log('✅ Transacción eliminada de tesorería:', {
            transactionId: params.id,
            reference: transaction.reference,
            amount: transaction.amount,
            description: transaction.description
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting transaction:', error)
        return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
    }
}

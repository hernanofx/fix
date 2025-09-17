import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BillStatus, BillType } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string; paymentId: string } }
) {
    try {
        const { id: billId, paymentId } = params

        // Verificar que el pago existe
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

        if (!payment || payment.billId !== billId) {
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
        }

        const bill = payment.bill
        const isIncome = bill.type === BillType.CLIENT

        // Los balances ahora se calculan dinámicamente desde transacciones
        // Ya no necesitamos revertir balances manualmente
        console.log(`💳 Deleting payment: ${payment.amount} ${payment.currency} from ${isIncome ? 'client' : 'provider'} bill`)

        // Eliminar transacción relacionada en tesorería y revertir balances
        const transaction = await prisma.transaction.findFirst({
            where: {
                reference: `BILL-PAY-${paymentId}`,
                organizationId: bill.organizationId
            }
        })

        if (transaction) {
            // Revertir balance usando AccountBalance (opuesto de la operación original)
            const amount = new Decimal(transaction.amount).toNumber()
            const adjustment = isIncome ? -amount : amount // Si era ingreso, restar; si era egreso, sumar

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
                        organizationId: bill.organizationId,
                        updatedAt: new Date()
                    }
                })
            }

            if (transaction.bankAccountId) {
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
                        organizationId: bill.organizationId,
                        updatedAt: new Date()
                    }
                })
            }

            // Eliminar la transacción
            await prisma.transaction.delete({
                where: { id: transaction.id }
            })
        }

        // Eliminar el pago
        await prisma.billPayment.delete({
            where: { id: paymentId }
        })

        // Recalcular estado de la factura
        const remainingPayments = bill.payments.filter(p => p.id !== paymentId)
        const totalPaid = remainingPayments.reduce((sum, p) => sum.add(p.amount), new Decimal(0))

        let newStatus: BillStatus = BillStatus.PENDING
        if (totalPaid.gt(0) && totalPaid.lt(bill.total)) {
            newStatus = BillStatus.PARTIAL
        } else if (totalPaid.gte(bill.total)) {
            newStatus = BillStatus.PAID
        }

        await prisma.bill.update({
            where: { id: billId },
            data: {
                status: newStatus,
                paidDate: newStatus === BillStatus.PAID ? bill.paidDate : null
            }
        })

        return NextResponse.json({ message: 'Payment deleted successfully' })

    } catch (error) {
        console.error('Error deleting payment:', error)
        return NextResponse.json({ error: 'Error deleting payment' }, { status: 500 })
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string; paymentId: string } }
) {
    try {
        const { id: billId, paymentId } = params
        const body = await request.json()

        const {
            amount,
            method,
            currency,
            paymentDate,
            reference,
            notes,
            cashBoxId,
            bankAccountId
        } = body

        // Verificar que el pago existe
        const existingPayment = await prisma.billPayment.findUnique({
            where: { id: paymentId },
            include: {
                bill: {
                    include: {
                        payments: true
                    }
                }
            }
        })

        if (!existingPayment || existingPayment.billId !== billId) {
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
        }

        const bill = existingPayment.bill
        const isIncome = bill.type === BillType.CLIENT

        // Si cambia el monto, validar que no exceda el total
        if (amount !== undefined) {
            const otherPayments = bill.payments.filter(p => p.id !== paymentId)
            const otherPaymentsTotal = otherPayments.reduce((sum, p) => sum.add(p.amount), new Decimal(0))
            const newPaymentAmount = new Decimal(amount)
            const newTotalPaid = otherPaymentsTotal.add(newPaymentAmount)

            if (newTotalPaid.gt(bill.total)) {
                return NextResponse.json({
                    error: `New payment amount would exceed bill total`
                }, { status: 400 })
            }
        }

        // Manejar cambios en balances usando AccountBalance
        const oldAmount = existingPayment.amount.toNumber()
        const newAmountValue = amount !== undefined ? new Decimal(amount).toNumber() : oldAmount
        const oldCashBoxId = existingPayment.cashBoxId
        const oldBankAccountId = existingPayment.bankAccountId
        const oldCurrency = existingPayment.currency
        const newCurrency = currency !== undefined ? currency : oldCurrency

        // Si cambió el monto, la cuenta o la moneda, necesitamos ajustar balances
        const amountChanged = amount !== undefined && newAmountValue !== oldAmount
        const cashBoxChanged = cashBoxId !== undefined && cashBoxId !== oldCashBoxId
        const bankAccountChanged = bankAccountId !== undefined && bankAccountId !== oldBankAccountId
        const currencyChanged = currency !== undefined && newCurrency !== oldCurrency

        if (amountChanged || cashBoxChanged || bankAccountChanged || currencyChanged) {
            // Obtener la transacción actual para determinar el estado anterior
            const currentTransaction = await prisma.transaction.findFirst({
                where: {
                    reference: `BILL-PAY-${paymentId}`,
                    organizationId: bill.organizationId
                }
            })

            if (currentTransaction) {
                // Revertir el balance anterior (opuesto de la operación original)
                const oldAdjustment = isIncome ? -currentTransaction.amount : currentTransaction.amount

                if (currentTransaction.cashBoxId) {
                    await prisma.accountBalance.upsert({
                        where: {
                            accountId_accountType_currency: {
                                accountId: currentTransaction.cashBoxId,
                                accountType: 'CASH_BOX',
                                currency: currentTransaction.currency
                            }
                        },
                        update: {
                            balance: { increment: oldAdjustment },
                            updatedAt: new Date()
                        },
                        create: {
                            accountId: currentTransaction.cashBoxId,
                            accountType: 'CASH_BOX',
                            currency: currentTransaction.currency,
                            balance: oldAdjustment,
                            organizationId: bill.organizationId,
                            updatedAt: new Date()
                        }
                    })
                }

                if (currentTransaction.bankAccountId) {
                    await prisma.accountBalance.upsert({
                        where: {
                            accountId_accountType_currency: {
                                accountId: currentTransaction.bankAccountId,
                                accountType: 'BANK_ACCOUNT',
                                currency: currentTransaction.currency
                            }
                        },
                        update: {
                            balance: { increment: oldAdjustment },
                            updatedAt: new Date()
                        },
                        create: {
                            accountId: currentTransaction.bankAccountId,
                            accountType: 'BANK_ACCOUNT',
                            currency: currentTransaction.currency,
                            balance: oldAdjustment,
                            organizationId: bill.organizationId,
                            updatedAt: new Date()
                        }
                    })
                }
            }
        }

        // Actualizar el pago
        const updateData: any = {}
        if (amount !== undefined) updateData.amount = new Decimal(amount)
        if (method !== undefined) updateData.method = method
        if (currency !== undefined) updateData.currency = currency
        if (paymentDate !== undefined) updateData.paymentDate = new Date(paymentDate)
        if (reference !== undefined) updateData.reference = reference
        if (notes !== undefined) updateData.notes = notes
        if (cashBoxId !== undefined) updateData.cashBoxId = cashBoxId
        if (bankAccountId !== undefined) updateData.bankAccountId = bankAccountId

        const updatedPayment = await prisma.billPayment.update({
            where: { id: paymentId },
            data: updateData
        })

        // Actualizar transacción relacionada
        const newAmount = amount !== undefined ? new Decimal(amount) : existingPayment.amount
        const newCashBoxId = cashBoxId !== undefined ? cashBoxId : existingPayment.cashBoxId
        const newBankAccountId = bankAccountId !== undefined ? bankAccountId : existingPayment.bankAccountId

        await prisma.transaction.updateMany({
            where: {
                reference: `BILL-PAY-${paymentId}`,
                organizationId: bill.organizationId
            },
            data: {
                amount: newAmount.toNumber(),
                date: paymentDate ? new Date(paymentDate) : existingPayment.paymentDate,
                notes: notes !== undefined ? notes : existingPayment.notes,
                cashBoxId: newCashBoxId,
                bankAccountId: newBankAccountId,
                currency: currency !== undefined ? currency : existingPayment.currency
            }
        })

        // Aplicar el nuevo balance después de actualizar la transacción
        if (amountChanged || cashBoxChanged || bankAccountChanged || currencyChanged) {
            // Aplicar el nuevo balance (considerando si es ingreso o egreso)
            const newAdjustment = isIncome ? newAmountValue : -newAmountValue

            if (newCashBoxId) {
                await prisma.accountBalance.upsert({
                    where: {
                        accountId_accountType_currency: {
                            accountId: newCashBoxId,
                            accountType: 'CASH_BOX',
                            currency: newCurrency
                        }
                    },
                    update: {
                        balance: { increment: newAdjustment },
                        updatedAt: new Date()
                    },
                    create: {
                        accountId: newCashBoxId,
                        accountType: 'CASH_BOX',
                        currency: newCurrency,
                        balance: newAdjustment,
                        organizationId: bill.organizationId,
                        updatedAt: new Date()
                    }
                })
            }

            if (newBankAccountId) {
                await prisma.accountBalance.upsert({
                    where: {
                        accountId_accountType_currency: {
                            accountId: newBankAccountId,
                            accountType: 'BANK_ACCOUNT',
                            currency: newCurrency
                        }
                    },
                    update: {
                        balance: { increment: newAdjustment },
                        updatedAt: new Date()
                    },
                    create: {
                        accountId: newBankAccountId,
                        accountType: 'BANK_ACCOUNT',
                        currency: newCurrency,
                        balance: newAdjustment,
                        organizationId: bill.organizationId,
                        updatedAt: new Date()
                    }
                })
            }
        }

        // Recalcular estado de la factura
        const allPayments = bill.payments.map(p =>
            p.id === paymentId ? { ...p, amount: newAmount } : p
        )
        const totalPaid = allPayments.reduce((sum, p) => sum.add(p.amount), new Decimal(0))

        let newStatus: BillStatus = BillStatus.PENDING
        if (totalPaid.gt(0) && totalPaid.lt(bill.total)) {
            newStatus = BillStatus.PARTIAL
        } else if (totalPaid.gte(bill.total)) {
            newStatus = BillStatus.PAID
        }

        await prisma.bill.update({
            where: { id: billId },
            data: {
                status: newStatus,
                paidDate: newStatus === BillStatus.PAID ? (paymentDate ? new Date(paymentDate) : new Date()) : null
            }
        })

        // Buscar el pago actualizado con relaciones
        const payment = await prisma.billPayment.findUnique({
            where: { id: paymentId },
            include: {
                cashBox: { select: { id: true, name: true, currency: true } },
                bankAccount: { select: { id: true, name: true, currency: true } },
                bill: {
                    select: {
                        id: true,
                        number: true,
                        total: true,
                        status: true
                    }
                }
            }
        })

        return NextResponse.json({
            payment,
            message: 'Payment updated successfully'
        })

    } catch (error) {
        console.error('Error updating payment:', error)
        return NextResponse.json({ error: 'Error updating payment' }, { status: 500 })
    }
}

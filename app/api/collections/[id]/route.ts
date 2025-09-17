import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'
import { AutoAccountingService } from '@/lib/accounting/auto-accounting'

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params
        const payment = await prisma.payment.findUnique({
            where: { id },
            include: {
                client: {
                    select: { name: true }
                },
                project: {
                    select: { name: true }
                },
                rubro: {
                    select: { name: true }
                }
            }
        })
        if (!payment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json(payment)
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
    }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params
        const body = await request.json()

        // Obtener el pago actual antes de cualquier cambio
        const currentPayment = await prisma.payment.findUnique({
            where: { id },
            select: {
                status: true,
                amount: true,
                cashBoxId: true,
                bankAccountId: true,
                paidDate: true,
                organizationId: true,
                description: true,
                currency: true,
                projectId: true,
                notes: true
            }
        })

        if (!currentPayment) {
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
        }

        // Manejar cambios en los balances
        const newStatus = body.status || currentPayment.status
        const newCashBoxId = body.cashBoxId !== undefined ? body.cashBoxId : currentPayment.cashBoxId
        const newBankAccountId = body.bankAccountId !== undefined ? body.bankAccountId : currentPayment.bankAccountId
        const newAmount = body.amount ? parseFloat(body.amount) : currentPayment.amount
        const wasPaid = currentPayment.status === 'PAID' && currentPayment.paidDate
        const isNowPaid = newStatus === 'PAID' && (body.paidDate || currentPayment.paidDate)

        // Validar que se seleccione una cuenta si el status es PAID
        if (newStatus === 'PAID' && !newCashBoxId && !newBankAccountId) {
            return NextResponse.json({ error: 'Para marcar una cobranza como pagada, debes seleccionar una caja o cuenta bancaria donde se depositó el pago' }, { status: 400 })
        }

        const updated = await prisma.payment.update({
            where: { id },
            data: {
                amount: body.amount ? parseFloat(body.amount) : undefined,
                description: body.description,
                method: body.method,
                status: body.status,
                dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
                paidDate: body.paidDate ? new Date(body.paidDate) : undefined,
                reference: body.reference,
                notes: body.notes,
                clientId: body.clientId || null,
                projectId: body.projectId || null,
                rubroId: body.rubroId || null,
                cashBoxId: body.cashBoxId || null,
                bankAccountId: body.bankAccountId || null,
                currency: body.currency,
                installmentNumber: body.installmentNumber || null,
            },
            include: {
                client: {
                    select: { name: true }
                },
                project: {
                    select: { name: true }
                },
                rubro: {
                    select: { name: true }
                },
                cashBox: {
                    select: { id: true, name: true, currency: true }
                },
                bankAccount: {
                    select: { id: true, name: true, currency: true, bankName: true }
                }
            }
        })

        // Revertir cambios anteriores si el pago estaba pagado
        if (wasPaid) {
            // Eliminar transacción anterior de treasury si existía
            const existingTransaction = await prisma.transaction.findFirst({
                where: {
                    OR: [
                        { reference: `PAY-${id}` },
                        { reference: `PAY-${id.slice(-8)}` }
                    ],
                    organizationId: currentPayment.organizationId
                }
            })
            if (existingTransaction) {
                await prisma.transaction.delete({
                    where: { id: existingTransaction.id }
                })
            }

            // Revertir balances usando AccountBalance
            const currency = currentPayment.currency || 'PESOS'
            const amount = new Decimal(currentPayment.amount).toNumber()
            const adjustment = -amount // Decrementar al eliminar ingreso (cobranza)

            if (currentPayment.cashBoxId) {
                await prisma.accountBalance.upsert({
                    where: {
                        accountId_accountType_currency: {
                            accountId: currentPayment.cashBoxId,
                            accountType: 'CASH_BOX',
                            currency: currency
                        }
                    },
                    update: {
                        balance: { increment: adjustment },
                        updatedAt: new Date()
                    },
                    create: {
                        accountId: currentPayment.cashBoxId,
                        accountType: 'CASH_BOX',
                        currency: currency,
                        balance: adjustment,
                        organizationId: currentPayment.organizationId,
                        updatedAt: new Date()
                    }
                })
            } else if (currentPayment.bankAccountId) {
                await prisma.accountBalance.upsert({
                    where: {
                        accountId_accountType_currency: {
                            accountId: currentPayment.bankAccountId,
                            accountType: 'BANK_ACCOUNT',
                            currency: currency
                        }
                    },
                    update: {
                        balance: { increment: adjustment },
                        updatedAt: new Date()
                    },
                    create: {
                        accountId: currentPayment.bankAccountId,
                        accountType: 'BANK_ACCOUNT',
                        currency: currency,
                        balance: adjustment,
                        organizationId: currentPayment.organizationId,
                        updatedAt: new Date()
                    }
                })
            }
        }

        // Aplicar nuevos cambios si ahora está pagado
        if (isNowPaid && !wasPaid) {
            // Crear nueva transacción en treasury
            const transactionDescription = `Cobranza: ${body.description || updated.description || 'Sin descripción'}`
            const transactionReference = `PAY-${id}`

            await prisma.transaction.create({
                data: {
                    amount: newAmount,
                    description: transactionDescription,
                    type: 'INCOME',
                    category: 'Cobranza',
                    currency: (body.currency || updated.currency) as any,
                    date: body.paidDate ? new Date(body.paidDate) : (updated.paidDate || new Date()),
                    reference: transactionReference,
                    notes: body.notes || updated.notes || null,
                    organizationId: currentPayment.organizationId,
                    projectId: body.projectId || updated.projectId || null,
                    cashBoxId: newCashBoxId || null,
                    bankAccountId: newBankAccountId || null
                }
            })

            // Actualizar balances usando AccountBalance
            const currency = (body.currency || updated.currency) as any
            const amount = new Decimal(newAmount).toNumber()

            if (newCashBoxId) {
                await prisma.accountBalance.upsert({
                    where: {
                        accountId_accountType_currency: {
                            accountId: newCashBoxId,
                            accountType: 'CASH_BOX',
                            currency: currency
                        }
                    },
                    update: {
                        balance: { increment: amount },
                        updatedAt: new Date()
                    },
                    create: {
                        accountId: newCashBoxId,
                        accountType: 'CASH_BOX',
                        currency: currency,
                        balance: amount,
                        organizationId: currentPayment.organizationId,
                        updatedAt: new Date()
                    }
                })
            } else if (newBankAccountId) {
                await prisma.accountBalance.upsert({
                    where: {
                        accountId_accountType_currency: {
                            accountId: newBankAccountId,
                            accountType: 'BANK_ACCOUNT',
                            currency: currency
                        }
                    },
                    update: {
                        balance: { increment: amount },
                        updatedAt: new Date()
                    },
                    create: {
                        accountId: newBankAccountId,
                        accountType: 'BANK_ACCOUNT',
                        currency: currency,
                        balance: amount,
                        organizationId: currentPayment.organizationId,
                        updatedAt: new Date()
                    }
                })
            }
        } else if (isNowPaid && wasPaid) {
            // Si ya estaba pagado pero cambió la cuenta o el monto
            if (newCashBoxId && newCashBoxId !== currentPayment.cashBoxId) {
                // Eliminar transacción anterior y crear nueva
                const existingTransaction = await prisma.transaction.findFirst({
                    where: {
                        OR: [
                            { reference: `PAY-${id}` },
                            { reference: `PAY-${id.slice(-8)}` }
                        ],
                        organizationId: currentPayment.organizationId
                    }
                })
                if (existingTransaction) {
                    await prisma.transaction.delete({
                        where: { id: existingTransaction.id }
                    })
                }

                const transactionDescription = `Cobranza: ${body.description || updated.description || 'Sin descripción'}`
                await prisma.transaction.create({
                    data: {
                        amount: newAmount,
                        description: transactionDescription,
                        type: 'INCOME',
                        category: 'Cobranza',
                        currency: (body.currency || updated.currency) as any,
                        date: body.paidDate ? new Date(body.paidDate) : (updated.paidDate || new Date()),
                        reference: `PAY-${id}`,
                        notes: body.notes || updated.notes || null,
                        organizationId: currentPayment.organizationId,
                        projectId: body.projectId || updated.projectId || null,
                        cashBoxId: newCashBoxId || null,
                        bankAccountId: null
                    }
                })

                await prisma.accountBalance.upsert({
                    where: {
                        accountId_accountType_currency: {
                            accountId: newCashBoxId,
                            accountType: 'CASH_BOX',
                            currency: (body.currency || updated.currency) as any
                        }
                    },
                    update: {
                        balance: { increment: newAmount },
                        updatedAt: new Date()
                    },
                    create: {
                        accountId: newCashBoxId,
                        accountType: 'CASH_BOX',
                        currency: (body.currency || updated.currency) as any,
                        balance: newAmount,
                        organizationId: currentPayment.organizationId,
                        updatedAt: new Date()
                    }
                })
            } else if (newBankAccountId && newBankAccountId !== currentPayment.bankAccountId) {
                // Eliminar transacción anterior y crear nueva
                const existingTransaction = await prisma.transaction.findFirst({
                    where: {
                        OR: [
                            { reference: `PAY-${id}` },
                            { reference: `PAY-${id.slice(-8)}` }
                        ],
                        organizationId: currentPayment.organizationId
                    }
                })
                if (existingTransaction) {
                    await prisma.transaction.delete({
                        where: { id: existingTransaction.id }
                    })
                }

                const transactionDescription = `Cobranza: ${body.description || updated.description || 'Sin descripción'}`
                await prisma.transaction.create({
                    data: {
                        amount: newAmount,
                        description: transactionDescription,
                        type: 'INCOME',
                        category: 'Cobranza',
                        currency: (body.currency || updated.currency) as any,
                        date: body.paidDate ? new Date(body.paidDate) : (updated.paidDate || new Date()),
                        reference: `PAY-${id}`,
                        notes: body.notes || updated.notes || null,
                        organizationId: currentPayment.organizationId,
                        projectId: body.projectId || updated.projectId || null,
                        cashBoxId: null,
                        bankAccountId: newBankAccountId || null
                    }
                })

                await prisma.accountBalance.upsert({
                    where: {
                        accountId_accountType_currency: {
                            accountId: newBankAccountId,
                            accountType: 'BANK_ACCOUNT',
                            currency: (body.currency || updated.currency) as any
                        }
                    },
                    update: {
                        balance: { increment: newAmount },
                        updatedAt: new Date()
                    },
                    create: {
                        accountId: newBankAccountId,
                        accountType: 'BANK_ACCOUNT',
                        currency: (body.currency || updated.currency) as any,
                        balance: newAmount,
                        organizationId: currentPayment.organizationId,
                        updatedAt: new Date()
                    }
                })
            } else if (newAmount !== currentPayment.amount) {
                // Solo cambió el monto, actualizar la transacción existente
                const existingTransaction = await prisma.transaction.findFirst({
                    where: {
                        OR: [
                            { reference: `PAY-${id}` },
                            { reference: `PAY-${id.slice(-8)}` }
                        ],
                        organizationId: currentPayment.organizationId
                    }
                })
                if (existingTransaction) {
                    await prisma.transaction.update({
                        where: { id: existingTransaction.id },
                        data: {
                            amount: newAmount,
                            description: `Cobranza: ${body.description || updated.description || 'Sin descripción'}`
                        }
                    })
                }

                // Solo cambió el monto, actualizar la diferencia usando AccountBalance
                const difference = new Decimal(newAmount).minus(new Decimal(currentPayment.amount)).toNumber()
                const currency = (body.currency || updated.currency) as any

                if (newCashBoxId) {
                    await prisma.accountBalance.upsert({
                        where: {
                            accountId_accountType_currency: {
                                accountId: newCashBoxId,
                                accountType: 'CASH_BOX',
                                currency: currency
                            }
                        },
                        update: {
                            balance: { increment: difference },
                            updatedAt: new Date()
                        },
                        create: {
                            accountId: newCashBoxId,
                            accountType: 'CASH_BOX',
                            currency: currency,
                            balance: difference,
                            organizationId: currentPayment.organizationId,
                            updatedAt: new Date()
                        }
                    })
                } else if (newBankAccountId) {
                    await prisma.accountBalance.upsert({
                        where: {
                            accountId_accountType_currency: {
                                accountId: newBankAccountId,
                                accountType: 'BANK_ACCOUNT',
                                currency: currency
                            }
                        },
                        update: {
                            balance: { increment: difference },
                            updatedAt: new Date()
                        },
                        create: {
                            accountId: newBankAccountId,
                            accountType: 'BANK_ACCOUNT',
                            currency: currency,
                            balance: difference,
                            organizationId: currentPayment.organizationId,
                            updatedAt: new Date()
                        }
                    })
                }
            }
        }

        return NextResponse.json(updated)
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params

        // Obtener el pago antes de eliminarlo para revertir balances y transacciones
        const payment = await prisma.payment.findUnique({
            where: { id },
            select: {
                status: true,
                amount: true,
                cashBoxId: true,
                bankAccountId: true,
                paidDate: true,
                organizationId: true
            }
        })

        if (!payment) {
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
        }

        // Eliminar transacción de treasury si existía
        if (payment.status === 'PAID' && payment.paidDate) {
            const existingTransaction = await prisma.transaction.findFirst({
                where: {
                    OR: [
                        { reference: `PAY-${id}` },
                        { reference: `PAY-${id.slice(-8)}` }
                    ],
                    organizationId: payment.organizationId
                }
            })
            if (existingTransaction) {
                await prisma.transaction.delete({
                    where: { id: existingTransaction.id }
                })
            }
        }

        // Revertir balance si el pago estaba pagado
        if (payment.status === 'PAID' && payment.paidDate) {
            // Obtener la transacción para determinar la moneda
            const existingTransaction = await prisma.transaction.findFirst({
                where: {
                    OR: [
                        { reference: `PAY-${id}` },
                        { reference: `PAY-${id.slice(-8)}` }
                    ],
                    organizationId: payment.organizationId
                }
            })

            const currency = existingTransaction?.currency || 'PESOS' // Default a PESOS si no se encuentra
            const amount = new Decimal(existingTransaction?.amount || payment.amount).toNumber()
            const adjustment = -amount // Decrementar al eliminar ingreso (cobranza)

            if (payment.cashBoxId) {
                await prisma.accountBalance.upsert({
                    where: {
                        accountId_accountType_currency: {
                            accountId: payment.cashBoxId,
                            accountType: 'CASH_BOX',
                            currency: currency
                        }
                    },
                    update: {
                        balance: { increment: adjustment },
                        updatedAt: new Date()
                    },
                    create: {
                        accountId: payment.cashBoxId,
                        accountType: 'CASH_BOX',
                        currency: currency,
                        balance: adjustment,
                        organizationId: payment.organizationId,
                        updatedAt: new Date()
                    }
                })
            } else if (payment.bankAccountId) {
                await prisma.accountBalance.upsert({
                    where: {
                        accountId_accountType_currency: {
                            accountId: payment.bankAccountId,
                            accountType: 'BANK_ACCOUNT',
                            currency: currency
                        }
                    },
                    update: {
                        balance: { increment: adjustment },
                        updatedAt: new Date()
                    },
                    create: {
                        accountId: payment.bankAccountId,
                        accountType: 'BANK_ACCOUNT',
                        currency: currency,
                        balance: adjustment,
                        organizationId: payment.organizationId,
                        updatedAt: new Date()
                    }
                })
            }
        }

        // Eliminar asientos contables automáticos asociados
        await AutoAccountingService.deleteAutomaticEntries('PAYMENT', id)

        await prisma.payment.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
    }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'
import { AutoAccountingService } from '@/lib/accounting/auto-accounting'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params
        const payroll = await prisma.payroll.findUnique({
            where: { id },
            include: {
                cashBox: true,
                bankAccount: true,
                transaction: true
            }
        })
        if (!payroll) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json(payroll)
    } catch (error) {
        console.error('Error fetching payroll:', error)
        return NextResponse.json({ error: 'Error fetching payroll' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params
        const body = await request.json()
        const coerceNumber = (v: any) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }

        // Obtener la nómina actual para comparar cambios
        const currentPayroll = await prisma.payroll.findUnique({
            where: { id },
            include: {
                cashBox: true,
                bankAccount: true
            }
        })

        if (!currentPayroll) {
            return NextResponse.json({ error: 'Payroll not found' }, { status: 404 })
        }

        const data: any = {
            ...body,
            baseSalary: coerceNumber(body.baseSalary),
            overtimeHours: coerceNumber(body.overtimeHours),
            overtimeRate: coerceNumber(body.overtimeRate),
            overtimePay: coerceNumber(body.overtimePay),
            bonuses: coerceNumber(body.bonuses),
            deductions: coerceNumber(body.deductions),
        }
        data.netPay = (data.baseSalary || 0) + (data.overtimePay || 0) + (data.bonuses || 0) - (data.deductions || 0)

        // Actualizar nómina y transacción en una transacción
        const result = await prisma.$transaction(async (tx) => {
            // Actualizar la nómina
            const updatedPayroll = await tx.payroll.update({ where: { id }, data })

            // Actualizar la transacción correspondiente si existe
            if (currentPayroll.transactionId) {
                const transactionUpdate = {
                    amount: data.netPay,
                    description: `Nómina ${data.employeeName || currentPayroll.employeeName} - ${data.period || currentPayroll.period}`,
                    notes: `Pago de nómina para ${data.employeeName || currentPayroll.employeeName} correspondiente al período ${data.period || currentPayroll.period}`,
                    cashBoxId: data.cashBoxId || currentPayroll.cashBoxId,
                    bankAccountId: data.bankAccountId || currentPayroll.bankAccountId,
                }

                await tx.transaction.update({
                    where: { id: currentPayroll.transactionId },
                    data: transactionUpdate
                })

                // Si cambió el monto, ajustar el balance
                if (data.netPay !== (currentPayroll.netPay || 0)) {
                    const difference = new Decimal(data.netPay).minus(new Decimal(currentPayroll.netPay || 0)).toNumber()
                    const adjustment = -difference // Es un egreso, así que el cambio debe ser negativo

                    if (data.cashBoxId || currentPayroll.cashBoxId) {
                        await tx.accountBalance.upsert({
                            where: {
                                accountId_accountType_currency: {
                                    accountId: data.cashBoxId || currentPayroll.cashBoxId,
                                    accountType: 'CASH_BOX',
                                    currency: 'PESOS' // Asumiendo que las nóminas son en PESOS
                                }
                            },
                            update: {
                                balance: { increment: adjustment },
                                updatedAt: new Date()
                            },
                            create: {
                                accountId: data.cashBoxId || currentPayroll.cashBoxId,
                                accountType: 'CASH_BOX',
                                currency: 'PESOS',
                                balance: adjustment,
                                organizationId: currentPayroll.organizationId,
                                updatedAt: new Date()
                            }
                        })
                    } else if (data.bankAccountId || currentPayroll.bankAccountId) {
                        await tx.accountBalance.upsert({
                            where: {
                                accountId_accountType_currency: {
                                    accountId: data.bankAccountId || currentPayroll.bankAccountId,
                                    accountType: 'BANK_ACCOUNT',
                                    currency: 'PESOS'
                                }
                            },
                            update: {
                                balance: { increment: adjustment },
                                updatedAt: new Date()
                            },
                            create: {
                                accountId: data.bankAccountId || currentPayroll.bankAccountId,
                                accountType: 'BANK_ACCOUNT',
                                currency: 'PESOS',
                                balance: adjustment,
                                organizationId: currentPayroll.organizationId,
                                updatedAt: new Date()
                            }
                        })
                    }
                }
            }

            return updatedPayroll
        })

        // Fetch the complete payroll with relations for response
        const completePayroll = await prisma.payroll.findUnique({
            where: { id },
            include: {
                cashBox: true,
                bankAccount: true,
                transaction: true
            }
        })

        return NextResponse.json(completePayroll)
    } catch (error) {
        console.error('Error updating payroll:', error)
        return NextResponse.json({ error: 'Error updating payroll' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params

        // Obtener la nómina con su transacción relacionada
        const payroll = await prisma.payroll.findUnique({
            where: { id },
            include: {
                cashBox: true,
                bankAccount: true
            }
        })

        if (!payroll) {
            return NextResponse.json({ error: 'Payroll not found' }, { status: 404 })
        }

        // Eliminar la transacción correspondiente en treasury si existe
        if (payroll.transactionId) {
            const transaction = await prisma.transaction.findUnique({
                where: { id: payroll.transactionId }
            })

            if (transaction) {
                // Revertir el balance usando AccountBalance (era un egreso, así que sumar)
                const amount = new Decimal(transaction.amount).toNumber()
                const adjustment = amount // Sumar para revertir egreso

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
                            organizationId: payroll.organizationId,
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
                            organizationId: payroll.organizationId,
                            updatedAt: new Date()
                        }
                    })
                }

                // Eliminar la transacción
                await prisma.transaction.delete({
                    where: { id: transaction.id }
                })
            }
        }

        // Eliminar asientos contables automáticos asociados
        await AutoAccountingService.deleteAutomaticEntries('PAYROLL', id)

        // Eliminar la nómina
        await prisma.payroll.delete({ where: { id } })

        return NextResponse.json({
            success: true,
            message: 'Nómina y transacción relacionada eliminadas exitosamente'
        })
    } catch (error) {
        console.error('Error deleting payroll:', error)
        return NextResponse.json({ error: 'Error deleting payroll' }, { status: 500 })
    }
}

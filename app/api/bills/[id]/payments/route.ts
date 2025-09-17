import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BillStatus, BillType } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { notificationTrigger } from '@/lib/email/notificationTrigger'

function parseLocalDate(dateString: string): Date {
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-').map(Number)
        return new Date(year, month - 1, day)
    }
    return new Date(dateString)
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const billId = params.id
        const body = await request.json()

        const {
            amount,
            method,
            currency,
            paymentDate,
            reference,
            notes,
            cashBoxId,
            bankAccountId,
            organizationId
        } = body

        // Verificar que la factura existe
        const bill = await prisma.bill.findUnique({
            where: { id: billId },
            include: {
                payments: true
            }
        })

        if (!bill) {
            return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
        }

        if (bill.status === BillStatus.PAID) {
            return NextResponse.json({ error: 'Bill is already fully paid' }, { status: 400 })
        }

        if (!amount || parseFloat(amount) <= 0) {
            return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 })
        }

        if (!cashBoxId && !bankAccountId) {
            return NextResponse.json({ error: 'Either cashBoxId or bankAccountId is required' }, { status: 400 })
        }

        // Verificar que la cuenta existe
        if (cashBoxId) {
            const cashBox = await prisma.cashBox.findUnique({ where: { id: cashBoxId, organizationId } })
            if (!cashBox) {
                return NextResponse.json({ error: 'Cash box not found' }, { status: 404 })
            }
        }

        if (bankAccountId) {
            const bankAccount = await prisma.bankAccount.findUnique({ where: { id: bankAccountId, organizationId } })
            if (!bankAccount) {
                return NextResponse.json({ error: 'Bank account not found' }, { status: 404 })
            }
        }

        // Calcular total pagado hasta ahora
        const totalPaid = bill.payments.reduce((sum, payment) => sum.add(payment.amount), new Decimal(0))
        const remainingAmount = bill.total.sub(totalPaid)
        const paymentAmount = new Decimal(amount)

        // Verificar que no se pague más de lo debido
        if (paymentAmount.gt(remainingAmount)) {
            return NextResponse.json({
                error: `Payment amount (${paymentAmount}) exceeds remaining amount (${remainingAmount})`
            }, { status: 400 })
        }

        const isIncome = bill.type === BillType.CLIENT
        const paymentDescription = isIncome
            ? `Pago recibido de factura ${bill.number}`
            : `Pago realizado de factura ${bill.number}`

        // Crear el pago
        const payment = await prisma.billPayment.create({
            data: {
                amount: paymentAmount,
                method: method || 'TRANSFER',
                currency: currency || bill.currency,
                paymentDate: paymentDate ? parseLocalDate(paymentDate) : new Date(),
                reference,
                notes,
                billId,
                organizationId,
                cashBoxId: cashBoxId || null,
                bankAccountId: bankAccountId || null
            }
        })

        // Actualizar balance usando AccountBalance
        const adjustment = isIncome ? paymentAmount.toNumber() : -paymentAmount.toNumber()

        if (cashBoxId) {
            await prisma.accountBalance.upsert({
                where: {
                    accountId_accountType_currency: {
                        accountId: cashBoxId,
                        accountType: 'CASH_BOX',
                        currency: currency || bill.currency
                    }
                },
                update: {
                    balance: { increment: adjustment },
                    updatedAt: new Date()
                },
                create: {
                    accountId: cashBoxId,
                    accountType: 'CASH_BOX',
                    currency: currency || bill.currency,
                    balance: adjustment,
                    organizationId: organizationId,
                    updatedAt: new Date()
                }
            })
        } else if (bankAccountId) {
            await prisma.accountBalance.upsert({
                where: {
                    accountId_accountType_currency: {
                        accountId: bankAccountId,
                        accountType: 'BANK_ACCOUNT',
                        currency: currency || bill.currency
                    }
                },
                update: {
                    balance: { increment: adjustment },
                    updatedAt: new Date()
                },
                create: {
                    accountId: bankAccountId,
                    accountType: 'BANK_ACCOUNT',
                    currency: currency || bill.currency,
                    balance: adjustment,
                    organizationId: organizationId,
                    updatedAt: new Date()
                }
            })
        }

        // Crear transacción en tesorería
        const transaction = await prisma.transaction.create({
            data: {
                amount: paymentAmount.toNumber(),
                description: paymentDescription,
                type: isIncome ? 'INCOME' : 'EXPENSE',
                category: isIncome ? 'Cobranza' : 'Pagos Proveedores',
                date: paymentDate ? parseLocalDate(paymentDate) : new Date(),
                reference: `BILL-PAY-${payment.id}`,
                notes,
                organizationId,
                projectId: bill.projectId,
                cashBoxId: cashBoxId || null,
                bankAccountId: bankAccountId || null,
                currency: currency || bill.currency
            }
        })

        console.log('✅ Transacción creada en tesorería:', {
            transactionId: transaction.id,
            reference: transaction.reference,
            amount: transaction.amount,
            description: transaction.description,
            type: transaction.type,
            billId: bill.id,
            billNumber: bill.number
        })

        // Actualizar estado de la factura
        const newTotalPaid = totalPaid.add(paymentAmount)
        let newStatus: BillStatus = bill.status

        if (newTotalPaid.gte(bill.total)) {
            newStatus = BillStatus.PAID
        } else if (newTotalPaid.gt(0)) {
            newStatus = BillStatus.PARTIAL
        }

        await prisma.bill.update({
            where: { id: billId },
            data: {
                status: newStatus,
                paidDate: newStatus === BillStatus.PAID ? (paymentDate ? parseLocalDate(paymentDate) : new Date()) : null
            }
        })

        // Buscar el pago creado con relaciones
        const createdPayment = await prisma.billPayment.findUnique({
            where: { id: payment.id },
            include: {
                cashBox: { select: { id: true, name: true, currency: true } },
                bankAccount: { select: { id: true, name: true, currency: true } },
                bill: {
                    include: {
                        project: { select: { id: true, name: true } },
                        client: { select: { id: true, name: true } },
                        provider: { select: { id: true, name: true } }
                    }
                }
            }
        })

        // Disparar notificación si la factura se completó
        if (newStatus === BillStatus.PAID && bill.status !== (BillStatus.PAID as typeof bill.status)) {
            try {
                await notificationTrigger.onBillPaid(createdPayment?.bill, createdPayment)
            } catch (notificationError) {
                console.error('Error sending bill paid notification:', notificationError)
            }
        }

        return NextResponse.json({
            payment: createdPayment,
            message: 'Payment created successfully'
        }, { status: 201 })

    } catch (error) {
        console.error('Error creating payment:', error)
        return NextResponse.json({ error: 'Error creating payment' }, { status: 500 })
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const billId = params.id

        const payments = await prisma.billPayment.findMany({
            where: { billId },
            include: {
                cashBox: { select: { id: true, name: true, currency: true } },
                bankAccount: { select: { id: true, name: true, currency: true } }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(payments)

    } catch (error) {
        console.error('Error fetching payments:', error)
        return NextResponse.json({ error: 'Error fetching payments' }, { status: 500 })
    }
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notificationTrigger } from '@/lib/email/notificationTrigger'
import { AutoAccountingService } from '@/lib/accounting/auto-accounting'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const organizationId = searchParams.get('organizationId')
        const clientId = searchParams.get('clientId')

        if (!organizationId) {
            return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
        }

        const where: any = {
            organizationId
        }

        // Agregar filtro por cliente si se especifica
        if (clientId) {
            where.clientId = clientId
        }

        const payments = await prisma.payment.findMany({
            where,
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
                paymentTerm: {
                    select: { id: true, description: true, recurrence: true, periods: true }
                },
                cashBox: {
                    select: { id: true, name: true, currency: true }
                },
                bankAccount: {
                    select: { id: true, name: true, currency: true, bankName: true }
                }
            },
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json(payments)
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            amount,
            description,
            method,
            status,
            dueDate,
            paidDate,
            reference,
            notes,
            clientId,
            projectId,
            rubroId,
            organizationId,
            createdById,
            cashBoxId,
            bankAccountId,
            currency,
            paymentTermId,
            installmentNumber,
            selectedCheckId,
        } = body

        if (!amount || !organizationId || !createdById) {
            return NextResponse.json({ error: 'amount, organizationId and createdById are required' }, { status: 400 })
        }

        // Validar que se seleccione una cuenta si el status es PAID
        if (status === 'PAID' && !cashBoxId && !bankAccountId) {
            return NextResponse.json({ error: 'Para marcar una cobranza como pagada, debes seleccionar una caja o cuenta bancaria donde se depositó el pago' }, { status: 400 })
        }

        const payment = await prisma.payment.create({
            data: {
                amount: parseFloat(amount),
                description: description || null,
                method: method || 'TRANSFER',
                status: status || 'PENDING',
                dueDate: dueDate ? new Date(dueDate) : null,
                paidDate: paidDate ? new Date(paidDate) : null,
                reference: reference || null,
                notes: notes || null,
                clientId: clientId || null,
                projectId: projectId || null,
                rubroId: rubroId || null,
                organizationId,
                createdById,
                cashBoxId: cashBoxId || null,
                bankAccountId: bankAccountId || null,
                currency: currency || 'PESOS',
                paymentTermId: paymentTermId || null,
                installmentNumber: installmentNumber || null,
                checkId: selectedCheckId || null,
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
                paymentTerm: {
                    select: { id: true, description: true, recurrence: true, periods: true }
                },
                cashBox: {
                    select: { id: true, name: true, currency: true }
                },
                bankAccount: {
                    select: { id: true, name: true, currency: true, bankName: true }
                }
            }
        })

        // Actualizar balances si el pago está pagado (cobranzas suman al balance)
        if (payment.status === 'PAID' && payment.paidDate) {
            // Crear transacción en treasury para que aparezca en el listado
            const transactionDescription = `Cobranza: ${description || 'Sin descripción'}`
            const transactionReference = reference || `PAY-${payment.id}`

            await prisma.transaction.create({
                data: {
                    amount: parseFloat(amount),
                    description: transactionDescription,
                    type: 'INCOME',
                    category: 'Cobranza',
                    currency: currency as any,
                    date: payment.paidDate,
                    reference: transactionReference,
                    notes: notes || null,
                    organizationId,
                    projectId: projectId || null,
                    cashBoxId: cashBoxId || null,
                    bankAccountId: bankAccountId || null
                }
            })

            // Actualizar balances de las cuentas (esto ya lo hace la transacción automáticamente)
            // Actualizar balance usando AccountBalance
            if (cashBoxId) {
                await prisma.accountBalance.upsert({
                    where: {
                        accountId_accountType_currency: {
                            accountId: cashBoxId,
                            accountType: 'CASH_BOX',
                            currency: currency || 'PESOS'
                        }
                    },
                    update: {
                        balance: { increment: parseFloat(amount) },
                        updatedAt: new Date()
                    },
                    create: {
                        accountId: cashBoxId,
                        accountType: 'CASH_BOX',
                        currency: currency || 'PESOS',
                        balance: parseFloat(amount),
                        organizationId,
                        updatedAt: new Date()
                    }
                })
            } else if (bankAccountId) {
                await prisma.accountBalance.upsert({
                    where: {
                        accountId_accountType_currency: {
                            accountId: bankAccountId,
                            accountType: 'BANK_ACCOUNT',
                            currency: currency || 'PESOS'
                        }
                    },
                    update: {
                        balance: { increment: parseFloat(amount) },
                        updatedAt: new Date()
                    },
                    create: {
                        accountId: bankAccountId,
                        accountType: 'BANK_ACCOUNT',
                        currency: currency || 'PESOS',
                        balance: parseFloat(amount),
                        organizationId,
                        updatedAt: new Date()
                    }
                })
            }

            // Generar asiento automático para la cobranza (si la organización tiene contabilidad)
            try {
                await AutoAccountingService.createPaymentEntry(payment.id)
            } catch (err) {
                console.error('Error generating accounting entry for collection:', err)
            }
        }

        // Actualizar estado del cheque si se seleccionó uno y está pagado
        if (payment.status === 'PAID' && selectedCheckId) {
            await prisma.check.update({
                where: { id: selectedCheckId },
                data: { status: 'CLEARED' }
            })
        }

        // Disparar notificación de cobranza creada
        try {
            await notificationTrigger.onCollectionCreated({
                ...payment,
                client: payment.client,
                paymentMethod: payment.method,
                dueDate: payment.dueDate
            });
        } catch (error) {
            console.error('Error sending collection notification:', error);
        }

        return NextResponse.json(payment)
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
    }
}

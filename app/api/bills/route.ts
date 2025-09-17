import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BillStatus, BillType } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { notificationTrigger } from '@/lib/email/notificationTrigger'
import { AutoAccountingService } from '@/lib/accounting/auto-accounting'

// Función para parsear fechas en formato YYYY-MM-DD como zona horaria local
function parseLocalDate(dateString: string): Date {
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-').map(Number)
        return new Date(year, month - 1, day)
    }
    return new Date(dateString)
}

// Función para generar número de factura automático
async function generateBillNumber(organizationId: string, type: BillType): Promise<string> {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')

    const prefix = type === BillType.CLIENT ? 'FAC' : 'PROV'

    // Buscar el último número de factura del mes actual
    const lastBill = await prisma.bill.findFirst({
        where: {
            organizationId,
            type,
            number: {
                startsWith: `${prefix}-${year}${month}`
            }
        },
        orderBy: {
            number: 'desc'
        }
    })

    let sequence = 1
    if (lastBill?.number) {
        const lastSequence = parseInt(lastBill.number.split('-')[2] || '0')
        sequence = lastSequence + 1
    }

    return `${prefix}-${year}${month}-${String(sequence).padStart(3, '0')}`
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            number,
            type,
            projectId,
            clientId,
            providerId,
            amount,
            currency,
            taxRate = 0,
            retentionRate = 0,
            otherRate = 0,
            issueDate,
            dueDate,
            description,
            notes,
            organizationId,
            createdById,
            paymentTermId,
            rubros = [], // Array of {rubroId, percentage}
            createPayment = false,
            paymentData = null,
            createStock = false,
            stockData = [] // Array of {materialId, quantity, warehouseId}
        } = body

        if (!organizationId) {
            return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
        }

        if (!projectId) {
            return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
        }

        if (!type || !Object.values(BillType).includes(type)) {
            return NextResponse.json({ error: 'Valid type (CLIENT or PROVIDER) is required' }, { status: 400 })
        }

        // Validar que se proporcione cliente o proveedor según el tipo
        if (type === BillType.CLIENT && !clientId) {
            return NextResponse.json({ error: 'clientId is required for CLIENT bills' }, { status: 400 })
        }

        if (type === BillType.PROVIDER && !providerId) {
            return NextResponse.json({ error: 'providerId is required for PROVIDER bills' }, { status: 400 })
        }

        // Verificar que existe la organización
        const organization = await prisma.organization.findUnique({ where: { id: organizationId } })
        if (!organization) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        // Verificar que existe el proyecto
        const project = await prisma.project.findUnique({ where: { id: projectId, organizationId } })
        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 })
        }

        // Verificar que existe el usuario creador
        const createdBy = await prisma.user.findUnique({ where: { id: createdById, organizationId } })
        if (!createdBy) {
            return NextResponse.json({ error: 'Created by user not found' }, { status: 404 })
        }

        // Generar número de factura si no se proporciona
        const billNumber = number || await generateBillNumber(organizationId, type)

        // Calcular montos
        const baseAmount = new Decimal(amount || 0)
        const taxAmount = baseAmount.mul(new Decimal(taxRate || 0)).div(100)
        const retentionAmount = baseAmount.mul(new Decimal(retentionRate || 0)).div(100)
        const otherAmount = baseAmount.mul(new Decimal(otherRate || 0)).div(100)
        const totalAmount = baseAmount.add(taxAmount).add(otherAmount).sub(retentionAmount)

        // Validar rubros si se proporcionan
        let validatedRubros = []
        if (rubros && rubros.length > 0) {
            const totalPercentage = rubros.reduce((sum: number, rubro: any) => sum + (parseFloat(rubro.percentage) || 0), 0)

            if (Math.abs(totalPercentage - 100) > 0.01) {
                return NextResponse.json({ error: 'Los porcentajes de rubros deben sumar 100%' }, { status: 400 })
            }

            for (const rubro of rubros) {
                const rubroExists = await prisma.rubro.findUnique({
                    where: { id: rubro.rubroId, organizationId }
                })
                if (!rubroExists) {
                    return NextResponse.json({ error: `Rubro ${rubro.rubroId} not found` }, { status: 404 })
                }

                const rubroAmount = baseAmount.mul(new Decimal(rubro.percentage || 0)).div(100)
                validatedRubros.push({
                    rubroId: rubro.rubroId,
                    percentage: new Decimal(rubro.percentage || 0),
                    amount: rubroAmount
                })
            }
        }

        // Crear la factura
        const bill = await prisma.bill.create({
            data: {
                number: billNumber,
                type,
                amount: baseAmount,
                currency: currency || 'PESOS',
                taxRate: new Decimal(taxRate || 0),
                taxAmount,
                retentionRate: new Decimal(retentionRate || 0),
                retentionAmount,
                otherRate: new Decimal(otherRate || 0),
                otherAmount,
                total: totalAmount,
                issueDate: issueDate ? parseLocalDate(issueDate) : new Date(),
                dueDate: dueDate ? parseLocalDate(dueDate) : new Date(),
                description,
                notes,
                status: BillStatus.PENDING,
                organizationId,
                projectId,
                clientId: type === BillType.CLIENT ? clientId : null,
                providerId: type === BillType.PROVIDER ? providerId : null,
                createdById,
                paymentTermId: paymentTermId || null
            }
        })

        // Crear relaciones con rubros si se proporcionan
        for (const rubro of validatedRubros) {
            await prisma.billRubro.create({
                data: {
                    billId: bill.id,
                    rubroId: rubro.rubroId,
                    percentage: rubro.percentage,
                    amount: rubro.amount
                }
            })
        }

        // Crear pago inmediato si se solicita
        let payment = null
        // Variable para almacenar la transacción creada en tesorería (si aplica)
        let createdTransaction: any = null
        if (createPayment && paymentData) {
            const isIncome = type === BillType.CLIENT
            const paymentDescription = isIncome
                ? `Pago recibido de factura ${billNumber}`
                : `Pago realizado de factura ${billNumber}`

            payment = await prisma.billPayment.create({
                data: {
                    amount: new Decimal(paymentData.amount || totalAmount),
                    method: paymentData.method,
                    currency: paymentData.currency || currency || 'PESOS',
                    paymentDate: paymentData.paymentDate ? parseLocalDate(paymentData.paymentDate) : new Date(),
                    reference: paymentData.reference,
                    notes: paymentData.notes,
                    billId: bill.id,
                    organizationId,
                    cashBoxId: paymentData.cashBoxId || null,
                    bankAccountId: paymentData.bankAccountId || null,
                    checkId: paymentData.selectedCheckId || null
                }
            })

            // Actualizar balance usando AccountBalance
            const paymentAmount = new Decimal(paymentData.amount || totalAmount)
            const adjustment = isIncome ? paymentAmount.toNumber() : -paymentAmount.toNumber()

            if (paymentData.cashBoxId) {
                await prisma.accountBalance.upsert({
                    where: {
                        accountId_accountType_currency: {
                            accountId: paymentData.cashBoxId,
                            accountType: 'CASH_BOX',
                            currency: paymentData.currency || currency || 'PESOS'
                        }
                    },
                    update: {
                        balance: { increment: adjustment },
                        updatedAt: new Date()
                    },
                    create: {
                        accountId: paymentData.cashBoxId,
                        accountType: 'CASH_BOX',
                        currency: paymentData.currency || currency || 'PESOS',
                        balance: adjustment,
                        organizationId,
                        updatedAt: new Date()
                    }
                })
            } else if (paymentData.bankAccountId) {
                await prisma.accountBalance.upsert({
                    where: {
                        accountId_accountType_currency: {
                            accountId: paymentData.bankAccountId,
                            accountType: 'BANK_ACCOUNT',
                            currency: paymentData.currency || currency || 'PESOS'
                        }
                    },
                    update: {
                        balance: { increment: adjustment },
                        updatedAt: new Date()
                    },
                    create: {
                        accountId: paymentData.bankAccountId,
                        accountType: 'BANK_ACCOUNT',
                        currency: paymentData.currency || currency || 'PESOS',
                        balance: adjustment,
                        organizationId,
                        updatedAt: new Date()
                    }
                })
            }

            // Crear transacción en tesorería
            createdTransaction = await prisma.transaction.create({
                data: {
                    amount: paymentAmount.toNumber(),
                    description: paymentDescription,
                    type: isIncome ? 'INCOME' : 'EXPENSE',
                    category: isIncome ? 'Cobranza' : 'Pagos Proveedores',
                    date: paymentData.paymentDate ? parseLocalDate(paymentData.paymentDate) : new Date(),
                    reference: `BILL-PAY-${payment.id}`,
                    notes: paymentData.notes,
                    organizationId,
                    projectId,
                    cashBoxId: paymentData.cashBoxId || null,
                    bankAccountId: paymentData.bankAccountId || null,
                    currency: paymentData.currency || currency || 'PESOS'
                },
                include: {
                    project: { select: { id: true, name: true } },
                    cashBox: { select: { id: true, name: true, currency: true } },
                    bankAccount: { select: { id: true, name: true, bankName: true, currency: true } }
                }
            })

            console.log('🔥 BILL PAYMENT - Transaction created:', {
                id: createdTransaction.id,
                amount: createdTransaction.amount,
                type: createdTransaction.type,
                reference: createdTransaction.reference,
                cashBoxId: createdTransaction.cashBoxId,
                bankAccountId: createdTransaction.bankAccountId,
                currency: createdTransaction.currency,
                billNumber: billNumber
            })

            // Actualizar estado de la factura
            const paidAmount = paymentAmount
            if (paidAmount.gte(totalAmount)) {
                await prisma.bill.update({
                    where: { id: bill.id },
                    data: {
                        status: BillStatus.PAID,
                        paidDate: paymentData.paymentDate ? parseLocalDate(paymentData.paymentDate) : new Date()
                    }
                })

                // Disparar notificación de factura pagada si se completa el pago
                try {
                    await notificationTrigger.onBillPaid(bill, payment)
                } catch (notificationError) {
                    console.error('Error sending bill paid notification:', notificationError)
                }

                // Generar asiento contable automático para el pago si está habilitado
                try {
                    const org = await prisma.organization.findUnique({
                        where: { id: organizationId },
                        select: { enableAccounting: true }
                    })

                    if (org?.enableAccounting) {
                        await AutoAccountingService.createBillPaymentEntry(payment.id)
                        console.log(`✅ Auto-accounting: Created journal entry for bill payment ${payment.id}`)
                    }
                } catch (accountingError) {
                    console.error('Error creating automatic journal entry for bill payment:', accountingError)
                    // No fallar la operación por error de contabilidad
                }
            } else if (paidAmount.gt(0)) {
                await prisma.bill.update({
                    where: { id: bill.id },
                    data: { status: BillStatus.PARTIAL }
                })
            }

            // Actualizar estado del cheque si se seleccionó uno
            if (paymentData.selectedCheckId) {
                await prisma.check.update({
                    where: { id: paymentData.selectedCheckId },
                    data: { status: 'CLEARED' }
                })
            }
        }

        // Crear movimientos de stock si se solicita
        let stockMovements = []
        if (createStock && stockData && stockData.length > 0) {
            for (const stockItem of stockData) {
                // Verificar que existe el material y almacén
                const material = await prisma.material.findUnique({
                    where: { id: stockItem.materialId, organizationId }
                })
                const warehouse = await prisma.warehouse.findUnique({
                    where: { id: stockItem.warehouseId, organizationId }
                })

                if (!material || !warehouse) {
                    continue // Saltar items inválidos
                }

                // Crear movimiento de stock asociado a la factura
                const stockMovement = await prisma.billStockMovement.create({
                    data: {
                        billId: bill.id,
                        materialId: stockItem.materialId,
                        warehouseId: stockItem.warehouseId,
                        quantity: new Decimal(stockItem.quantity || 0)
                    }
                })

                // Actualizar stock según el tipo de factura
                const isIncome = type === BillType.PROVIDER // Si es factura de proveedor, es ingreso de stock
                const quantityChange = isIncome
                    ? new Decimal(stockItem.quantity || 0)
                    : new Decimal(stockItem.quantity || 0).neg()

                // Buscar o crear registro de stock
                const existingStock = await prisma.stock.findUnique({
                    where: {
                        materialId_warehouseId: {
                            materialId: stockItem.materialId,
                            warehouseId: stockItem.warehouseId
                        }
                    }
                })

                if (existingStock) {
                    await prisma.stock.update({
                        where: { id: existingStock.id },
                        data: {
                            quantity: { increment: quantityChange.toNumber() },
                            available: { increment: quantityChange.toNumber() },
                            lastUpdated: new Date()
                        }
                    })
                } else {
                    await prisma.stock.create({
                        data: {
                            materialId: stockItem.materialId,
                            warehouseId: stockItem.warehouseId,
                            quantity: quantityChange.toNumber(),
                            available: quantityChange.toNumber(),
                            reserved: 0
                        }
                    })
                }

                // Crear movimiento de stock general para trazabilidad
                await prisma.stockMovement.create({
                    data: {
                        type: isIncome ? 'ENTRADA' : 'SALIDA',
                        quantity: new Decimal(stockItem.quantity || 0).toNumber(),
                        description: `${isIncome ? 'Ingreso' : 'Egreso'} por factura ${billNumber}`,
                        reference: billNumber,
                        materialId: stockItem.materialId,
                        [isIncome ? 'toWarehouseId' : 'fromWarehouseId']: stockItem.warehouseId,
                        organizationId,
                        createdById
                    }
                })

                stockMovements.push(stockMovement)
            }
        }

        // Buscar la factura creada con todas las relaciones para el response
        const createdBill = await prisma.bill.findUnique({
            where: { id: bill.id },
            include: {
                project: { select: { id: true, name: true } },
                client: { select: { id: true, name: true } },
                provider: { select: { id: true, name: true } },
                createdBy: { select: { id: true, name: true, email: true } },
                billRubros: {
                    include: {
                        rubro: { select: { id: true, name: true } }
                    }
                },
                payments: {
                    include: {
                        cashBox: { select: { id: true, name: true } },
                        bankAccount: { select: { id: true, name: true } }
                    }
                },
                stockMovements: {
                    include: {
                        material: { select: { id: true, name: true, unit: true } },
                        warehouse: { select: { id: true, name: true } }
                    }
                }
            }
        })

        // Disparar notificación de factura creada
        try {
            await notificationTrigger.onBillCreated(createdBill)
        } catch (notificationError) {
            console.error('Error sending bill creation notification:', notificationError)
            // No fallar la operación por error de notificación
        }

        // Generar asiento contable automático si está habilitado
        try {
            // Verificar si la organización tiene contabilidad habilitada
            const org = await prisma.organization.findUnique({
                where: { id: organizationId },
                select: { enableAccounting: true }
            })

            if (org?.enableAccounting && createdBill) {
                await AutoAccountingService.createBillEntry(createdBill.id)
                console.log(`✅ Auto-accounting: Created journal entry for bill ${createdBill.number}`)
            }
        } catch (accountingError) {
            console.error('Error creating automatic journal entry for bill:', accountingError)
            // No fallar la operación por error de contabilidad
        }

        return NextResponse.json({
            bill: createdBill,
            payment,
            transaction: typeof createdTransaction !== 'undefined' ? createdTransaction : null,
            stockMovements,
            message: `Factura creada exitosamente${payment ? ' con pago inmediato' : ''}${stockMovements.length > 0 ? ` y ${stockMovements.length} movimiento(s) de stock` : ''}`
        }, { status: 201 })

    } catch (error) {
        console.error('Error creating bill:', error)
        return NextResponse.json({
            error: 'Error creating bill',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const organizationId = searchParams.get('organizationId')
        const type = searchParams.get('type') // CLIENT, PROVIDER o null para todos
        const projectId = searchParams.get('projectId')
        const status = searchParams.get('status')

        if (!organizationId) {
            return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
        }

        // Construir filtros
        const where: any = { organizationId }

        if (type && Object.values(BillType).includes(type as BillType)) {
            where.type = type
        }

        if (projectId) {
            where.projectId = projectId
        }

        if (status && Object.values(BillStatus).includes(status as BillStatus)) {
            where.status = status
        }

        const bills = await prisma.bill.findMany({
            where,
            include: {
                project: { select: { id: true, name: true } },
                client: { select: { id: true, name: true } },
                provider: { select: { id: true, name: true } },
                createdBy: { select: { id: true, name: true, email: true } },
                billRubros: {
                    include: {
                        rubro: { select: { id: true, name: true, color: true } }
                    }
                },
                payments: {
                    include: {
                        cashBox: { select: { id: true, name: true, currency: true } },
                        bankAccount: { select: { id: true, name: true, currency: true } }
                    }
                },
                stockMovements: {
                    include: {
                        material: { select: { id: true, name: true, unit: true } },
                        warehouse: { select: { id: true, name: true } }
                    }
                },
                paymentTerm: {
                    select: { id: true, description: true, periods: true, recurrence: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        // Calcular estadísticas
        const totalBills = bills.length
        const clientBills = bills.filter(bill => bill.type === BillType.CLIENT).length
        const providerBills = bills.filter(bill => bill.type === BillType.PROVIDER).length

        const paidBills = bills.filter(bill => bill.status === BillStatus.PAID).length
        const partialBills = bills.filter(bill => bill.status === BillStatus.PARTIAL).length
        const pendingBills = bills.filter(bill => bill.status === BillStatus.PENDING).length
        const overdueBills = bills.filter(bill => {
            return (bill.status === BillStatus.PENDING || bill.status === BillStatus.PARTIAL) &&
                new Date(bill.dueDate) < new Date()
        }).length

        // Calcular totales financieros por moneda
        const calculateByCurrency = (filterFn: (bill: any) => boolean) => {
            const result = {
                PESOS: 0,
                USD: 0,
                EUR: 0
            }

            bills.filter(filterFn).forEach(bill => {
                result[bill.currency as keyof typeof result] += bill.total.toNumber()
            })

            return result
        }

        const totalAmount = calculateByCurrency(() => true)
        const paidAmount = calculateByCurrency(bill => bill.status === BillStatus.PAID)
        const pendingAmount = calculateByCurrency(bill =>
            bill.status === BillStatus.PENDING || bill.status === BillStatus.PARTIAL
        )

        // Ingresos y egresos del mes por moneda
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

        const monthlyIncome = calculateByCurrency(bill => {
            const issueDate = new Date(bill.issueDate)
            return bill.type === BillType.CLIENT &&
                bill.status === BillStatus.PAID &&
                issueDate >= startOfMonth &&
                issueDate <= endOfMonth
        })

        const monthlyExpense = calculateByCurrency(bill => {
            const issueDate = new Date(bill.issueDate)
            return bill.type === BillType.PROVIDER &&
                bill.status === BillStatus.PAID &&
                issueDate >= startOfMonth &&
                issueDate <= endOfMonth
        })

        return NextResponse.json({
            bills,
            stats: {
                total: totalBills,
                client: clientBills,
                provider: providerBills,
                paid: paidBills,
                partial: partialBills,
                pending: pendingBills,
                overdue: overdueBills,
                totalAmount,
                paidAmount,
                pendingAmount,
                monthlyIncome,
                monthlyExpense,
                averageBill: {
                    PESOS: totalBills > 0 ? totalAmount.PESOS / totalBills : 0,
                    USD: totalBills > 0 ? totalAmount.USD / totalBills : 0,
                    EUR: totalBills > 0 ? totalAmount.EUR / totalBills : 0
                }
            }
        })

    } catch (error) {
        console.error('Error fetching bills:', error)
        return NextResponse.json({
            error: 'Error fetching bills',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

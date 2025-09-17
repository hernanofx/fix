import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BillStatus } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { AutoAccountingService } from '@/lib/accounting/auto-accounting'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const billId = params.id

        const bill = await prisma.bill.findUnique({
            where: { id: billId },
            include: {
                project: { select: { id: true, name: true } },
                client: { select: { id: true, name: true, email: true, phone: true, address: true } },
                provider: { select: { id: true, name: true, email: true, phone: true, address: true } },
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
                    },
                    orderBy: { createdAt: 'desc' }
                },
                stockMovements: {
                    include: {
                        material: { select: { id: true, name: true, unit: true } },
                        warehouse: { select: { id: true, name: true } }
                    }
                },
                paymentTerm: {
                    include: {
                        payments: true
                    }
                }
            }
        })

        if (!bill) {
            return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
        }

        return NextResponse.json(bill)

    } catch (error) {
        console.error('Error fetching bill:', error)
        return NextResponse.json({ error: 'Error fetching bill' }, { status: 500 })
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const billId = params.id
        const body = await request.json()

        // Verificar que la factura existe
        const existingBill = await prisma.bill.findUnique({
            where: { id: billId },
            include: {
                stockMovements: true
            }
        })
        if (!existingBill) {
            return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
        }

        const {
            amount,
            taxRate,
            retentionRate,
            otherRate,
            description,
            notes,
            dueDate,
            status,
            rubros = [],
            stockData = []
        } = body

        // Calcular nuevos montos si se proporcionan
        let updateData: any = {}

        if (amount !== undefined) {
            const baseAmount = new Decimal(amount)
            const taxAmount = baseAmount.mul(new Decimal(taxRate || existingBill.taxRate)).div(100)
            const retentionAmount = baseAmount.mul(new Decimal(retentionRate || existingBill.retentionRate)).div(100)
            const otherAmount = baseAmount.mul(new Decimal(otherRate || existingBill.otherRate)).div(100)
            const totalAmount = baseAmount.add(taxAmount).add(otherAmount).sub(retentionAmount)

            updateData = {
                ...updateData,
                amount: baseAmount,
                taxRate: new Decimal(taxRate !== undefined ? taxRate : existingBill.taxRate),
                taxAmount,
                retentionRate: new Decimal(retentionRate !== undefined ? retentionRate : existingBill.retentionRate),
                retentionAmount,
                otherRate: new Decimal(otherRate !== undefined ? otherRate : existingBill.otherRate),
                otherAmount,
                total: totalAmount
            }
        }

        if (description !== undefined) updateData.description = description
        if (notes !== undefined) updateData.notes = notes
        if (dueDate !== undefined) updateData.dueDate = new Date(dueDate)
        if (status !== undefined && Object.values(BillStatus).includes(status)) {
            updateData.status = status
            if (status === BillStatus.PAID) {
                updateData.paidDate = new Date()
            } else if (status !== BillStatus.PAID && existingBill.paidDate) {
                updateData.paidDate = null
            }
        }

        // Actualizar la factura
        const updatedBill = await prisma.bill.update({
            where: { id: billId },
            data: updateData
        })

        // Actualizar rubros si se proporcionan
        if (rubros && rubros.length > 0) {
            // Validar porcentajes
            const totalPercentage = rubros.reduce((sum: number, rubro: any) => sum + (parseFloat(rubro.percentage) || 0), 0)

            if (Math.abs(totalPercentage - 100) > 0.01) {
                return NextResponse.json({ error: 'Los porcentajes de rubros deben sumar 100%' }, { status: 400 })
            }

            // Eliminar rubros existentes
            await prisma.billRubro.deleteMany({
                where: { billId }
            })

            // Crear nuevos rubros
            for (const rubro of rubros) {
                const rubroAmount = updatedBill.amount.mul(new Decimal(rubro.percentage || 0)).div(100)
                await prisma.billRubro.create({
                    data: {
                        billId,
                        rubroId: rubro.rubroId,
                        percentage: new Decimal(rubro.percentage || 0),
                        amount: rubroAmount
                    }
                })
            }
        }

        // Manejar movimientos de stock si se proporcionan
        if (stockData.length > 0) {
            // Primero revertir los movimientos de stock existentes
            for (const existingMovement of existingBill.stockMovements) {
                const isIncome = existingBill.type === 'PROVIDER'
                const quantityChange = isIncome
                    ? new Decimal(existingMovement.quantity).neg() // Revertir ingreso
                    : new Decimal(existingMovement.quantity) // Revertir egreso

                const stock = await prisma.stock.findUnique({
                    where: {
                        materialId_warehouseId: {
                            materialId: existingMovement.materialId,
                            warehouseId: existingMovement.warehouseId
                        }
                    }
                })

                if (stock) {
                    await prisma.stock.update({
                        where: { id: stock.id },
                        data: {
                            quantity: { increment: quantityChange.toNumber() },
                            available: { increment: quantityChange.toNumber() },
                            lastUpdated: new Date()
                        }
                    })
                }
            }

            // Eliminar movimientos de stock existentes
            await prisma.billStockMovement.deleteMany({
                where: { billId }
            })

            // Crear nuevos movimientos de stock
            for (const stockItem of stockData) {
                if (stockItem.materialId && stockItem.warehouseId && stockItem.quantity > 0) {
                    // Crear el movimiento
                    await prisma.billStockMovement.create({
                        data: {
                            billId,
                            materialId: stockItem.materialId,
                            warehouseId: stockItem.warehouseId,
                            quantity: new Decimal(stockItem.quantity)
                        }
                    })

                    // Actualizar el stock
                    const isIncome = existingBill.type === 'PROVIDER'
                    const quantityChange = isIncome
                        ? new Decimal(stockItem.quantity)
                        : new Decimal(stockItem.quantity).neg()

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
                    } else if (isIncome) {
                        // Solo crear stock nuevo si es un ingreso
                        await prisma.stock.create({
                            data: {
                                materialId: stockItem.materialId,
                                warehouseId: stockItem.warehouseId,
                                quantity: stockItem.quantity,
                                available: stockItem.quantity,
                                reserved: 0,
                                lastUpdated: new Date()
                            }
                        })
                    }
                }
            }
        }

        // Buscar la factura actualizada con relaciones
        const bill = await prisma.bill.findUnique({
            where: { id: billId },
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

        return NextResponse.json(bill)

    } catch (error) {
        console.error('Error updating bill:', error)
        return NextResponse.json({ error: 'Error updating bill' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const billId = params.id

        // Verificar que la factura existe
        const existingBill = await prisma.bill.findUnique({
            where: { id: billId },
            include: {
                payments: true,
                stockMovements: true
            }
        })

        if (!existingBill) {
            return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
        }

        // Eliminar asientos contables automáticos asociados
        await AutoAccountingService.deleteAutomaticEntries('BILL', billId)

        // Eliminar asientos de pagos asociados
        for (const payment of existingBill.payments) {
            await AutoAccountingService.deleteAutomaticEntries('BILL_PAYMENT', payment.id)
        }
        for (const payment of existingBill.payments) {
            // Eliminar el registro de BillPayment
            await prisma.billPayment.delete({
                where: { id: payment.id }
            })

            // Eliminar la transacción relacionada en tesorería
            await prisma.transaction.deleteMany({
                where: {
                    reference: `BILL-PAY-${payment.id}`,
                    organizationId: existingBill.organizationId
                }
            })

            // Revertir el saldo en cajas/bancos
            // Revertir balance usando AccountBalance
            const amount = new Decimal(payment.amount).toNumber()
            const adjustment = -amount // Siempre decrementar al eliminar pago

            if (payment.cashBoxId) {
                await prisma.accountBalance.upsert({
                    where: {
                        accountId_accountType_currency: {
                            accountId: payment.cashBoxId,
                            accountType: 'CASH_BOX',
                            currency: payment.currency
                        }
                    },
                    update: {
                        balance: { increment: adjustment },
                        updatedAt: new Date()
                    },
                    create: {
                        accountId: payment.cashBoxId,
                        accountType: 'CASH_BOX',
                        currency: payment.currency,
                        balance: adjustment,
                        organizationId: existingBill.organizationId,
                        updatedAt: new Date()
                    }
                })
            }

            if (payment.bankAccountId) {
                await prisma.accountBalance.upsert({
                    where: {
                        accountId_accountType_currency: {
                            accountId: payment.bankAccountId,
                            accountType: 'BANK_ACCOUNT',
                            currency: payment.currency
                        }
                    },
                    update: {
                        balance: { increment: adjustment },
                        updatedAt: new Date()
                    },
                    create: {
                        accountId: payment.bankAccountId,
                        accountType: 'BANK_ACCOUNT',
                        currency: payment.currency,
                        balance: adjustment,
                        organizationId: existingBill.organizationId,
                        updatedAt: new Date()
                    }
                })
            }
        }

        // Eliminar movimientos de stock relacionados y revertir stock
        for (const stockMovement of existingBill.stockMovements) {
            // Revertir el movimiento de stock
            const isIncome = existingBill.type === 'PROVIDER'
            const quantityChange = isIncome
                ? new Decimal(stockMovement.quantity).neg() // Revertir ingreso
                : new Decimal(stockMovement.quantity) // Revertir egreso

            const existingStock = await prisma.stock.findUnique({
                where: {
                    materialId_warehouseId: {
                        materialId: stockMovement.materialId,
                        warehouseId: stockMovement.warehouseId
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
            }

            // También eliminar el movimiento de stock normal si existe
            const whereCondition: any = {
                materialId: stockMovement.materialId,
                quantity: stockMovement.quantity.toNumber(),
                reference: existingBill.number
            }

            // Para bills de proveedor (PROVIDER), el stock entra al almacén (toWarehouseId)
            // Para bills de cliente (CLIENT), el stock sale del almacén (fromWarehouseId)
            if (existingBill.type === 'PROVIDER') {
                whereCondition.toWarehouseId = stockMovement.warehouseId
            } else {
                whereCondition.fromWarehouseId = stockMovement.warehouseId
            }

            await prisma.stockMovement.deleteMany({
                where: whereCondition
            })
        }

        // Eliminar la factura (esto eliminará automáticamente rubros, pagos y movimientos por CASCADE)
        await prisma.bill.delete({
            where: { id: billId }
        })

        return NextResponse.json({ message: 'Bill deleted successfully' })

    } catch (error) {
        console.error('Error deleting bill:', error)
        return NextResponse.json({ error: 'Error deleting bill' }, { status: 500 })
    }
}

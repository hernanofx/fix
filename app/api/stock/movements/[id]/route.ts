import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { DecimalUtils } from '@/lib/decimal-utils'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        // Get user's organization
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { organization: true }
        })

        if (!user?.organization) {
            return NextResponse.json({ message: 'Organization not found' }, { status: 404 })
        }

        const movement = await prisma.stockMovement.findUnique({
            where: { id: params.id },
            include: {
                material: true,
                fromWarehouse: true,
                toWarehouse: true
            }
        })

        if (!movement || movement.organizationId !== user.organization.id) {
            return NextResponse.json({ message: 'Movement not found' }, { status: 404 })
        }

        return NextResponse.json(movement)
    } catch (error) {
        console.error('Error fetching stock movement:', error)
        return NextResponse.json(
            { message: 'Error fetching stock movement' },
            { status: 500 }
        )
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        // Get user's organization
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { organization: true }
        })

        if (!user?.organization) {
            return NextResponse.json({ message: 'Organization not found' }, { status: 404 })
        }

        const body = await request.json()
        const {
            type,
            materialId,
            fromWarehouseId,
            toWarehouseId,
            quantity,
            description,
            reference,
            costPrice,
            originType,
            originId,
            originName,
            destType,
            destId,
            destName
        } = body

        // Get the existing movement
        const existingMovement = await prisma.stockMovement.findUnique({
            where: { id: params.id },
            include: { material: true }
        })

        if (!existingMovement || existingMovement.organizationId !== user.organization.id) {
            return NextResponse.json({ message: 'Movement not found' }, { status: 404 })
        }

        // Use transaction to ensure data consistency
        const result = await prisma.$transaction(async (tx) => {
            // First, revert the old movement's stock changes
            if (existingMovement.type === 'ENTRADA') {
                const stock = await tx.stock.findUnique({
                    where: {
                        materialId_warehouseId: {
                            materialId: existingMovement.materialId,
                            warehouseId: existingMovement.toWarehouseId!
                        }
                    }
                })
                if (stock) {
                    await tx.stock.update({
                        where: { id: stock.id },
                        data: {
                            quantity: DecimalUtils.subtract(stock.quantity, existingMovement.quantity),
                            available: DecimalUtils.subtract(stock.available, existingMovement.quantity),
                            lastUpdated: new Date()
                        }
                    })
                }
            } else if (existingMovement.type === 'SALIDA') {
                const stock = await tx.stock.findUnique({
                    where: {
                        materialId_warehouseId: {
                            materialId: existingMovement.materialId,
                            warehouseId: existingMovement.fromWarehouseId!
                        }
                    }
                })
                if (stock) {
                    await tx.stock.update({
                        where: { id: stock.id },
                        data: {
                            quantity: DecimalUtils.add(stock.quantity, existingMovement.quantity),
                            available: DecimalUtils.add(stock.available, existingMovement.quantity),
                            lastUpdated: new Date()
                        }
                    })
                }
            } else if (existingMovement.type === 'TRANSFERENCIA') {
                // Revert source
                const sourceStock = await tx.stock.findUnique({
                    where: {
                        materialId_warehouseId: {
                            materialId: existingMovement.materialId,
                            warehouseId: existingMovement.fromWarehouseId!
                        }
                    }
                })
                if (sourceStock) {
                    await tx.stock.update({
                        where: { id: sourceStock.id },
                        data: {
                            quantity: DecimalUtils.add(sourceStock.quantity, existingMovement.quantity),
                            available: DecimalUtils.add(sourceStock.available, existingMovement.quantity),
                            lastUpdated: new Date()
                        }
                    })
                }
                // Revert destination
                const destStock = await tx.stock.findUnique({
                    where: {
                        materialId_warehouseId: {
                            materialId: existingMovement.materialId,
                            warehouseId: existingMovement.toWarehouseId!
                        }
                    }
                })
                if (destStock) {
                    await tx.stock.update({
                        where: { id: destStock.id },
                        data: {
                            quantity: DecimalUtils.subtract(destStock.quantity, existingMovement.quantity),
                            available: DecimalUtils.subtract(destStock.available, existingMovement.quantity),
                            lastUpdated: new Date()
                        }
                    })
                }
            }

            // Update the movement
            const updatedMovement = await tx.stockMovement.update({
                where: { id: params.id },
                data: {
                    type,
                    materialId,
                    fromWarehouseId,
                    toWarehouseId,
                    quantity,
                    description,
                    reference,
                    originType,
                    originId,
                    originName,
                    destType,
                    destId,
                    destName
                }
            })

            // Apply the new movement's stock changes
            if (type === 'ENTRADA') {
                let stock = await tx.stock.findUnique({
                    where: {
                        materialId_warehouseId: {
                            materialId,
                            warehouseId: toWarehouseId
                        }
                    }
                })

                if (stock) {
                    await tx.stock.update({
                        where: { id: stock.id },
                        data: {
                            quantity: DecimalUtils.add(stock.quantity, quantity),
                            available: DecimalUtils.add(stock.available, quantity),
                            lastUpdated: new Date()
                        }
                    })
                } else {
                    await tx.stock.create({
                        data: {
                            materialId,
                            warehouseId: toWarehouseId,
                            quantity: DecimalUtils.toDecimal(quantity),
                            available: DecimalUtils.toDecimal(quantity),
                            lastUpdated: new Date()
                        }
                    })
                }

                if (costPrice) {
                    await tx.material.update({
                        where: { id: materialId },
                        data: { costPrice }
                    })
                }
            } else if (type === 'SALIDA') {
                const stock = await tx.stock.findUnique({
                    where: {
                        materialId_warehouseId: {
                            materialId,
                            warehouseId: fromWarehouseId
                        }
                    }
                })

                if (!stock) {
                    throw new Error('Stock not found')
                }

                if (stock.available < quantity) {
                    throw new Error('Insufficient stock available')
                }

                await tx.stock.update({
                    where: { id: stock.id },
                    data: {
                        quantity: DecimalUtils.subtract(stock.quantity, quantity),
                        available: DecimalUtils.subtract(stock.available, quantity),
                        lastUpdated: new Date()
                    }
                })
            } else if (type === 'TRANSFERENCIA') {
                const sourceStock = await tx.stock.findUnique({
                    where: {
                        materialId_warehouseId: {
                            materialId,
                            warehouseId: fromWarehouseId
                        }
                    }
                })

                if (!sourceStock) {
                    throw new Error('Source stock not found')
                }

                if (sourceStock.available < quantity) {
                    throw new Error('Insufficient stock available for transfer')
                }

                await tx.stock.update({
                    where: { id: sourceStock.id },
                    data: {
                        quantity: DecimalUtils.subtract(sourceStock.quantity, quantity),
                        available: DecimalUtils.subtract(sourceStock.available, quantity),
                        lastUpdated: new Date()
                    }
                })

                let destStock = await tx.stock.findUnique({
                    where: {
                        materialId_warehouseId: {
                            materialId,
                            warehouseId: toWarehouseId
                        }
                    }
                })

                if (destStock) {
                    await tx.stock.update({
                        where: { id: destStock.id },
                        data: {
                            quantity: DecimalUtils.add(destStock.quantity, quantity),
                            available: DecimalUtils.add(destStock.available, quantity),
                            lastUpdated: new Date()
                        }
                    })
                } else {
                    await tx.stock.create({
                        data: {
                            materialId,
                            warehouseId: toWarehouseId,
                            quantity: DecimalUtils.toDecimal(quantity),
                            available: DecimalUtils.toDecimal(quantity),
                            lastUpdated: new Date()
                        }
                    })
                }
            }

            return updatedMovement
        })

        return NextResponse.json(result)
    } catch (error) {
        console.error('Error updating stock movement:', error)

        if (error instanceof Error) {
            if (error.message === 'Stock not found') {
                return NextResponse.json(
                    { message: 'No hay stock disponible para este material en el almacén seleccionado' },
                    { status: 400 }
                )
            }
            if (error.message === 'Insufficient stock available') {
                return NextResponse.json(
                    { message: 'Stock insuficiente para la cantidad solicitada' },
                    { status: 400 }
                )
            }
            if (error.message === 'Source stock not found') {
                return NextResponse.json(
                    { message: 'No hay stock disponible en el almacén de origen' },
                    { status: 400 }
                )
            }
            if (error.message === 'Insufficient stock available for transfer') {
                return NextResponse.json(
                    { message: 'Stock insuficiente en el almacén de origen para la transferencia' },
                    { status: 400 }
                )
            }
        }

        return NextResponse.json(
            { message: 'Error updating stock movement' },
            { status: 500 }
        )
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        // Get user's organization
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { organization: true }
        })

        if (!user?.organization) {
            return NextResponse.json({ message: 'Organization not found' }, { status: 404 })
        }

        // Get the movement to delete
        const movement = await prisma.stockMovement.findUnique({
            where: { id: params.id },
            include: { material: true }
        })

        if (!movement || movement.organizationId !== user.organization.id) {
            return NextResponse.json({ message: 'Movement not found' }, { status: 404 })
        }

        // Use transaction to revert stock changes and handle bill synchronization
        await prisma.$transaction(async (tx) => {
            // Check if this movement is related to a bill
            const relatedBillMovement = await tx.billStockMovement.findFirst({
                where: {
                    materialId: movement.materialId,
                    warehouseId: movement.toWarehouseId || movement.fromWarehouseId!,
                    quantity: movement.quantity
                },
                include: {
                    bill: true
                }
            })

            // Delete the movement
            await tx.stockMovement.delete({
                where: { id: params.id }
            })

            // Revert stock changes
            if (movement.type === 'ENTRADA') {
                const stock = await tx.stock.findUnique({
                    where: {
                        materialId_warehouseId: {
                            materialId: movement.materialId,
                            warehouseId: movement.toWarehouseId!
                        }
                    }
                })
                if (stock) {
                    await tx.stock.update({
                        where: { id: stock.id },
                        data: {
                            quantity: DecimalUtils.subtract(stock.quantity, movement.quantity),
                            available: DecimalUtils.subtract(stock.available, movement.quantity),
                            lastUpdated: new Date()
                        }
                    })
                }
            } else if (movement.type === 'SALIDA') {
                const stock = await tx.stock.findUnique({
                    where: {
                        materialId_warehouseId: {
                            materialId: movement.materialId,
                            warehouseId: movement.fromWarehouseId!
                        }
                    }
                })
                if (stock) {
                    await tx.stock.update({
                        where: { id: stock.id },
                        data: {
                            quantity: DecimalUtils.add(stock.quantity, movement.quantity),
                            available: DecimalUtils.add(stock.available, movement.quantity),
                            lastUpdated: new Date()
                        }
                    })
                }
            } else if (movement.type === 'TRANSFERENCIA') {
                // Revert source
                const sourceStock = await tx.stock.findUnique({
                    where: {
                        materialId_warehouseId: {
                            materialId: movement.materialId,
                            warehouseId: movement.fromWarehouseId!
                        }
                    }
                })
                if (sourceStock) {
                    await tx.stock.update({
                        where: { id: sourceStock.id },
                        data: {
                            quantity: DecimalUtils.add(sourceStock.quantity, movement.quantity),
                            available: DecimalUtils.add(sourceStock.available, movement.quantity),
                            lastUpdated: new Date()
                        }
                    })
                }
                // Revert destination
                const destStock = await tx.stock.findUnique({
                    where: {
                        materialId_warehouseId: {
                            materialId: movement.materialId,
                            warehouseId: movement.toWarehouseId!
                        }
                    }
                })
                if (destStock) {
                    await tx.stock.update({
                        where: { id: destStock.id },
                        data: {
                            quantity: DecimalUtils.subtract(destStock.quantity, movement.quantity),
                            available: DecimalUtils.subtract(destStock.available, movement.quantity),
                            lastUpdated: new Date()
                        }
                    })
                }
            }

            // If this movement was related to a bill, remove it from the bill
            if (relatedBillMovement) {
                await tx.billStockMovement.delete({
                    where: { id: relatedBillMovement.id }
                })
            }
        })

        return NextResponse.json({ message: 'Movement deleted successfully' })
    } catch (error) {
        console.error('Error deleting stock movement:', error)
        return NextResponse.json(
            { message: 'Error deleting stock movement' },
            { status: 500 }
        )
    }
}

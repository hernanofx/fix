import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { searchParams } = new URL(request.url)
        const organizationId = searchParams.get('organizationId')

        if (!organizationId) {
            return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
        }

        const purchaseOrder = await prisma.purchaseOrder.findFirst({
            where: {
                id: params.id,
                organizationId
            },
            include: {
                provider: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                items: {
                    include: {
                        material: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                                unit: true
                            }
                        },
                        rubro: {
                            select: {
                                id: true,
                                name: true,
                                code: true
                            }
                        }
                    }
                }
            }
        })

        if (!purchaseOrder) {
            return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
        }

        return NextResponse.json(purchaseOrder)
    } catch (error) {
        console.error('Error fetching purchase order:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json()
        const { description, providerId, deliveryDate, notes, status, items, organizationId } = body

        if (!organizationId) {
            return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
        }

        // First, delete existing items
        await prisma.purchaseOrderItem.deleteMany({
            where: { purchaseOrderId: params.id }
        })

        // Update the purchase order
        const purchaseOrder = await prisma.purchaseOrder.update({
            where: {
                id: params.id,
                organizationId
            },
            data: {
                description,
                providerId,
                deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
                notes,
                status: status || undefined,
                items: {
                    create: items?.map((item: any) => ({
                        materialId: item.materialId,
                        quantity: item.quantity,
                        unit: item.unit,
                        rubroId: item.rubroId,
                        notes: item.notes
                    })) || []
                }
            },
            include: {
                provider: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                items: {
                    include: {
                        material: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                                unit: true
                            }
                        },
                        rubro: {
                            select: {
                                id: true,
                                name: true,
                                code: true
                            }
                        }
                    }
                }
            }
        })

        return NextResponse.json(purchaseOrder)
    } catch (error) {
        console.error('Error updating purchase order:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { searchParams } = new URL(request.url)
        const organizationId = searchParams.get('organizationId')

        if (!organizationId) {
            return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
        }

        await prisma.purchaseOrder.delete({
            where: {
                id: params.id,
                organizationId
            }
        })

        return NextResponse.json({ message: 'Purchase order deleted successfully' })
    } catch (error) {
        console.error('Error deleting purchase order:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

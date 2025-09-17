import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const organizationId = searchParams.get('organizationId')

        if (!organizationId) {
            return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
        }

        const purchaseOrders = await prisma.purchaseOrder.findMany({
            where: { organizationId },
            include: {
                provider: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                project: {
                    select: {
                        id: true,
                        name: true,
                        code: true
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
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(purchaseOrders)
    } catch (error) {
        console.error('Error fetching purchase orders:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { description, providerId, deliveryDate, notes, items, organizationId, createdById, projectId } = body

        if (!items || items.length === 0 || !organizationId || !createdById) {
            return NextResponse.json({ error: 'Items, organizationId and createdById are required' }, { status: 400 })
        }

        // Generate order number
        const orderNumber = `PO-${Date.now()}`

        const purchaseOrder = await prisma.purchaseOrder.create({
            data: {
                number: orderNumber,
                description,
                providerId: providerId || null,
                projectId: projectId || null,
                deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
                notes,
                organizationId,
                createdById,
                items: {
                    create: items.map((item: any) => ({
                        materialId: item.materialId,
                        quantity: item.quantity,
                        unit: item.unit,
                        rubroId: item.rubroId,
                        notes: item.notes
                    }))
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
                project: {
                    select: {
                        id: true,
                        name: true,
                        code: true
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

        return NextResponse.json(purchaseOrder, { status: 201 })
    } catch (error) {
        console.error('Error creating purchase order:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

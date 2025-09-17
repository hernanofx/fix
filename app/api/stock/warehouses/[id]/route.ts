import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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

        const warehouse = await prisma.warehouse.findFirst({
            where: {
                id: params.id,
                organizationId: user.organization.id
            },
            include: {
                stocks: {
                    include: {
                        material: true
                    }
                }
            }
        })

        if (!warehouse) {
            return NextResponse.json({ message: 'Warehouse not found' }, { status: 404 })
        }

        return NextResponse.json(warehouse)
    } catch (error) {
        console.error('Error fetching warehouse:', error)
        return NextResponse.json(
            { message: 'Error fetching warehouse' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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
            name,
            code,
            address,
            description,
            isActive
        } = body

        // Check if warehouse exists and belongs to user's organization
        const existingWarehouse = await prisma.warehouse.findFirst({
            where: {
                id: params.id,
                organizationId: user.organization.id
            }
        })

        if (!existingWarehouse) {
            return NextResponse.json({ message: 'Warehouse not found' }, { status: 404 })
        }

        // Validate required fields
        if (!name) {
            return NextResponse.json(
                { message: 'Name is required' },
                { status: 400 }
            )
        }

        const warehouse = await prisma.warehouse.update({
            where: { id: params.id },
            data: {
                name,
                code: code || null,
                address: address || null,
                description: description || null,
                isActive: isActive !== undefined ? isActive : true
            },
            include: {
                stocks: {
                    include: {
                        material: true
                    }
                }
            }
        })

        return NextResponse.json(warehouse)
    } catch (error) {
        console.error('Error updating warehouse:', error)
        return NextResponse.json(
            { message: 'Error updating warehouse' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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

        // Check if warehouse exists and belongs to user's organization
        const existingWarehouse = await prisma.warehouse.findFirst({
            where: {
                id: params.id,
                organizationId: user.organization.id
            }
        })

        if (!existingWarehouse) {
            return NextResponse.json({ message: 'Warehouse not found' }, { status: 404 })
        }

        // Check if warehouse has stock
        const stocks = await prisma.stock.findMany({
            where: { warehouseId: params.id }
        })

        if (stocks.length > 0) {
            return NextResponse.json(
                { message: 'Cannot delete warehouse with existing stock' },
                { status: 400 }
            )
        }

        await prisma.warehouse.delete({
            where: { id: params.id }
        })

        return NextResponse.json({ message: 'Warehouse deleted successfully' })
    } catch (error) {
        console.error('Error deleting warehouse:', error)
        return NextResponse.json(
            { message: 'Error deleting warehouse' },
            { status: 500 }
        )
    }
}

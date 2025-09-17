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

        const material = await prisma.material.findFirst({
            where: {
                id: params.id,
                organizationId: user.organization.id
            },
            include: {
                rubro: true,
                stocks: {
                    include: {
                        warehouse: true
                    }
                }
            }
        })

        if (!material) {
            return NextResponse.json({ message: 'Material not found' }, { status: 404 })
        }

        return NextResponse.json(material)
    } catch (error) {
        console.error('Error fetching material:', error)
        return NextResponse.json(
            { message: 'Error fetching material' },
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
            unit,
            minStock,
            maxStock,
            costPrice,
            costCurrency,
            salePrice,
            saleCurrency,
            status,
            rubroId
        } = body

        // Check if material exists and belongs to user's organization
        const existingMaterial = await prisma.material.findFirst({
            where: {
                id: params.id,
                organizationId: user.organization.id
            }
        })

        if (!existingMaterial) {
            return NextResponse.json({ message: 'Material not found' }, { status: 404 })
        }

        // Validate required fields
        if (!name || !unit) {
            return NextResponse.json(
                { message: 'Name and unit are required' },
                { status: 400 }
            )
        }

        const material = await prisma.material.update({
            where: { id: params.id },
            data: {
                name,
                code: code || null,
                unit,
                minStock,
                maxStock,
                costPrice,
                costCurrency: costCurrency || 'PESOS',
                salePrice,
                saleCurrency: saleCurrency || 'PESOS',
                status: status || 'ACTIVE',
                rubroId
            },
            include: {
                rubro: true,
                stocks: {
                    include: {
                        warehouse: true
                    }
                }
            }
        })

        return NextResponse.json(material)
    } catch (error) {
        console.error('Error updating material:', error)
        return NextResponse.json(
            { message: 'Error updating material' },
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

        // Check if material exists and belongs to user's organization
        const existingMaterial = await prisma.material.findFirst({
            where: {
                id: params.id,
                organizationId: user.organization.id
            }
        })

        if (!existingMaterial) {
            return NextResponse.json({ message: 'Material not found' }, { status: 404 })
        }

        // Check if material has stock movements
        const stockMovements = await prisma.stockMovement.findMany({
            where: { materialId: params.id }
        })

        if (stockMovements.length > 0) {
            return NextResponse.json(
                { message: 'Cannot delete material with existing stock movements' },
                { status: 400 }
            )
        }

        await prisma.material.delete({
            where: { id: params.id }
        })

        return NextResponse.json({ message: 'Material deleted successfully' })
    } catch (error) {
        console.error('Error deleting material:', error)
        return NextResponse.json(
            { message: 'Error deleting material' },
            { status: 500 }
        )
    }
}

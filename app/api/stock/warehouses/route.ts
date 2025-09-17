import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { generateAutoCode } from '@/lib/utils/auto-code'

export async function GET(request: NextRequest) {
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

        const warehouses = await prisma.warehouse.findMany({
            where: {
                organizationId: user.organization.id
            },
            include: {
                stocks: {
                    include: {
                        material: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        })

        return NextResponse.json(warehouses)
    } catch (error) {
        console.error('Error fetching warehouses:', error)
        return NextResponse.json(
            { message: 'Error fetching warehouses' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
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

        // Validate required fields
        if (!name) {
            return NextResponse.json(
                { message: 'Name is required' },
                { status: 400 }
            )
        }

        // Generate auto code if not provided
        let finalCode = code
        if (!code) {
            finalCode = await generateAutoCode(user.organization.id, 'warehouse')
        }

        const warehouse = await prisma.warehouse.create({
            data: {
                name,
                code: finalCode,
                address: address || null,
                description: description || null,
                isActive: isActive !== undefined ? isActive : true,
                organizationId: user.organization.id,
                createdById: session.user.id
            },
            include: {
                stocks: {
                    include: {
                        material: true
                    }
                }
            }
        })

        return NextResponse.json(warehouse, { status: 201 })
    } catch (error) {
        console.error('Error creating warehouse:', error)
        return NextResponse.json(
            { message: 'Error creating warehouse' },
            { status: 500 }
        )
    }
}

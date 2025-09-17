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

        const materials = await prisma.material.findMany({
            where: {
                organizationId: user.organization.id
            },
            include: {
                rubro: true,
                stocks: {
                    include: {
                        warehouse: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        })

        return NextResponse.json(materials)
    } catch (error) {
        console.error('Error fetching materials:', error)
        return NextResponse.json(
            { message: 'Error fetching materials' },
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

        // Validate required fields
        if (!name || !unit) {
            return NextResponse.json(
                { message: 'Name and unit are required' },
                { status: 400 }
            )
        }

        // Generate auto code if not provided
        let finalCode = code
        if (!code) {
            finalCode = await generateAutoCode(user.organization.id, 'material')
        }

        const material = await prisma.material.create({
            data: {
                name,
                code: finalCode,
                unit,
                minStock,
                maxStock,
                costPrice,
                costCurrency: costCurrency || 'PESOS',
                salePrice,
                saleCurrency: saleCurrency || 'PESOS',
                status: status || 'ACTIVE',
                rubroId,
                organizationId: user.organization.id,
                createdById: session.user.id
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

        return NextResponse.json(material, { status: 201 })
    } catch (error) {
        console.error('Error creating material:', error)
        return NextResponse.json(
            { message: 'Error creating material' },
            { status: 500 }
        )
    }
}

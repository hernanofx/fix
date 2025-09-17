import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

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

        const stocks = await prisma.stock.findMany({
            where: {
                material: {
                    organizationId: user.organization.id
                }
            },
            include: {
                material: {
                    include: {
                        rubro: true
                    }
                },
                warehouse: true
            },
            orderBy: [
                { material: { name: 'asc' } },
                { warehouse: { name: 'asc' } }
            ]
        })

        return NextResponse.json(stocks)
    } catch (error) {
        console.error('Error fetching stocks:', error)
        return NextResponse.json(
            { message: 'Error fetching stocks' },
            { status: 500 }
        )
    }
}

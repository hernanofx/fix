import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const plans = await prisma.plan.findMany({
            where: { organizationId: session.user.organizationId },
            include: {
                project: true,
                createdBy: { select: { name: true, email: true } }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(plans)
    } catch (error) {
        console.error('Error fetching plans:', error)
        return NextResponse.json({ error: 'Error fetching plans' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id || !session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const plan = await prisma.plan.create({
            data: {
                ...body,
                organizationId: session.user.organizationId,
                createdById: session.user.id
            },
            include: {
                project: true,
                createdBy: { select: { name: true, email: true } }
            }
        })

        return NextResponse.json(plan, { status: 201 })
    } catch (error) {
        console.error('Error creating plan:', error)
        return NextResponse.json({ error: 'Error creating plan' }, { status: 500 })
    }
}

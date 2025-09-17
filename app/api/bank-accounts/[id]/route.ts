import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth/config'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const bankAccount = await prisma.bankAccount.findFirst({
            where: {
                id: params.id,
                organizationId: session.user.organizationId
            }
        })

        if (!bankAccount) {
            return NextResponse.json({ error: 'Bank account not found' }, { status: 404 })
        }

        return NextResponse.json(bankAccount)
    } catch (error) {
        console.error('Error fetching bank account:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { name, bankName, accountNumber, currency, description, isActive } = body

        const bankAccount = await prisma.bankAccount.updateMany({
            where: {
                id: params.id,
                organizationId: session.user.organizationId
            },
            data: {
                name,
                bankName,
                accountNumber,
                currency,
                description,
                isActive
            }
        })

        if (bankAccount.count === 0) {
            return NextResponse.json({ error: 'Bank account not found' }, { status: 404 })
        }

        const updatedAccount = await prisma.bankAccount.findUnique({
            where: { id: params.id }
        })

        return NextResponse.json(updatedAccount)
    } catch (error) {
        console.error('Error updating bank account:', error)
        return NextResponse.json({ error: 'Error updating bank account' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Soft delete - marcar como inactivo
        const bankAccount = await prisma.bankAccount.updateMany({
            where: {
                id: params.id,
                organizationId: session.user.organizationId
            },
            data: { isActive: false }
        })

        if (bankAccount.count === 0) {
            return NextResponse.json({ error: 'Bank account not found' }, { status: 404 })
        }

        return NextResponse.json({ message: 'Bank account deleted successfully' })
    } catch (error) {
        console.error('Error deleting bank account:', error)
        return NextResponse.json({ error: 'Error deleting bank account' }, { status: 500 })
    }
}

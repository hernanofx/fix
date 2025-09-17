import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await request.json()
        const { name, currency, description, isActive } = body

        const updateData: any = {
            name,
            currency,
            description,
            isActive
        }

        // Nota: Los balances ya no se actualizan directamente aquí.
        // Se calculan automáticamente desde las transacciones en AccountBalance.

        const cashBox = await prisma.cashBox.update({
            where: { id: params.id },
            data: updateData
        })

        return NextResponse.json(cashBox)
    } catch (error) {
        console.error('Error updating cash box:', error)
        return NextResponse.json({ error: 'Error updating cash box' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Soft delete - marcar como inactivo
        const cashBox = await prisma.cashBox.update({
            where: { id: params.id },
            data: { isActive: false }
        })

        return NextResponse.json(cashBox)
    } catch (error) {
        console.error('Error deleting cash box:', error)
        return NextResponse.json({ error: 'Error deleting cash box' }, { status: 500 })
    }
}

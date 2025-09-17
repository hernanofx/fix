import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params
        const budget = await prisma.budget.findUnique({
            where: { id },
            include: {
                createdBy: { select: { id: true, name: true } },
                project: { select: { id: true, name: true } },
                items: {
                    include: {
                        rubro: { select: { id: true, name: true } },
                        material: { select: { id: true, name: true, unit: true } }
                    }
                }
            }
        })
        if (!budget) return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
        const amount = Number(budget.totalAmount ?? 0)
        const spent = Number(budget.spent ?? 0)
        const remaining = amount - spent
        const progress = amount > 0 ? Math.round((spent / amount) * 100) : 0
        return NextResponse.json({ ...budget, remaining, progress })
    } catch (error) {
        console.error('Error fetching budget:', error)
        return NextResponse.json({ error: 'Error fetching budget' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params
        const body = await request.json()
        const { name, items = [], spent = 0, type, status, description, startDate, endDate, projectId } = body

        // Validate items
        let totalAmount = 0
        let itemsData: any = {}

        if (!Array.isArray(items) || items.length === 0) {
            // If no items provided, check if budget has existing amount
            const existingBudget = await prisma.budget.findUnique({ where: { id } })
            if (!existingBudget || !existingBudget.totalAmount) {
                return NextResponse.json({ error: 'At least one budget item is required' }, { status: 400 })
            }
            // Keep existing amount, don't modify items
            totalAmount = Number(existingBudget.totalAmount ?? 0)
            itemsData = {} // Don't modify items
        } else {
            // Calculate total amount from items
            for (const item of items) {
                const cost = Number(item.cost ?? 0)
                if (!Number.isFinite(cost) || cost < 0) {
                    return NextResponse.json({ error: 'Invalid cost in budget item' }, { status: 400 })
                }
                totalAmount += cost
            }

            // Validate items: rubro required, material optional
            for (const item of items) {
                if (!item.rubroId) {
                    return NextResponse.json({ error: 'Rubro is required for each budget item' }, { status: 400 })
                }
                const rubroExists = await prisma.rubro.findUnique({ where: { id: item.rubroId } })
                if (!rubroExists) {
                    return NextResponse.json({ error: 'Rubro not found' }, { status: 400 })
                }
                if (item.materialId) {
                    const materialExists = await prisma.material.findUnique({ where: { id: item.materialId } })
                    if (!materialExists) {
                        return NextResponse.json({ error: 'Material not found' }, { status: 400 })
                    }
                }
                const quantity = Number(item.quantity ?? 0)
                if (!Number.isFinite(quantity) || quantity <= 0) {
                    return NextResponse.json({ error: 'Invalid quantity in budget item' }, { status: 400 })
                }
            }

            itemsData = {
                deleteMany: {},
                create: items.map((item: any) => ({
                    quantity: Number(item.quantity),
                    currency: item.currency || 'PESOS',
                    cost: Number(item.cost),
                    index: item.index || null,
                    rubroId: item.rubroId,
                    materialId: item.materialId || null
                }))
            }
        }

        const spentNum = Number(spent ?? 0)
        if (!Number.isFinite(spentNum) || spentNum < 0) {
            return NextResponse.json({ error: 'Invalid spent value' }, { status: 400 })
        }

        const projectIdNorm = projectId ? String(projectId) : null

        // Update budget
        const updateData: any = {
            name: name ?? undefined,
            totalAmount,
            spent: spentNum,
            type: type ?? undefined,
            status: status ?? undefined,
            description: description ?? undefined,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            projectId: projectIdNorm
        }

        if (Object.keys(itemsData).length > 0) {
            updateData.items = itemsData
        }

        const updated = await prisma.budget.update({
            where: { id },
            data: updateData,
            include: {
                createdBy: { select: { id: true, name: true } },
                project: { select: { id: true, name: true } },
                items: {
                    include: {
                        rubro: { select: { id: true, name: true } },
                        material: { select: { id: true, name: true, unit: true } }
                    }
                }
            }
        })

        const amountFinal = Number(updated.totalAmount ?? 0)
        const spentFinal = Number(updated.spent ?? 0)
        const remaining = amountFinal - spentFinal
        const progress = amountFinal > 0 ? Math.round((spentFinal / amountFinal) * 100) : 0
        return NextResponse.json({ ...updated, remaining, progress })
    } catch (error) {
        console.error('Error updating budget:', error)
        return NextResponse.json({ error: 'Error updating budget' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params
        await prisma.budget.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting budget:', error)
        return NextResponse.json({ error: 'Error deleting budget' }, { status: 500 })
    }
}

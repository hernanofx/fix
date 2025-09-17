import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const apuPartida = await prisma.apuPartida.findUnique({
            where: { id: params.id },
            include: {
                createdBy: { select: { id: true, name: true, email: true } },
                budget: { select: { id: true, name: true } },
                materials: {
                    include: {
                        material: { select: { id: true, name: true, unit: true, costPrice: true } }
                    }
                },
                labors: {
                    include: {
                        rubro: { select: { id: true, name: true } }
                    }
                },
                equipments: true
            }
        })

        if (!apuPartida) {
            return NextResponse.json({ error: 'APU partida not found' }, { status: 404 })
        }

        return NextResponse.json(apuPartida)
    } catch (error) {
        console.error('Error fetching APU partida:', error)
        return NextResponse.json({ error: 'Error fetching APU partida' }, { status: 500 })
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json()
        const {
            code,
            name,
            description,
            unit,
            quantity,
            currency,
            status,
            overheadRate,
            profitRate,
            budgetId,
            materials = [],
            labors = [],
            equipments = []
        } = body

        // Validations
        if (!name || !unit || !quantity) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        if (budgetId) {
            const budget = await prisma.budget.findUnique({ where: { id: budgetId } })
            if (!budget) return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
        }

        // Check if partida exists
        const existingPartida = await prisma.apuPartida.findUnique({
            where: { id: params.id }
        })
        if (!existingPartida) {
            return NextResponse.json({ error: 'APU partida not found' }, { status: 404 })
        }

        // Calculate subtotals
        let materialsSubtotal = 0
        let laborSubtotal = 0
        let equipmentSubtotal = 0

        // Validate materials
        for (const mat of materials) {
            if (!mat.materialId || !mat.quantity || !mat.unitPrice) {
                return NextResponse.json({ error: 'Invalid material data' }, { status: 400 })
            }
            const material = await prisma.material.findUnique({ where: { id: mat.materialId } })
            if (!material) return NextResponse.json({ error: 'Material not found' }, { status: 400 })
            materialsSubtotal += Number(mat.quantity) * Number(mat.unitPrice)
        }

        // Validate labors
        for (const lab of labors) {
            if (!lab.rubroId || !lab.hours || !lab.hourlyRate) {
                return NextResponse.json({ error: 'Invalid labor data' }, { status: 400 })
            }
            const rubro = await prisma.rubro.findUnique({ where: { id: lab.rubroId } })
            if (!rubro) return NextResponse.json({ error: 'Rubro not found' }, { status: 400 })
            laborSubtotal += Number(lab.hours) * Number(lab.hourlyRate)
        }

        // Validate equipments
        for (const eq of equipments) {
            if (!eq.name || !eq.quantity || !eq.unitPrice) {
                return NextResponse.json({ error: 'Invalid equipment data' }, { status: 400 })
            }
            equipmentSubtotal += Number(eq.quantity) * Number(eq.unitPrice)
        }

        // Calculate totals
        const directCost = materialsSubtotal + laborSubtotal + equipmentSubtotal
        const overheadAmount = directCost * (Number(overheadRate || 0) / 100)
        const profitAmount = (directCost + overheadAmount) * (Number(profitRate || 0) / 100)
        const indirectCost = overheadAmount + profitAmount
        const unitCost = directCost + indirectCost
        const totalCost = unitCost * Number(quantity)

        // Update in transaction to handle related data
        const apuPartida = await prisma.$transaction(async (tx) => {
            // Delete existing related data
            await tx.apuMaterial.deleteMany({ where: { apuPartidaId: params.id } })
            await tx.apuLabor.deleteMany({ where: { apuPartidaId: params.id } })
            await tx.apuEquipment.deleteMany({ where: { apuPartidaId: params.id } })

            // Update main partida
            const updated = await tx.apuPartida.update({
                where: { id: params.id },
                data: {
                    code,
                    name,
                    description,
                    unit,
                    quantity: Number(quantity),
                    currency: currency || 'PESOS',
                    status: status || 'DRAFT',
                    materialsSubtotal,
                    laborSubtotal,
                    equipmentSubtotal,
                    overheadRate: Number(overheadRate || 0),
                    profitRate: Number(profitRate || 0),
                    directCost,
                    indirectCost,
                    unitCost,
                    totalCost,
                    budgetId
                }
            })

            // Create new related data
            if (materials.length > 0) {
                await tx.apuMaterial.createMany({
                    data: materials.map((mat: any) => ({
                        apuPartidaId: params.id,
                        materialId: mat.materialId,
                        quantity: Number(mat.quantity),
                        unitPrice: Number(mat.unitPrice),
                        currency: mat.currency || 'PESOS',
                        totalCost: Number(mat.quantity) * Number(mat.unitPrice)
                    }))
                })
            }

            if (labors.length > 0) {
                await tx.apuLabor.createMany({
                    data: labors.map((lab: any) => ({
                        apuPartidaId: params.id,
                        rubroId: lab.rubroId,
                        hours: Number(lab.hours),
                        hourlyRate: Number(lab.hourlyRate),
                        currency: lab.currency || 'PESOS',
                        totalCost: Number(lab.hours) * Number(lab.hourlyRate)
                    }))
                })
            }

            if (equipments.length > 0) {
                await tx.apuEquipment.createMany({
                    data: equipments.map((eq: any) => ({
                        apuPartidaId: params.id,
                        name: eq.name,
                        description: eq.description,
                        quantity: Number(eq.quantity),
                        unitPrice: Number(eq.unitPrice),
                        currency: eq.currency || 'PESOS',
                        totalCost: Number(eq.quantity) * Number(eq.unitPrice)
                    }))
                })
            }

            return updated
        })

        // Fetch updated data with relations
        const updatedPartida = await prisma.apuPartida.findUnique({
            where: { id: params.id },
            include: {
                createdBy: { select: { id: true, name: true } },
                budget: { select: { id: true, name: true } },
                materials: {
                    include: {
                        material: { select: { id: true, name: true, unit: true } }
                    }
                },
                labors: {
                    include: {
                        rubro: { select: { id: true, name: true } }
                    }
                },
                equipments: true
            }
        })

        return NextResponse.json(updatedPartida)
    } catch (error) {
        console.error('Error updating APU partida:', error)
        const message = (error as any)?.message || 'Error updating APU partida'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const existingPartida = await prisma.apuPartida.findUnique({
            where: { id: params.id }
        })

        if (!existingPartida) {
            return NextResponse.json({ error: 'APU partida not found' }, { status: 404 })
        }

        // Delete will cascade due to onDelete: Cascade in schema
        await prisma.apuPartida.delete({
            where: { id: params.id }
        })

        return NextResponse.json({ message: 'APU partida deleted successfully' })
    } catch (error) {
        console.error('Error deleting APU partida:', error)
        return NextResponse.json({ error: 'Error deleting APU partida' }, { status: 500 })
    }
}

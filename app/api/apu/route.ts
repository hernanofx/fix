import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notificationTrigger } from '@/lib/email/notificationTrigger'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const organizationId = searchParams.get('organizationId')
        const budgetId = searchParams.get('budgetId')
        const search = searchParams.get('search')

        if (!organizationId) {
            return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
        }

        const where: any = { organizationId }

        if (budgetId) {
            where.budgetId = budgetId
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } }
            ]
        }

        const apuPartidas = await prisma.apuPartida.findMany({
            where,
            include: {
                createdBy: { select: { id: true, name: true, email: true } },
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
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(apuPartidas)
    } catch (error) {
        console.error('Error fetching APU partidas:', error)
        return NextResponse.json({ error: 'Error fetching APU partidas' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            code,
            name,
            description,
            unit,
            quantity,
            currency,
            overheadRate,
            profitRate,
            budgetId,
            materials = [],
            labors = [],
            equipments = [],
            organizationId,
            createdById
        } = body

        // Validations
        if (!name || !unit || !quantity || !organizationId || !createdById) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const organization = await prisma.organization.findUnique({ where: { id: organizationId } })
        if (!organization) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

        const createdBy = await prisma.user.findUnique({ where: { id: createdById } })
        if (!createdBy) return NextResponse.json({ error: 'Created by user not found' }, { status: 404 })

        if (budgetId) {
            const budget = await prisma.budget.findUnique({ where: { id: budgetId } })
            if (!budget) return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
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

        const apuPartida = await prisma.apuPartida.create({
            data: {
                code,
                name,
                description,
                unit,
                quantity: Number(quantity),
                currency: currency || 'PESOS',
                materialsSubtotal,
                laborSubtotal,
                equipmentSubtotal,
                overheadRate: Number(overheadRate || 0),
                profitRate: Number(profitRate || 0),
                directCost,
                indirectCost,
                unitCost,
                totalCost,
                budgetId,
                organizationId,
                createdById,
                materials: {
                    create: materials.map((mat: any) => ({
                        materialId: mat.materialId,
                        quantity: Number(mat.quantity),
                        unitPrice: Number(mat.unitPrice),
                        currency: mat.currency || 'PESOS',
                        totalCost: Number(mat.quantity) * Number(mat.unitPrice)
                    }))
                },
                labors: {
                    create: labors.map((lab: any) => ({
                        rubroId: lab.rubroId,
                        hours: Number(lab.hours),
                        hourlyRate: Number(lab.hourlyRate),
                        currency: lab.currency || 'PESOS',
                        totalCost: Number(lab.hours) * Number(lab.hourlyRate)
                    }))
                },
                equipments: {
                    create: equipments.map((eq: any) => ({
                        name: eq.name,
                        description: eq.description,
                        quantity: Number(eq.quantity),
                        unitPrice: Number(eq.unitPrice),
                        currency: eq.currency || 'PESOS',
                        totalCost: Number(eq.quantity) * Number(eq.unitPrice)
                    }))
                }
            },
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

        // TODO: Add notification trigger for APU creation if needed

        return NextResponse.json(apuPartida, { status: 201 })
    } catch (error) {
        console.error('Error creating APU partida:', error)
        const message = (error as any)?.message || 'Error creating APU partida'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

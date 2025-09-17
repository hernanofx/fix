import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notificationTrigger } from '@/lib/email/notificationTrigger'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const organizationId = searchParams.get('organizationId')

        if (!organizationId) {
            return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
        }

        const budgets = await prisma.budget.findMany({
            where: { organizationId },
            include: {
                createdBy: { select: { id: true, name: true, email: true } },
                project: { select: { id: true, name: true } },
                items: {
                    include: {
                        rubro: { select: { id: true, name: true } },
                        material: { select: { id: true, name: true, unit: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        // compute remaining and progress for each budget to simplify client logic
        const mapped = budgets.map(b => {
            const amount = Number(b.totalAmount ?? 0)
            const spent = Number(b.spent ?? 0)
            const remaining = amount - spent
            const progress = amount > 0 ? Math.round((spent / amount) * 100) : 0
            return { ...b, remaining, progress }
        })

        return NextResponse.json(mapped)
    } catch (error) {
        console.error('Error fetching budgets:', error)
        return NextResponse.json({ error: 'Error fetching budgets' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { projectId, name, items = [], spent = 0, type = 'PROJECT', status = 'ACTIVE', description, startDate, endDate, organizationId, createdById } = body

        // Helper to resolve enums that may come as localized/display strings
        const resolveEnum = (input: any, allowed: string[], translations: Record<string, string> = {}) => {
            if (!input && input !== 0) return null
            const raw = String(input)
            // direct match
            if (allowed.includes(raw)) return raw
            const lower = raw.toLowerCase()
            // check translations map
            if (translations[lower]) return translations[lower]
            // try to match by normalizing common accented characters and spaces (e.g., "Planificación" -> "PLANNING")
            const normalized = lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            for (const a of allowed) {
                if (a.toLowerCase() === normalized) return a
            }
            return null
        }

        const organization = await prisma.organization.findUnique({ where: { id: organizationId } })
        if (!organization) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

        const createdBy = await prisma.user.findUnique({ where: { id: createdById } })
        if (!createdBy) return NextResponse.json({ error: 'Created by user not found' }, { status: 404 })

        // Validate items
        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'At least one budget item is required' }, { status: 400 })
        }

        // Calculate total amount from items
        let totalAmount = 0
        for (const item of items) {
            const cost = Number(item.cost ?? 0)
            if (!Number.isFinite(cost) || cost < 0) {
                return NextResponse.json({ error: 'Invalid cost in budget item' }, { status: 400 })
            }
            totalAmount += cost
        }

        const spentNum = Number(spent ?? 0)
        if (!Number.isFinite(spentNum) || spentNum < 0) {
            return NextResponse.json({ error: 'Invalid spent value' }, { status: 400 })
        }

        // Normalize status and type to allowed enums
        const allowedStatuses = ['ACTIVE', 'COMPLETED', 'CANCELLED', 'ON_HOLD']
        const statusTranslations: Record<string, string> = {
            'activo': 'ACTIVE',
            'completado': 'COMPLETED',
            'cancelado': 'CANCELLED',
            'en espera': 'ON_HOLD',
            'on hold': 'ON_HOLD',
            'planificacion': 'ACTIVE',
            'planificación': 'ACTIVE'
        }
        const resolvedStatus = resolveEnum(status, allowedStatuses, statusTranslations) || 'ACTIVE'

        const allowedTypes = ['PROJECT', 'DEPARTMENT', 'GENERAL']
        const typeTranslations: Record<string, string> = {
            'proyecto': 'PROJECT',
            'departamento': 'DEPARTMENT',
            'general': 'GENERAL'
        }
        const resolvedType = resolveEnum(type, allowedTypes, typeTranslations) || 'PROJECT'

        // Normalize projectId
        const projectIdNormalized = projectId ? String(projectId) : null
        if (projectIdNormalized) {
            const projectExists = await prisma.project.findUnique({ where: { id: projectIdNormalized } })
            if (!projectExists) {
                return NextResponse.json({ error: 'Project not found' }, { status: 404 })
            }
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

        const budget = await prisma.budget.create({
            data: {
                name: name || `Budget ${Date.now()}`,
                description,
                type: resolvedType as any,
                totalAmount,
                spent: spentNum,
                status: resolvedStatus as any,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                projectId: projectIdNormalized,
                organizationId,
                createdById,
                items: {
                    create: items.map((item: any) => ({
                        quantity: Number(item.quantity),
                        currency: item.currency || 'PESOS',
                        cost: Number(item.cost),
                        index: item.index || null,
                        rubroId: item.rubroId,
                        materialId: item.materialId || null
                    }))
                }
            },
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

        // 🚀 Disparar notificación de presupuesto creado
        try {
            await notificationTrigger.onBudgetCreated({
                ...budget,
                organizationId
            });
            console.log('Budget creation notification sent');
        } catch (notificationError) {
            console.error('Error sending budget notification:', notificationError);
        }

        return NextResponse.json(budget, { status: 201 })
    } catch (error) {
        console.error('Error creating budget:', error)
        // Return the original message when possible to aid debugging (still avoid leaking stack)
        const message = (error as any)?.message || 'Error creating budget'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

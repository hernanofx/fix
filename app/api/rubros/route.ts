import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const type = searchParams.get('type')

        const where: any = {
            organizationId: session.user.organizationId
        }

        if (status && status !== 'ALL') {
            where.status = status
        }

        if (type && type !== 'ALL') {
            where.type = type
        }

        const rubros = await prisma.rubro.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                createdBy: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        })

        return NextResponse.json(rubros)
    } catch (error) {
        console.error('Error fetching rubros:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id || !session?.user?.organizationId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { name, description, code, color, type } = body

        if (!name) {
            return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
        }

        // If no code provided, auto-assign a sequential numeric code based on the
        // last created rubro in this organization. Note: `code` is globally unique in
        // the schema, so we make sure the chosen value doesn't conflict globally.
        let assignedCode = code

        if (!assignedCode) {
            // Find last rubro in this organization that has a code
            const last = await prisma.rubro.findFirst({
                where: {
                    organizationId: session.user.organizationId,
                    code: { not: null }
                },
                orderBy: { createdAt: 'desc' }
            })

            let base = 0
            if (last?.code) {
                const n = parseInt(last.code, 10)
                if (!Number.isNaN(n)) base = n
            }

            let next = base + 1
            // Ensure global uniqueness (schema-level unique constraint on `code`)
            // If a conflict exists, increment until we find a free numeric code.
            // This may skip numbers if other orgs already used some values.
            // In future we could change the schema to make (organizationId, code)
            // the unique key so codes can repeat across organizations.
            while (true) {
                const exists = await prisma.rubro.findUnique({ where: { code: String(next) } })
                if (!exists) break
                next++
            }
            assignedCode = String(next)
        } else {
            // If user provided a code, ensure no global conflict
            const existingRubro = await prisma.rubro.findUnique({ where: { code: assignedCode } })
            if (existingRubro) {
                return NextResponse.json({ error: 'Ya existe un rubro con este código' }, { status: 400 })
            }
        }

        const rubro = await prisma.rubro.create({
            data: {
                name,
                description,
                code: assignedCode,
                color,
                type: type || 'PROVIDER', // Default to PROVIDER if not specified
                organizationId: session.user.organizationId,
                createdById: session.user.id
            },
            include: {
                createdBy: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        })

        return NextResponse.json(rubro, { status: 201 })
    } catch (error) {
        console.error('Error creating rubro:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}

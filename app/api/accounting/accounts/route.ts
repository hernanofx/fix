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
        const organizationId = session.user.organizationId

        // Verificar que la organización tiene contabilidad habilitada
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: { enableAccounting: true }
        })

        if (!organization?.enableAccounting) {
            return NextResponse.json({ error: 'Contabilidad no habilitada' }, { status: 403 })
        }

        // Filtros opcionales
        const type = searchParams.get('type')
        const isActive = searchParams.get('isActive')
        const includeChildren = searchParams.get('includeChildren') === 'true'

        const whereClause: any = { organizationId }

        if (type) whereClause.type = type
        if (isActive !== null) whereClause.isActive = isActive === 'true'

        const accounts = await prisma.account.findMany({
            where: whereClause,
            include: {
                parent: true,
                children: includeChildren
            },
            orderBy: { code: 'asc' }
        })

        return NextResponse.json(accounts)
    } catch (error) {
        console.error('Error fetching accounts:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const organizationId = session.user.organizationId

        // Verificar que la organización tiene contabilidad habilitada
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: { enableAccounting: true }
        })

        if (!organization?.enableAccounting) {
            return NextResponse.json({ error: 'Contabilidad no habilitada' }, { status: 403 })
        }

        const data = await request.json()
        const { code, name, type, subType, parentId, currency, description } = data

        // Validar que el código no exista
        const existingAccount = await prisma.account.findFirst({
            where: { organizationId, code }
        })

        if (existingAccount) {
            return NextResponse.json({ error: 'Ya existe una cuenta con ese código' }, { status: 400 })
        }

        // Validar cuenta padre si se especifica
        if (parentId) {
            const parentAccount = await prisma.account.findFirst({
                where: { id: parentId, organizationId }
            })

            if (!parentAccount) {
                return NextResponse.json({ error: 'Cuenta padre no encontrada' }, { status: 400 })
            }
        }

        const account = await prisma.account.create({
            data: {
                code,
                name,
                type,
                subType,
                parentId,
                currency: currency || 'PESOS',
                description,
                organizationId,
                isActive: true
            },
            include: {
                parent: true,
                children: true
            }
        })

        return NextResponse.json(account, { status: 201 })
    } catch (error) {
        console.error('Error creating account:', error)
        return NextResponse.json({ error: 'Error creando cuenta' }, { status: 500 })
    }
}
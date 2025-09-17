import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const organizationId = session.user.organizationId
        const accountId = params.id

        // Verificar que la organización tiene contabilidad habilitada
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: { enableAccounting: true }
        })

        if (!organization?.enableAccounting) {
            return NextResponse.json({ error: 'Contabilidad no habilitada' }, { status: 403 })
        }

        // Obtener la cuenta
        const account = await prisma.account.findFirst({
            where: { id: accountId, organizationId },
            include: {
                parent: true,
                children: true
            }
        })

        if (!account) {
            return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 })
        }

        return NextResponse.json(account)
    } catch (error) {
        console.error('Error fetching account:', error)
        return NextResponse.json({ error: 'Error obteniendo cuenta' }, { status: 500 })
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const organizationId = session.user.organizationId
        const accountId = params.id

        // Verificar que la organización tiene contabilidad habilitada
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: { enableAccounting: true }
        })

        if (!organization?.enableAccounting) {
            return NextResponse.json({ error: 'Contabilidad no habilitada' }, { status: 403 })
        }

        // Verificar que la cuenta pertenece a la organización
        const existingAccount = await prisma.account.findFirst({
            where: { id: accountId, organizationId }
        })

        if (!existingAccount) {
            return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 })
        }

        const data = await request.json()
        const { code, name, type, subType, parentId, currency, description, isActive } = data

        // Validar que el código no exista en otra cuenta
        if (code !== existingAccount.code) {
            const codeExists = await prisma.account.findFirst({
                where: { organizationId, code, id: { not: accountId } }
            })

            if (codeExists) {
                return NextResponse.json({ error: 'Ya existe una cuenta con ese código' }, { status: 400 })
            }
        }

        // Validar cuenta padre si se especifica
        if (parentId) {
            const parentAccount = await prisma.account.findFirst({
                where: { id: parentId, organizationId }
            })

            if (!parentAccount) {
                return NextResponse.json({ error: 'Cuenta padre no encontrada' }, { status: 400 })
            }

            // Evitar referencias circulares
            if (parentId === accountId) {
                return NextResponse.json({ error: 'Una cuenta no puede ser padre de sí misma' }, { status: 400 })
            }
        }

        const updatedAccount = await prisma.account.update({
            where: { id: accountId },
            data: {
                code,
                name,
                type,
                subType,
                parentId,
                currency: currency || 'PESOS',
                description,
                isActive
            },
            include: {
                parent: true,
                children: true
            }
        })

        return NextResponse.json(updatedAccount)
    } catch (error) {
        console.error('Error updating account:', error)
        return NextResponse.json({ error: 'Error actualizando cuenta' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const organizationId = session.user.organizationId
        const accountId = params.id

        // Verificar que la organización tiene contabilidad habilitada
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: { enableAccounting: true }
        })

        if (!organization?.enableAccounting) {
            return NextResponse.json({ error: 'Contabilidad no habilitada' }, { status: 403 })
        }

        // Verificar que la cuenta pertenece a la organización
        const existingAccount = await prisma.account.findFirst({
            where: { id: accountId, organizationId }
        })

        if (!existingAccount) {
            return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 })
        }

        // Verificar que no tenga hijos
        const hasChildren = await prisma.account.findFirst({
            where: { parentId: accountId, organizationId }
        })

        if (hasChildren) {
            return NextResponse.json({ error: 'No se puede eliminar una cuenta que tiene subcuentas' }, { status: 400 })
        }

        // Verificar que no tenga movimientos
        const hasDebitEntries = await prisma.journalEntry.findFirst({
            where: { debitAccountId: accountId, organizationId }
        })

        const hasCreditEntries = await prisma.journalEntry.findFirst({
            where: { creditAccountId: accountId, organizationId }
        })

        if (hasDebitEntries || hasCreditEntries) {
            return NextResponse.json({ error: 'No se puede eliminar una cuenta que tiene movimientos contables' }, { status: 400 })
        }

        await prisma.account.delete({
            where: { id: accountId }
        })

        return NextResponse.json({ message: 'Cuenta eliminada exitosamente' })
    } catch (error) {
        console.error('Error deleting account:', error)
        return NextResponse.json({ error: 'Error eliminando cuenta' }, { status: 500 })
    }
}
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

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
        const entryId = params.id

        // Verificar que la organización tiene contabilidad habilitada
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: { enableAccounting: true }
        })

        if (!organization?.enableAccounting) {
            return NextResponse.json({ error: 'Contabilidad no habilitada' }, { status: 403 })
        }

        // Verificar que el asiento existe y pertenece a la organización
        const entry = await prisma.journalEntry.findFirst({
            where: {
                id: entryId,
                organizationId
            },
            select: {
                id: true,
                entryNumber: true,
                isAutomatic: true,
                sourceType: true,
                sourceId: true
            }
        })

        if (!entry) {
            return NextResponse.json({ error: 'Asiento no encontrado' }, { status: 404 })
        }

        // Si es un asiento automático, solo eliminar este asiento específico
        if (entry.isAutomatic) {
            await prisma.journalEntry.delete({
                where: { id: entryId }
            })

            return NextResponse.json({
                message: `Asiento automático ${entry.entryNumber} eliminado exitosamente`
            })
        }

        // Para asientos manuales, eliminar todas las líneas del mismo asiento
        const entryNumber = entry.entryNumber

        // Eliminar todas las líneas del asiento en una transacción
        await prisma.$transaction(async (tx) => {
            await tx.journalEntry.deleteMany({
                where: {
                    entryNumber,
                    organizationId
                }
            })
        })

        return NextResponse.json({
            message: `Asiento ${entryNumber} eliminado exitosamente`
        })

    } catch (error) {
        console.error('Error deleting journal entry:', error)
        return NextResponse.json({ error: 'Error eliminando asiento contable' }, { status: 500 })
    }
}
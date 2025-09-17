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

        const rubro = await prisma.rubro.findFirst({
            where: {
                id: params.id,
                organizationId: session.user.organizationId
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

        if (!rubro) {
            return NextResponse.json({ error: 'Rubro no encontrado' }, { status: 404 })
        }

        return NextResponse.json(rubro)
    } catch (error) {
        console.error('Error fetching rubro:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
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

        const body = await request.json()
        const { name, description, code, color, status, type } = body

        if (!name) {
            return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
        }

        // Verificar que el rubro existe y pertenece a la organización
        const existingRubro = await prisma.rubro.findFirst({
            where: {
                id: params.id,
                organizationId: session.user.organizationId
            }
        })

        if (!existingRubro) {
            return NextResponse.json({ error: 'Rubro no encontrado' }, { status: 404 })
        }

        // Verificar si ya existe otro rubro con el mismo código
        if (code && code !== existingRubro.code) {
            const codeExists = await prisma.rubro.findFirst({
                where: {
                    code,
                    organizationId: session.user.organizationId,
                    id: { not: params.id }
                }
            })

            if (codeExists) {
                return NextResponse.json({ error: 'Ya existe un rubro con este código' }, { status: 400 })
            }
        }

        const updatedRubro = await prisma.rubro.update({
            where: { id: params.id },
            data: {
                name,
                description,
                code,
                color,
                status,
                type
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

        return NextResponse.json(updatedRubro)
    } catch (error) {
        console.error('Error updating rubro:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
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

        // Verificar que el rubro existe y pertenece a la organización
        const existingRubro = await prisma.rubro.findFirst({
            where: {
                id: params.id,
                organizationId: session.user.organizationId
            }
        })

        if (!existingRubro) {
            return NextResponse.json({ error: 'Rubro no encontrado' }, { status: 404 })
        }

        await prisma.rubro.delete({
            where: { id: params.id }
        })

        return NextResponse.json({ message: 'Rubro eliminado correctamente' })
    } catch (error) {
        console.error('Error deleting rubro:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}

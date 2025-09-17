import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId') || session.user.organizationId

    // Parámetros de filtrado y ordenamiento
    const sortField = searchParams.get('sortField') || 'createdAt'
    const sortDirection = searchParams.get('sortDirection') || 'desc'
    const type = searchParams.get('type')
    const typeFilter = searchParams.get('typeFilter')
    const entityFilter = searchParams.get('entityFilter')
    const statusFilter = searchParams.get('statusFilter')
    const clientId = searchParams.get('clientId')
    const searchTerm = searchParams.get('searchTerm')

    // Construir where clause
    const where: any = { organizationId }

    // Filtrar por tipo (INCOME o EXPENSE)
    if (type) {
        where.type = type
    } else if (typeFilter && typeFilter !== 'all') {
        where.type = typeFilter
    }

    if (entityFilter && entityFilter !== 'all') {
        where.entityType = entityFilter
    }

    if (statusFilter && statusFilter !== 'all') {
        where.status = statusFilter
    }

    // Filtrar por cliente específico
    if (clientId) {
        where.clientId = clientId
    }

    if (searchTerm && searchTerm.trim()) {
        where.OR = [
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { client: { name: { contains: searchTerm, mode: 'insensitive' } } },
            { provider: { name: { contains: searchTerm, mode: 'insensitive' } } },
            { project: { name: { contains: searchTerm, mode: 'insensitive' } } }
        ]
    }

    // Construir orderBy
    const orderBy: any = {}
    orderBy[sortField] = sortDirection

    const paymentTerms = await prisma.paymentTerm.findMany({
        where,
        include: {
            client: true,
            provider: true,
            project: true,
            payments: true
        },
        orderBy
    })

    return NextResponse.json(paymentTerms)
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await request.json()
    console.log('Datos recibidos:', data)
    console.log('Organization ID de sesión:', session.user.organizationId)

    // Validar que los datos requeridos estén presentes
    if (!data.entityId || !data.entityType) {
        return NextResponse.json({ error: 'entityId y entityType son requeridos' }, { status: 400 })
    }

    // Validar que la entidad existe y pertenece a la organización
    let entityExists = false
    if (data.entityType === 'CLIENT') {
        const client = await prisma.client.findFirst({
            where: {
                id: data.entityId,
                organizationId: session.user.organizationId
            }
        })
        console.log('Cliente encontrado:', client)
        entityExists = !!client
    } else if (data.entityType === 'PROVIDER') {
        const provider = await prisma.provider.findFirst({
            where: {
                id: data.entityId,
                organizationId: session.user.organizationId
            }
        })
        console.log('Proveedor encontrado:', provider)
        entityExists = !!provider
    }

    console.log('¿Entidad existe?', entityExists)

    if (!entityExists) {
        return NextResponse.json({
            error: `El ${data.entityType === 'CLIENT' ? 'cliente' : 'proveedor'} seleccionado no existe o no pertenece a tu organización`
        }, { status: 400 })
    }

    // Validar que el proyecto pertenece a la organización si se especifica
    if (data.projectId && data.projectId !== 'none') {
        const project = await prisma.project.findFirst({
            where: {
                id: data.projectId,
                organizationId: session.user.organizationId
            }
        })
        if (!project) {
            return NextResponse.json({
                error: 'El proyecto seleccionado no existe o no pertenece a tu organización'
            }, { status: 400 })
        }
    }

    // Preparar datos para la creación
    const paymentTermData = {
        organizationId: session.user.organizationId,
        type: data.type,
        entityType: data.entityType,
        clientId: data.entityType === 'CLIENT' ? data.entityId : null,
        providerId: data.entityType === 'PROVIDER' ? data.entityId : null,
        projectId: data.projectId === 'none' ? null : data.projectId,
        amount: data.amount,
        currency: data.currency,
        startDate: data.startDate,
        recurrence: data.recurrence,
        periods: data.periods,
        status: data.status || 'ACTIVE',
        description: data.description
    }

    console.log('Datos preparados para crear:', paymentTermData)

    const paymentTerm = await prisma.paymentTerm.create({
        data: paymentTermData,
        include: {
            client: true,
            provider: true,
            project: true
        }
    })

    return NextResponse.json(paymentTerm)
}

export async function PUT(request: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await request.json()
    const { id, ...updateData } = data

    // Validar que el término de pago existe y pertenece a la organización
    const existingTerm = await prisma.paymentTerm.findFirst({
        where: {
            id,
            organizationId: session.user.organizationId
        }
    })

    if (!existingTerm) {
        return NextResponse.json({ error: 'Término de pago no encontrado' }, { status: 404 })
    }

    // Validar que la entidad existe y pertenece a la organización si se está actualizando
    if (updateData.entityId && updateData.entityType) {
        let entityExists = false
        if (updateData.entityType === 'CLIENT') {
            const client = await prisma.client.findFirst({
                where: {
                    id: updateData.entityId,
                    organizationId: session.user.organizationId
                }
            })
            entityExists = !!client
        } else if (updateData.entityType === 'PROVIDER') {
            const provider = await prisma.provider.findFirst({
                where: {
                    id: updateData.entityId,
                    organizationId: session.user.organizationId
                }
            })
            entityExists = !!provider
        }

        if (!entityExists) {
            return NextResponse.json({
                error: `El ${updateData.entityType === 'CLIENT' ? 'cliente' : 'proveedor'} seleccionado no existe o no pertenece a tu organización`
            }, { status: 400 })
        }
    }

    // Validar que el proyecto pertenece a la organización si se especifica
    if (updateData.projectId && updateData.projectId !== 'none') {
        const project = await prisma.project.findFirst({
            where: {
                id: updateData.projectId,
                organizationId: session.user.organizationId
            }
        })
        if (!project) {
            return NextResponse.json({
                error: 'El proyecto seleccionado no existe o no pertenece a tu organización'
            }, { status: 400 })
        }
    }

    // Preparar datos para la actualización
    const paymentTermData: any = {}

    if (updateData.type) paymentTermData.type = updateData.type
    if (updateData.entityType) paymentTermData.entityType = updateData.entityType
    if (updateData.amount !== undefined) paymentTermData.amount = updateData.amount
    if (updateData.currency) paymentTermData.currency = updateData.currency
    if (updateData.startDate) paymentTermData.startDate = updateData.startDate
    if (updateData.recurrence) paymentTermData.recurrence = updateData.recurrence
    if (updateData.periods !== undefined) paymentTermData.periods = updateData.periods
    if (updateData.status) paymentTermData.status = updateData.status
    if (updateData.description !== undefined) paymentTermData.description = updateData.description

    // Manejar cambios de entidad
    if (updateData.entityId && updateData.entityType) {
        if (updateData.entityType === 'CLIENT') {
            paymentTermData.clientId = updateData.entityId
            paymentTermData.providerId = null
        } else if (updateData.entityType === 'PROVIDER') {
            paymentTermData.providerId = updateData.entityId
            paymentTermData.clientId = null
        }
    }

    // Manejar proyecto
    if (updateData.projectId !== undefined) {
        paymentTermData.projectId = updateData.projectId === 'none' ? null : updateData.projectId
    }

    const paymentTerm = await prisma.paymentTerm.update({
        where: { id },
        data: paymentTermData,
        include: {
            client: true,
            provider: true,
            project: true
        }
    })

    return NextResponse.json(paymentTerm)
}

export async function DELETE(request: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await prisma.paymentTerm.delete({
        where: { id }
    })

    return NextResponse.json({ success: true })
}

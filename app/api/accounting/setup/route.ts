import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { StandardChartService } from '@/lib/accounting/standard-chart'

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { organizationId } = body

        // Verificar que el usuario tiene permisos sobre esta organización
        if (organizationId !== session.user.organizationId) {
            return NextResponse.json({ error: 'No autorizado para esta organización' }, { status: 403 })
        }

        // Verificar que la organización existe
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId }
        })

        if (!organization) {
            return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 })
        }

        // Verificar si ya tiene plan de cuentas
        const hasChart = await StandardChartService.hasStandardChart(organizationId)
        if (hasChart) {
            return NextResponse.json({
                message: 'La organización ya tiene un plan de cuentas configurado',
                accountsCount: await prisma.account.count({ where: { organizationId } })
            })
        }

        // Habilitar contabilidad y crear plan de cuentas
        await prisma.organization.update({
            where: { id: organizationId },
            data: { enableAccounting: true }
        })

        // Crear plan de cuentas estándar
        const accountsMap = await StandardChartService.setupStandardChart(organizationId)

        return NextResponse.json({
            message: 'Módulo de contabilidad configurado exitosamente',
            accountsCreated: accountsMap.size,
            organizationId
        }, { status: 201 })

    } catch (error) {
        console.error('Error setting up accounting:', error)
        return NextResponse.json({ error: 'Error configurando contabilidad' }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const organizationId = session.user.organizationId

        // Obtener estado de la contabilidad
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: { enableAccounting: true }
        })

        if (!organization) {
            return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 })
        }

        const isEnabled = organization.enableAccounting
        let stats = null

        if (isEnabled) {
            stats = await StandardChartService.getChartStats(organizationId)
        }

        return NextResponse.json({
            isEnabled,
            stats
        })

    } catch (error) {
        console.error('Error fetching accounting setup:', error)
        return NextResponse.json({ error: 'Error obteniendo configuración' }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { enableAccounting } = body
        const organizationId = session.user.organizationId

        // Actualizar configuración
        const organization = await prisma.organization.update({
            where: { id: organizationId },
            data: { enableAccounting }
        })

        // Si se está habilitando y no tiene plan de cuentas, crearlo
        if (enableAccounting) {
            const hasChart = await StandardChartService.hasStandardChart(organizationId)
            if (!hasChart) {
                await StandardChartService.setupStandardChart(organizationId)
            }
        }

        return NextResponse.json({
            message: `Contabilidad ${enableAccounting ? 'habilitada' : 'deshabilitada'} exitosamente`,
            enableAccounting: organization.enableAccounting
        })

    } catch (error) {
        console.error('Error updating accounting setup:', error)
        return NextResponse.json({ error: 'Error actualizando configuración' }, { status: 500 })
    }
}
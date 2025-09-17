import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { StandardChartService } from '@/lib/accounting/standard-chart'

// PATCH /api/admin/organizations/[id]/accounting - Habilitar/deshabilitar contabilidad
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        // Verificar que es un admin del sistema
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const organizationId = params.id
        const body = await request.json()
        const { enableAccounting } = body

        if (typeof enableAccounting !== 'boolean') {
            return NextResponse.json({ error: 'enableAccounting must be a boolean' }, { status: 400 })
        }

        // Verificar que la organización existe
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: {
                id: true,
                name: true,
                enableAccounting: true,
                _count: {
                    select: {
                        accounts: true,
                        journalEntries: true,
                        exchangeRates: true
                    }
                }
            }
        })

        if (!organization) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        // Si ya está en el estado deseado, no hacer nada
        if (organization.enableAccounting === enableAccounting) {
            return NextResponse.json({
                message: `Accounting is already ${enableAccounting ? 'enabled' : 'disabled'}`,
                organization: {
                    id: organization.id,
                    name: organization.name,
                    enableAccounting: organization.enableAccounting
                }
            })
        }

        // Si se está deshabilitando, limpiar todos los datos de contabilidad
        if (!enableAccounting) {
            // Obtener estadísticas antes de eliminar
            const statsBefore = {
                accounts: organization._count.accounts,
                journalEntries: organization._count.journalEntries,
                exchangeRates: organization._count.exchangeRates
            }

            // Eliminar en orden para respetar las restricciones de foreign key
            // 1. Eliminar journal entries (referencian accounts)
            await prisma.journalEntry.deleteMany({
                where: { organizationId }
            })

            // 2. Eliminar exchange rates
            await prisma.exchangeRate.deleteMany({
                where: { organizationId }
            })

            // 3. Eliminar accounts (ya no referenciados)
            await prisma.account.deleteMany({
                where: { organizationId }
            })

            console.log(`🗑️ Cleaned accounting data for organization ${organization.name}:`, statsBefore)
        }

        // Actualizar el estado de contabilidad
        const updatedOrganization = await prisma.organization.update({
            where: { id: organizationId },
            data: { enableAccounting },
            select: {
                id: true,
                name: true,
                enableAccounting: true,
                _count: {
                    select: {
                        accounts: true,
                        journalEntries: true
                    }
                }
            }
        })

        // Si se está habilitando y no tiene plan de cuentas, crearlo
        if (enableAccounting) {
            const hasChart = await StandardChartService.hasStandardChart(organizationId)
            if (!hasChart) {
                try {
                    const accountsMap = await StandardChartService.setupStandardChart(organizationId)
                    console.log(`✅ Standard chart created for organization ${organization.name} with ${accountsMap.size} accounts`)
                } catch (error) {
                    console.error('Error setting up standard chart:', error)
                    // No fallar la operación por esto, pero loggear el error
                }
            }
        }

        return NextResponse.json({
            message: `Accounting ${enableAccounting ? 'enabled' : 'disabled'} successfully for organization ${organization.name}`,
            organization: updatedOrganization,
            ...(enableAccounting && { setupCompleted: true })
        })

    } catch (error) {
        console.error('Error updating accounting status:', error)
        return NextResponse.json(
            { error: 'Error updating accounting status' },
            { status: 500 }
        )
    }
}

// GET /api/admin/organizations/[id]/accounting - Obtener estado de contabilidad
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        // Verificar que es un admin del sistema
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const organizationId = params.id

        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: {
                id: true,
                name: true,
                enableAccounting: true,
                _count: {
                    select: {
                        accounts: true,
                        journalEntries: true,
                        exchangeRates: true
                    }
                }
            }
        })

        if (!organization) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        return NextResponse.json({
            organization: {
                id: organization.id,
                name: organization.name,
                enableAccounting: organization.enableAccounting,
                stats: {
                    accounts: organization._count.accounts,
                    journalEntries: organization._count.journalEntries,
                    exchangeRates: organization._count.exchangeRates
                }
            }
        })

    } catch (error) {
        console.error('Error fetching accounting status:', error)
        return NextResponse.json(
            { error: 'Error fetching accounting status' },
            { status: 500 }
        )
    }
}
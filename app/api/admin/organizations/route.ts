import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'

// GET /api/admin/organizations - Obtener todas las organizaciones
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        // Verificar que es un admin del sistema
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        } const { searchParams } = new URL(request.url)
        const includeAccountingStats = searchParams.get('includeAccountingStats') === 'true'

        const organizations = await prisma.organization.findMany({
            include: {
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
                    }
                },
                projects: {
                    select: {
                        id: true,
                        name: true,
                        status: true
                    }
                },
                ...(includeAccountingStats && {
                    _count: {
                        select: {
                            accounts: true,
                            journalEntries: true
                        }
                    }
                })
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        // Calcular estadísticas adicionales
        const stats = {
            total: organizations.length,
            withAccounting: organizations.filter(org => org.enableAccounting).length,
            withoutAccounting: organizations.filter(org => !org.enableAccounting).length,
            totalUsers: organizations.reduce((sum, org) => sum + org.users.length, 0),
            totalProjects: organizations.reduce((sum, org) => sum + org.projects.length, 0),
        }

        return NextResponse.json({
            organizations,
            stats
        })

    } catch (error) {
        console.error('Error fetching organizations:', error)
        return NextResponse.json(
            { error: 'Error fetching organizations' },
            { status: 500 }
        )
    }
}

// POST /api/admin/organizations - Crear nueva organización
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        // Verificar que es un admin del sistema
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        } const body = await request.json()
        const { name, enableAccounting = false } = body

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 })
        }

        // Generar slug único
        const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')

        const organization = await prisma.organization.create({
            data: {
                name,
                slug,
                enableAccounting
            }
        })

        // Si se habilita contabilidad, configurar plan de cuentas
        if (enableAccounting) {
            try {
                const { StandardChartService } = await import('@/lib/accounting/standard-chart')
                await StandardChartService.setupStandardChart(organization.id)
                console.log(`✅ Standard chart of accounts created for organization ${organization.name}`)
            } catch (error) {
                console.error('Error setting up standard chart:', error)
                // No fallar la creación de la organización por esto
            }
        }

        return NextResponse.json({
            organization,
            message: `Organization ${name} created successfully${enableAccounting ? ' with accounting enabled' : ''}`
        }, { status: 201 })

    } catch (error) {
        console.error('Error creating organization:', error)
        return NextResponse.json(
            { error: 'Error creating organization' },
            { status: 500 }
        )
    }
}
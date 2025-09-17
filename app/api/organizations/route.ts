import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { StandardChartService } from '@/lib/accounting/standard-chart'

export async function GET() {
    try {
        const organizations = await prisma.organization.findMany({
            include: {
                _count: {
                    select: {
                        users: true,
                        projects: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(organizations)
    } catch (error) {
        console.error('Error fetching organizations:', error)
        return NextResponse.json(
            { error: 'Error fetching organizations' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { name, email, phone, address, city, country, website, description, plan, enableAccounting } = body

        // Generar slug único
        const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')

        const organization = await prisma.organization.create({
            data: {
                name,
                slug,
                email,
                phone,
                address,
                city,
                country: country || 'Chile',
                website,
                description,
                plan: plan || 'BASIC',
                status: 'ACTIVE',
                enableAccounting: enableAccounting || false
            }
        })

        // Si se habilitó contabilidad, crear plan de cuentas estándar
        if (enableAccounting) {
            try {
                await StandardChartService.setupStandardChart(organization.id)
                console.log(`Plan de cuentas estándar creado para organización ${organization.id}`)
            } catch (chartError) {
                console.error('Error creando plan de cuentas:', chartError)
                // No fallar la creación de la organización por esto
                // Solo loggear el error
            }
        }

        return NextResponse.json(organization, { status: 201 })
    } catch (error) {
        console.error('Error creating organization:', error)
        return NextResponse.json(
            { error: 'Error creating organization' },
            { status: 500 }
        )
    }
}

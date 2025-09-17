import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'

export const dynamic = 'force-dynamic'

// Interfaces para tipar los resultados de las queries
interface SearchResult {
    type: string
    id: string
    title: string
    subtitle: string
    status: string
    url: string
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const query = searchParams.get('q')?.trim()

        if (!query || query.length < 2) {
            return NextResponse.json({ results: [] })
        }

        const organizationId = session.user.organizationId
        const searchTerm = `%${query}%`

        // Buscar proyectos
        const projects = await prisma.$queryRaw`
            SELECT
                'project' as type,
                id,
                name as title,
                description as subtitle,
                status,
                '/projects/' || id as url
            FROM projects
            WHERE "organizationId" = ${organizationId}
            AND (name ILIKE ${searchTerm} OR code ILIKE ${searchTerm} OR description ILIKE ${searchTerm})
            ORDER BY name
            LIMIT 5
        ` as SearchResult[]

        // Buscar clientes
        const clients = await prisma.$queryRaw`
            SELECT
                'client' as type,
                id,
                name as title,
                email as subtitle,
                status,
                '/clients/' || id as url
            FROM clients
            WHERE "organizationId" = ${organizationId}
            AND (name ILIKE ${searchTerm} OR email ILIKE ${searchTerm} OR rut ILIKE ${searchTerm})
            ORDER BY name
            LIMIT 5
        ` as SearchResult[]

        // Buscar empleados
        const employees = await prisma.$queryRaw`
            SELECT
                'employee' as type,
                id,
                ("firstName" || ' ' || "lastName") as title,
                position as subtitle,
                status,
                '/employees/' || id as url
            FROM employees
            WHERE "organizationId" = ${organizationId}
            AND (("firstName" || ' ' || "lastName") ILIKE ${searchTerm} OR email ILIKE ${searchTerm} OR position ILIKE ${searchTerm})
            ORDER BY "firstName", "lastName"
            LIMIT 5
        ` as SearchResult[]

        // Buscar proveedores
        const providers = await prisma.$queryRaw`
            SELECT
                'provider' as type,
                id,
                name as title,
                email as subtitle,
                status,
                '/providers/' || id as url
            FROM providers
            WHERE "organizationId" = ${organizationId}
            AND (name ILIKE ${searchTerm} OR email ILIKE ${searchTerm} OR rut ILIKE ${searchTerm})
            ORDER BY name
            LIMIT 5
        ` as SearchResult[]

        // Buscar facturas
        const invoices = await prisma.$queryRaw`
            SELECT
                'invoice' as type,
                id,
                number as title,
                ("clientName" || ' - $' || amount) as subtitle,
                status,
                '/invoices/' || id as url
            FROM invoices
            WHERE "organizationId" = ${organizationId}
            AND (number ILIKE ${searchTerm} OR "clientName" ILIKE ${searchTerm})
            ORDER BY "createdAt" DESC
            LIMIT 5
        ` as SearchResult[]

        // Buscar inspecciones
        const inspections = await prisma.$queryRaw`
            SELECT
                'inspection' as type,
                id,
                title,
                type::text as subtitle,
                status,
                '/inspections/' || id as url
            FROM inspections
            WHERE "organizationId" = ${organizationId}
            AND (title ILIKE ${searchTerm} OR type::text ILIKE ${searchTerm})
            ORDER BY "createdAt" DESC
            LIMIT 5
        ` as SearchResult[]

        // Combinar todos los resultados
        const allResults = [
            ...projects,
            ...clients,
            ...employees,
            ...providers,
            ...invoices,
            ...inspections
        ].slice(0, 10) // Limitar a 10 resultados totales

        return NextResponse.json({ results: allResults })

    } catch (error) {
        console.error('Error searching:', error)
        return NextResponse.json(
            { error: 'Error searching' },
            { status: 500 }
        )
    }
}

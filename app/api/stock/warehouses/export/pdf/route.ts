import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Verificar que el usuario pertenece a una organización
        const user = await prisma.user.findFirst({
            where: {
                id: session.user.id
            },
            include: {
                organization: true
            }
        })

        if (!user?.organizationId) {
            return NextResponse.json({ error: 'Usuario no autorizado para esta organización' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status') || 'ALL'
        const searchTerm = searchParams.get('searchTerm') || ''
        const sortField = searchParams.get('sortField') || 'name'
        const sortDirection = searchParams.get('sortDirection') || 'asc'

        // Construir filtros
        const where: any = {
            organizationId: user.organizationId
        }

        if (status !== 'ALL') {
            where.isActive = status === 'ACTIVE'
        }

        if (searchTerm) {
            where.OR = [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { code: { contains: searchTerm, mode: 'insensitive' } }
            ]
        }

        // Construir ordenamiento
        const orderBy: any = {}
        switch (sortField) {
            case 'name':
                orderBy.name = sortDirection
                break
            case 'code':
                orderBy.code = sortDirection
                break
            case 'items':
                // Para ordenar por items, necesitamos incluir los stocks
                break
            case 'status':
                orderBy.isActive = sortDirection
                break
            case 'createdAt':
                orderBy.createdAt = sortDirection
                break
            default:
                orderBy.name = 'asc'
        }

        // Obtener almacenes con sus stocks
        const warehouses = await prisma.warehouse.findMany({
            where,
            include: {
                stocks: {
                    include: {
                        material: true
                    }
                }
            },
            orderBy
        })

        // Generar contenido PDF manualmente
        let pdfContent = `ALMACENES - ${new Date().toLocaleDateString('es-ES')}\n\n`
        pdfContent += `Total de almacenes: ${warehouses.length}\n\n`

        // Encabezados
        pdfContent += 'NOMBRE'.padEnd(30) + 'CODIGO'.padEnd(15) + 'DIRECCION'.padEnd(40) + 'ESTADO'.padEnd(10) + 'ITEMS\n'
        pdfContent += '='.repeat(110) + '\n'

        // Datos
        warehouses.forEach(warehouse => {
            const name = (warehouse.name || '').substring(0, 28).padEnd(30)
            const code = (warehouse.code || '-').substring(0, 13).padEnd(15)
            const address = (warehouse.address || 'Sin dirección').substring(0, 38).padEnd(40)
            const status = warehouse.isActive ? 'Activo'.padEnd(10) : 'Inactivo'.padEnd(10)
            const items = warehouse.stocks.reduce((total, stock) => total + stock.quantity, 0).toString().padStart(5)

            pdfContent += `${name}${code}${address}${status}${items}\n`
        })

        // Estadísticas adicionales
        const activeCount = warehouses.filter(w => w.isActive).length
        const inactiveCount = warehouses.filter(w => !w.isActive).length
        const totalItems = warehouses.reduce((total, w) => total + w.stocks.reduce((sum, stock) => sum + stock.quantity, 0), 0)

        pdfContent += '\n' + '='.repeat(110) + '\n'
        pdfContent += `Almacenes Activos: ${activeCount}\n`
        pdfContent += `Almacenes Inactivos: ${inactiveCount}\n`
        pdfContent += `Total de Items: ${totalItems}\n`

        // Crear respuesta con contenido de texto plano
        const response = new NextResponse(pdfContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/plain',
                'Content-Disposition': `attachment; filename=almacenes_${new Date().toISOString().split('T')[0]}.txt`
            }
        })

        return response

    } catch (error) {
        console.error('Error exporting warehouses to PDF:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

export const dynamic = 'force-dynamic'

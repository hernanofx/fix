import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import * as XLSX from 'xlsx'

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

        // Preparar datos para Excel
        const excelData = warehouses.map(warehouse => ({
            'Nombre': warehouse.name,
            'Código': warehouse.code || '',
            'Dirección': warehouse.address || '',
            'Descripción': warehouse.description || '',
            'Estado': warehouse.isActive ? 'Activo' : 'Inactivo',
            'Items Totales': warehouse.stocks.reduce((total, stock) => total + stock.quantity, 0),
            'Fecha Creación': warehouse.createdAt.toLocaleDateString('es-ES')
        }))

        // Crear libro de Excel
        const workbook = XLSX.utils.book_new()
        const worksheet = XLSX.utils.json_to_sheet(excelData)
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Almacenes')

        // Generar buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

        // Devolver archivo
        const response = new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename=almacenes_${new Date().toISOString().split('T')[0]}.xlsx`
            }
        })

        return response

    } catch (error) {
        console.error('Error exporting warehouses to Excel:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

export const dynamic = 'force-dynamic'

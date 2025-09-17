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
        const filterBy = searchParams.get('filterBy') || 'all'
        const searchTerm = searchParams.get('searchTerm') || ''
        const sortField = searchParams.get('sortField') || 'material'
        const sortDirection = searchParams.get('sortDirection') || 'asc'

        // Construir filtros
        const where: any = {
            material: {
                organizationId: user.organizationId
            },
            warehouse: {
                organizationId: user.organizationId
            }
        }

        // Aplicar filtros de búsqueda
        if (searchTerm) {
            where.OR = [
                { material: { name: { contains: searchTerm, mode: 'insensitive' } } },
                { material: { code: { contains: searchTerm, mode: 'insensitive' } } },
                { warehouse: { name: { contains: searchTerm, mode: 'insensitive' } } }
            ]
        }

        // Aplicar filtros de stock
        if (filterBy === 'low') {
            where.material.minStock = { not: null }
            where.quantity = { lte: where.material.minStock }
        } else if (filterBy === 'out') {
            where.quantity = { lte: 0 }
        }

        // Construir ordenamiento
        const orderBy: any = {}
        switch (sortField) {
            case 'material':
                orderBy.material = { name: sortDirection }
                break
            case 'code':
                orderBy.material = { code: sortDirection }
                break
            case 'rubro':
                orderBy.material = { rubro: { name: sortDirection } }
                break
            case 'warehouse':
                orderBy.warehouse = { name: sortDirection }
                break
            case 'quantity':
                orderBy.quantity = sortDirection
                break
            case 'available':
                // Para ordenar por disponible, necesitamos calcularlo
                break
            case 'status':
                // Para ordenar por status, es más complejo
                break
            default:
                orderBy.material = { name: 'asc' }
        }

        // Obtener stocks con relaciones
        const stocks = await prisma.stock.findMany({
            where,
            include: {
                material: {
                    include: {
                        rubro: true
                    }
                },
                warehouse: true
            },
            orderBy
        })

        // Preparar datos para Excel
        const excelData = stocks.map(stock => {
            const available = stock.quantity - stock.reserved
            let status = 'Normal'
            if (available <= 0) {
                status = 'Sin Stock'
            } else if (stock.material.minStock && available <= stock.material.minStock) {
                status = 'Stock Bajo'
            } else if (stock.material.maxStock && available >= stock.material.maxStock) {
                status = 'Stock Alto'
            }

            return {
                'Material': stock.material.name,
                'Código': stock.material.code || '',
                'Rubro': stock.material.rubro?.name || '',
                'Almacén': stock.warehouse.name,
                'Unidad': stock.material.unit,
                'Cantidad': stock.quantity,
                'Reservado': stock.reserved,
                'Disponible': available,
                'Estado': status,
                'Precio Costo': stock.material.costPrice || '',
                'Precio Venta': stock.material.salePrice || ''
            }
        })

        // Crear libro de Excel
        const workbook = XLSX.utils.book_new()
        const worksheet = XLSX.utils.json_to_sheet(excelData)
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Stocks')

        // Generar buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

        // Devolver archivo
        const response = new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename=stocks_${new Date().toISOString().split('T')[0]}.xlsx`
            }
        })

        return response

    } catch (error) {
        console.error('Error exporting stocks to Excel:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

export const dynamic = 'force-dynamic'

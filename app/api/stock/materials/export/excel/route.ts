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

        const { searchParams } = new URL(request.url)
        const statusFilter = searchParams.get('status') || 'ALL'
        const rubroFilter = searchParams.get('rubro') || 'ALL'
        const rubroTypeFilter = searchParams.get('rubroType') || 'ALL'
        const stockFilter = searchParams.get('stock') || 'ALL'
        const searchTerm = searchParams.get('searchTerm') || ''
        const sortField = searchParams.get('sortField') || 'name'
        const sortDirection = searchParams.get('sortDirection') || 'asc'

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

        // Construir filtros
        let whereClause: any = {
            organizationId: user.organizationId
        }

        // Aplicar filtro de estado
        if (statusFilter !== 'ALL') {
            whereClause.status = statusFilter
        }

        // Aplicar filtro de rubro
        if (rubroFilter !== 'ALL') {
            whereClause.rubroId = rubroFilter
        }

        // Aplicar filtro de tipo de rubro
        if (rubroTypeFilter !== 'ALL') {
            whereClause.rubro = {
                type: rubroTypeFilter
            }
        }

        // Aplicar filtro de búsqueda
        if (searchTerm.trim()) {
            whereClause.OR = [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { code: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } }
            ].filter(Boolean)
        }

        // Obtener los materiales filtrados con sus relaciones
        const materials = await prisma.material.findMany({
            where: whereClause,
            include: {
                rubro: true,
                stocks: {
                    include: {
                        warehouse: true
                    }
                }
            },
            orderBy: {
                [sortField]: sortDirection
            }
        })

        // Preparar datos para Excel
        const excelData = materials.map(material => {
            const totalStock = material.stocks.reduce((sum, stock) => sum + stock.quantity, 0)
            const warehouses = material.stocks.map(stock => `${stock.warehouse.name}: ${stock.quantity}`).join('; ')

            return {
                'Nombre': material.name,
                'Código': material.code || '',
                'Descripción': material.description || '',
                'Unidad': material.unit,
                'Stock Mínimo': material.minStock || '',
                'Stock Máximo': material.maxStock || '',
                'Precio Costo': material.costPrice || '',
                'Precio Venta': material.salePrice || '',
                'Stock Total': totalStock,
                'Almacenes': warehouses,
                'Rubro': material.rubro?.name || '',
                'Estado': material.status === 'ACTIVE' ? 'Activo' :
                    material.status === 'INACTIVE' ? 'Inactivo' : 'Archivado',
                'Fecha Creación': material.createdAt ? new Date(material.createdAt).toLocaleDateString('es-ES') : ''
            }
        })

        // Crear workbook y worksheet
        const workbook = XLSX.utils.book_new()
        const worksheet = XLSX.utils.json_to_sheet(excelData)

        // Configurar anchos de columna
        const columnWidths = [
            { wch: 30 }, // Nombre
            { wch: 15 }, // Código
            { wch: 40 }, // Descripción
            { wch: 15 }, // Unidad
            { wch: 15 }, // Stock Mínimo
            { wch: 15 }, // Stock Máximo
            { wch: 15 }, // Precio Costo
            { wch: 15 }, // Precio Venta
            { wch: 15 }, // Stock Total
            { wch: 40 }, // Almacenes
            { wch: 20 }, // Rubro
            { wch: 15 }, // Estado
            { wch: 15 }  // Fecha Creación
        ]
        worksheet['!cols'] = columnWidths

        // Agregar worksheet al workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Materiales')

        // Generar buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

        // Devolver el archivo Excel
        const response = new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="materiales_${new Date().toISOString().split('T')[0]}.xlsx"`
            }
        })

        return response

    } catch (error) {
        console.error('Error exporting to Excel:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

export const dynamic = 'force-dynamic'

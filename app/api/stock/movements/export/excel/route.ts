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
        const sortField = searchParams.get('sortField') || 'date'
        const sortDirection = searchParams.get('sortDirection') || 'desc'

        // Construir filtros
        const where: any = {
            organizationId: user.organizationId
        }

        // Aplicar filtros de tipo
        if (filterBy !== 'all') {
            where.type = filterBy
        }

        // Aplicar filtros de búsqueda
        if (searchTerm) {
            where.OR = [
                { material: { name: { contains: searchTerm, mode: 'insensitive' } } },
                { material: { code: { contains: searchTerm, mode: 'insensitive' } } },
                { reference: { contains: searchTerm, mode: 'insensitive' } },
                { fromWarehouse: { name: { contains: searchTerm, mode: 'insensitive' } } },
                { toWarehouse: { name: { contains: searchTerm, mode: 'insensitive' } } }
            ]
        }

        // Construir ordenamiento
        const orderBy: any = {}
        switch (sortField) {
            case 'date':
                orderBy.date = sortDirection
                break
            case 'material':
                orderBy.material = { name: sortDirection }
                break
            case 'type':
                orderBy.type = sortDirection
                break
            case 'quantity':
                orderBy.quantity = sortDirection
                break
            case 'warehouse':
                // Para ordenar por warehouse, es más complejo
                break
            default:
                orderBy.date = 'desc'
        }

        // Obtener movimientos con relaciones
        const movements = await prisma.stockMovement.findMany({
            where,
            include: {
                material: true,
                fromWarehouse: true,
                toWarehouse: true
            },
            orderBy
        })

        // Preparar datos para Excel
        const excelData = movements.map(movement => {
            const formatDate = (date: Date) => {
                return date.toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                })
            }

            return {
                'Fecha': formatDate(new Date(movement.date)),
                'Tipo': movement.type === 'ENTRADA' ? 'Entrada' :
                    movement.type === 'SALIDA' ? 'Salida' : 'Transferencia',
                'Material': movement.material.name,
                'Código': movement.material.code || '',
                'Cantidad': movement.quantity,
                'Unidad': movement.material.unit,
                'Origen': movement.fromWarehouse?.name || '',
                'Destino': movement.toWarehouse?.name || '',
                'Descripción': movement.description || '',
                'Referencia': movement.reference || '',
                'Fecha Creación': formatDate(new Date(movement.createdAt))
            }
        })

        // Crear libro de Excel
        const workbook = XLSX.utils.book_new()
        const worksheet = XLSX.utils.json_to_sheet(excelData)
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Movimientos')

        // Generar buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

        // Devolver archivo
        const response = new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename=movimientos_${new Date().toISOString().split('T')[0]}.xlsx`
            }
        })

        return response

    } catch (error) {
        console.error('Error exporting movements to Excel:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

export const dynamic = 'force-dynamic'

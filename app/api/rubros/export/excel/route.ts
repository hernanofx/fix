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
        const typeFilter = searchParams.get('type') || 'ALL'
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

        // Aplicar filtro de tipo
        if (typeFilter !== 'ALL') {
            whereClause.type = typeFilter
        }

        // Aplicar filtro de búsqueda
        if (searchTerm.trim()) {
            whereClause.OR = [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { code: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } }
            ].filter(Boolean)
        }

        // Obtener los rubros filtrados
        const rubros = await prisma.rubro.findMany({
            where: whereClause,
            orderBy: {
                [sortField]: sortDirection
            }
        })

        // Preparar datos para Excel
        const excelData = rubros.map(rubro => ({
            'Nombre': rubro.name,
            'Código': rubro.code || '',
            'Tipo': rubro.type === 'PROVIDER' ? 'Proveedor' : 'Cliente',
            'Descripción': rubro.description || '',
            'Estado': rubro.status === 'ACTIVE' ? 'Activo' :
                rubro.status === 'INACTIVE' ? 'Inactivo' : 'Archivado',
            'Color': rubro.color || '',
            'Fecha Creación': rubro.createdAt ? new Date(rubro.createdAt).toLocaleDateString('es-ES') : ''
        }))

        // Crear workbook y worksheet
        const workbook = XLSX.utils.book_new()
        const worksheet = XLSX.utils.json_to_sheet(excelData)

        // Configurar anchos de columna
        const columnWidths = [
            { wch: 30 }, // Nombre
            { wch: 15 }, // Código
            { wch: 15 }, // Tipo
            { wch: 40 }, // Descripción
            { wch: 15 }, // Estado
            { wch: 15 }, // Color
            { wch: 15 }  // Fecha Creación
        ]
        worksheet['!cols'] = columnWidths

        // Agregar worksheet al workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Rubros')

        // Generar buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

        // Devolver el archivo Excel
        const response = new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="rubros_${new Date().toISOString().split('T')[0]}.xlsx"`
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

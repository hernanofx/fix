import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import jsPDF from 'jspdf'

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

        // Crear documento PDF
        const doc = new jsPDF()

        // Título
        doc.setFontSize(20)
        doc.text('Lista de Materiales', 20, 20)

        // Información de la organización
        doc.setFontSize(12)
        doc.text(`Organización: ${user.organization?.name || 'N/A'}`, 20, 35)
        doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 20, 45)
        doc.text(`Total de materiales: ${materials.length}`, 20, 55)

        // Crear contenido del PDF manualmente
        let yPosition = 65
        const lineHeight = 8
        const pageHeight = doc.internal.pageSize.height

        materials.forEach((material, index) => {
            // Verificar si necesitamos una nueva página
            if (yPosition > pageHeight - 20) {
                doc.addPage()
                yPosition = 20
            }

            // Nombre del material
            doc.setFontSize(10)
            doc.setFont('helvetica', 'bold')
            doc.text(`Material ${index + 1}: ${material.name}`, 20, yPosition)
            yPosition += lineHeight

            // Código
            if (material.code) {
                doc.setFont('helvetica', 'normal')
                doc.setFontSize(8)
                doc.text(`Código: ${material.code}`, 20, yPosition)
                yPosition += lineHeight
            }

            // Unidad y precios
            doc.text(`Unidad: ${material.unit}`, 20, yPosition)
            yPosition += lineHeight

            if (material.costPrice) {
                doc.text(`Precio Costo: $${material.costPrice}`, 20, yPosition)
                yPosition += lineHeight
            }

            if (material.salePrice) {
                doc.text(`Precio Venta: $${material.salePrice}`, 20, yPosition)
                yPosition += lineHeight
            }

            // Stock
            const totalStock = material.stocks.reduce((sum, stock) => sum + stock.quantity, 0)
            doc.text(`Stock Total: ${totalStock} ${material.unit}`, 20, yPosition)
            yPosition += lineHeight

            // Rubro
            if (material.rubro) {
                doc.text(`Rubro: ${material.rubro.name}`, 20, yPosition)
                yPosition += lineHeight
            }

            // Estado
            const statusText = material.status === 'ACTIVE' ? 'Activo' :
                material.status === 'INACTIVE' ? 'Inactivo' : 'Archivado'
            doc.text(`Estado: ${statusText}`, 20, yPosition)
            yPosition += lineHeight

            // Espacio entre materiales
            yPosition += lineHeight
        })

        // Generar buffer del PDF
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

        // Devolver el archivo PDF
        const response = new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="materiales_${new Date().toISOString().split('T')[0]}.pdf"`
            }
        })

        return response

    } catch (error) {
        console.error('Error exporting to PDF:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

export const dynamic = 'force-dynamic'

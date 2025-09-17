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

        // Crear documento PDF
        const doc = new jsPDF()

        // Título
        doc.setFontSize(20)
        doc.text('Lista de Rubros', 20, 20)

        // Información de la organización
        doc.setFontSize(12)
        doc.text(`Organización: ${user.organization?.name || 'N/A'}`, 20, 35)
        doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 20, 45)
        doc.text(`Total de rubros: ${rubros.length}`, 20, 55)

        // Crear contenido del PDF manualmente
        let yPosition = 65
        const lineHeight = 8
        const pageHeight = doc.internal.pageSize.height

        rubros.forEach((rubro, index) => {
            // Verificar si necesitamos una nueva página
            if (yPosition > pageHeight - 20) {
                doc.addPage()
                yPosition = 20
            }

            // Nombre del rubro
            doc.setFontSize(10)
            doc.setFont('helvetica', 'bold')
            doc.text(`Rubro ${index + 1}: ${rubro.name}`, 20, yPosition)
            yPosition += lineHeight

            // Código
            if (rubro.code) {
                doc.setFont('helvetica', 'normal')
                doc.setFontSize(8)
                doc.text(`Código: ${rubro.code}`, 20, yPosition)
                yPosition += lineHeight
            }

            // Tipo
            doc.text(`Tipo: ${rubro.type === 'PROVIDER' ? 'Proveedor' : 'Cliente'}`, 20, yPosition)
            yPosition += lineHeight

            // Estado
            const statusText = rubro.status === 'ACTIVE' ? 'Activo' :
                rubro.status === 'INACTIVE' ? 'Inactivo' : 'Archivado'
            doc.text(`Estado: ${statusText}`, 20, yPosition)
            yPosition += lineHeight

            // Descripción
            if (rubro.description) {
                doc.text(`Descripción: ${rubro.description}`, 20, yPosition)
                yPosition += lineHeight
            }

            // Espacio entre rubros
            yPosition += lineHeight
        })

        // Generar buffer del PDF
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

        // Devolver el archivo PDF
        const response = new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="rubros_${new Date().toISOString().split('T')[0]}.pdf"`
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

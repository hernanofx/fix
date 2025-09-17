import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        // Verificar autenticación
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Obtener usuario con organización
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { organization: true }
        })

        if (!user?.organizationId) {
            return NextResponse.json({ error: 'Usuario sin organización' }, { status: 400 })
        }

        // Obtener todos los clientes de la organización
        const clients = await prisma.client.findMany({
            where: { organizationId: user.organizationId },
            include: {
                createdBy: {
                    select: { name: true, email: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        // Crear documento PDF
        const doc = new jsPDF()

        // Configurar fuente y colores
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(18)
        doc.setTextColor(40, 40, 40)

        // Título
        doc.text('Lista de Clientes', 20, 30)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'normal')
        doc.text(`Organización: ${user.organization.name}`, 20, 45)
        doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, 20, 55)
        doc.text(`Total de clientes: ${clients.length}`, 20, 65)

        // Línea separadora
        doc.setDrawColor(200, 200, 200)
        doc.line(20, 70, 190, 70)

        let yPosition = 80
        const pageHeight = doc.internal.pageSize.height
        const marginBottom = 20

        clients.forEach((client, index) => {
            // Verificar si necesitamos una nueva página
            if (yPosition > pageHeight - marginBottom - 40) {
                doc.addPage()
                yPosition = 30
            }

            // Nombre del cliente
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(11)
            doc.text(`${index + 1}. ${client.name}`, 20, yPosition)
            yPosition += 8

            // Información básica
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(9)
            doc.text(`Email: ${client.email || 'No especificado'}`, 25, yPosition)
            yPosition += 6
            doc.text(`Teléfono: ${client.phone || 'No especificado'}`, 25, yPosition)
            yPosition += 6
            doc.text(`Estado: ${client.status === 'ACTIVE' ? 'Activo' :
                client.status === 'INACTIVE' ? 'Inactivo' :
                    client.status === 'PROSPECT' ? 'Prospecto' : 'Archivado'}`, 25, yPosition)
            yPosition += 6

            // Dirección si existe
            if (client.address || client.city || client.country) {
                const addressParts = [client.address, client.city, client.country].filter(Boolean)
                doc.text(`Dirección: ${addressParts.join(', ')}`, 25, yPosition)
                yPosition += 6
            }

            // Contacto si existe
            if (client.contactName || client.contactPhone) {
                if (client.contactName) {
                    doc.text(`Contacto: ${client.contactName}`, 25, yPosition)
                    yPosition += 6
                }
                if (client.contactPhone) {
                    doc.text(`Tel. Contacto: ${client.contactPhone}`, 25, yPosition)
                    yPosition += 6
                }
            }

            // Fecha de creación
            doc.setFontSize(8)
            doc.setTextColor(100, 100, 100)
            doc.text(`Creado: ${client.createdAt.toLocaleDateString('es-ES')} por ${client.createdBy?.name || 'Sistema'}`, 25, yPosition)
            yPosition += 10

            // Línea separadora entre clientes
            doc.setDrawColor(240, 240, 240)
            doc.line(20, yPosition, 190, yPosition)
            yPosition += 5

            doc.setTextColor(40, 40, 40)
        })

        // Pie de página
        const totalPages = doc.getNumberOfPages()
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i)
            doc.setFontSize(8)
            doc.setTextColor(150, 150, 150)
            doc.text(`Página ${i} de ${totalPages}`, 20, pageHeight - 10)
            doc.text('Generado por Pix - Sistema de Gestión', 120, pageHeight - 10)
        }

        // Generar buffer
        const buffer = doc.output('arraybuffer')

        // Configurar headers para descarga
        const headers = new Headers()
        headers.set('Content-Type', 'application/pdf')
        headers.set('Content-Disposition', `attachment; filename="clientes_${user.organization.name}_${new Date().toISOString().split('T')[0]}.pdf"`)

        return new NextResponse(buffer, {
            status: 200,
            headers
        })

    } catch (error) {
        console.error('Error exportando clientes a PDF:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

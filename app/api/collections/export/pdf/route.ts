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

        // Obtener todas las cobranzas de la organización
        const collections = await prisma.payment.findMany({
            where: {
                organizationId: user.organizationId
            },
            include: {
                client: {
                    select: { name: true }
                },
                project: {
                    select: { name: true }
                },
                rubro: {
                    select: { name: true }
                },
                cashBox: {
                    select: { name: true }
                },
                bankAccount: {
                    select: { name: true, bankName: true }
                },
                createdBy: {
                    select: { name: true }
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
        doc.text('Lista de Cobranzas', 20, 30)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'normal')
        doc.text(`Organización: ${user.organization.name}`, 20, 45)
        doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, 20, 55)
        doc.text(`Total de cobranzas: ${collections.length}`, 20, 65)

        // Línea separadora
        doc.setDrawColor(200, 200, 200)
        doc.line(20, 70, 190, 70)

        let yPosition = 80
        const pageHeight = doc.internal.pageSize.height
        const marginBottom = 20

        collections.forEach((collection, index) => {
            // Verificar si necesitamos una nueva página
            if (yPosition > pageHeight - marginBottom - 50) {
                doc.addPage()
                yPosition = 30
            }

            // Descripción de la cobranza
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(11)
            const description = collection.description || `Cobranza ${collection.id.slice(-8)}`
            doc.text(`${index + 1}. ${description}`, 20, yPosition)
            yPosition += 8

            // Información básica
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(9)
            doc.text(`Monto: ${collection.currency === 'PESOS' ? '$' : collection.currency === 'USD' ? 'USD ' : 'EUR '}${collection.amount.toLocaleString('es-ES')}`, 25, yPosition)
            yPosition += 6
            doc.text(`Estado: ${collection.status === 'PENDING' ? 'Pendiente' :
                collection.status === 'PAID' ? 'Pagado' :
                    collection.status === 'PARTIAL' ? 'Parcial' :
                        collection.status === 'OVERDUE' ? 'Vencido' : 'Cancelado'}`, 25, yPosition)
            yPosition += 6
            doc.text(`Método: ${collection.method === 'CASH' ? 'Efectivo' :
                collection.method === 'TRANSFER' ? 'Transferencia' :
                    collection.method === 'CHECK' ? 'Cheque' :
                        collection.method === 'DEBIT_CARD' ? 'Débito' : 'Crédito'}`, 25, yPosition)
            yPosition += 6

            // Fechas
            if (collection.dueDate) {
                doc.text(`Vencimiento: ${collection.dueDate.toLocaleDateString('es-ES')}`, 25, yPosition)
                yPosition += 6
            }
            if (collection.paidDate) {
                doc.text(`Fecha de pago: ${collection.paidDate.toLocaleDateString('es-ES')}`, 25, yPosition)
                yPosition += 6
            }

            // Cliente y proyecto
            if (collection.client?.name) {
                doc.text(`Cliente: ${collection.client.name}`, 25, yPosition)
                yPosition += 6
            }
            if (collection.project?.name) {
                doc.text(`Proyecto: ${collection.project.name}`, 25, yPosition)
                yPosition += 6
            }
            if (collection.rubro?.name) {
                doc.text(`Rubro: ${collection.rubro.name}`, 25, yPosition)
                yPosition += 6
            }

            // Cuenta donde se depositó
            if (collection.cashBox?.name) {
                doc.text(`Caja: ${collection.cashBox.name}`, 25, yPosition)
                yPosition += 6
            }
            if (collection.bankAccount?.name) {
                doc.text(`Cuenta: ${collection.bankAccount.name} (${collection.bankAccount.bankName})`, 25, yPosition)
                yPosition += 6
            }

            // Referencia y notas
            if (collection.reference) {
                doc.text(`Referencia: ${collection.reference}`, 25, yPosition)
                yPosition += 6
            }
            if (collection.notes) {
                doc.text(`Notas: ${collection.notes}`, 25, yPosition)
                yPosition += 6
            }

            // Fecha de creación
            doc.setFontSize(8)
            doc.setTextColor(100, 100, 100)
            doc.text(`Creado: ${collection.createdAt.toLocaleDateString('es-ES')} por ${collection.createdBy?.name || 'Sistema'}`, 25, yPosition)
            yPosition += 10

            // Línea separadora entre cobranzas
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
        headers.set('Content-Disposition', `attachment; filename="cobranzas_${user.organization.name}_${new Date().toISOString().split('T')[0]}.pdf"`)

        return new NextResponse(buffer, {
            status: 200,
            headers
        })

    } catch (error) {
        console.error('Error exportando cobranzas a PDF:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
